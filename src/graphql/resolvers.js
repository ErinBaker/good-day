import { PrismaClient } from '@prisma/client';
import { searchMemories as searchMemoriesService } from '../app/services/memorySearch.js';
const prisma = new PrismaClient();

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    memory: async (_, { id }) => {
      const memory = await prisma.memory.findUnique({
        where: { id },
        include: { people: true, photos: true },
      });
      if (!memory) throw new Error('Memory not found');

      // Find previous and next memory IDs by date
      const previous = await prisma.memory.findFirst({
        where: { date: { lt: memory.date } },
        orderBy: { date: 'desc' },
        select: { id: true },
      });
      const next = await prisma.memory.findFirst({
        where: { date: { gt: memory.date } },
        orderBy: { date: 'asc' },
        select: { id: true },
      });

      return {
        ...memory,
        previousMemoryId: previous?.id || null,
        nextMemoryId: next?.id || null,
      };
    },
    memories: async (_, { limit = 10, offset = 0, sortBy = 'date', dateFrom, dateTo, peopleIds, text }) => {
      const where = {};
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) where.date.lte = dateTo;
      }
      if (peopleIds && peopleIds.length > 0) {
        where.people = {
          some: {
            id: { in: peopleIds }
          }
        };
      }
      if (text && text.trim() !== "") {
        where.OR = [
          { title: { contains: text } },
          { description: { contains: text } }
        ];
      }
      const orderBy = [
        { [sortBy]: 'desc' },
        { id: 'asc' }, // secondary sort for deterministic order
      ];
      const [items, totalCount] = await Promise.all([
        prisma.memory.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy,
          include: { people: true, photos: true },
        }),
        prisma.memory.count({ where }),
      ]);
      console.log('memories query:', { offset, limit, count: items.length, totalCount, ids: items.map(i => i.id) });
      return { items, totalCount };
    },
    person: async (_, { id }) => {
      return prisma.person.findUnique({
        where: { id },
        include: { memories: true },
      });
    },
    people: async (_, { search, limit = 50, offset = 0, sortBy = 'name' }) => {
      let where = {};
      if (search) {
        where.name = { contains: search };
      }
      return prisma.person.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: 'asc' },
        include: { memories: true },
      });
    },
    memoryDateRange: async () => {
      const min = await prisma.memory.findFirst({ orderBy: { date: 'asc' }, select: { date: true } });
      const max = await prisma.memory.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });

      function toIso(val) {
        if (!val) return null;
        if (typeof val === 'string') return val;
        if (val instanceof Date) return val.toISOString();
        return null;
      }

      return {
        minDate: toIso(min?.date),
        maxDate: toIso(max?.date),
      };
    },
    searchMemories: async (_, args) => {
      return searchMemoriesService(args);
    },
    memoryStatistics: async () => {
      const [totalMemories, totalPeople] = await Promise.all([
        prisma.memory.count(),
        prisma.person.count(),
      ]);
      return { totalMemories, totalPeople };
    },
    memoryTimeSeries: async (_, { interval = 'month' } = {}) => {
      // Supported intervals: day, week, month
      // We'll use SQLite strftime for grouping
      let format;
      if (interval === 'day') format = '%Y-%m-%d';
      else if (interval === 'week') format = '%Y-%W';
      else format = '%Y-%m';
      // Raw query for grouping by date
      const results = await prisma.$queryRawUnsafe(
        `SELECT strftime('${format}', date) as period, COUNT(*) as count FROM Memory GROUP BY period ORDER BY period ASC`
      );
      return results.map(r => ({ date: r.period, count: Number(r.count) }));
    },
    personTagStats: async (_, { limit = 10 } = {}) => {
      // Get people and their memory counts, sorted desc
      const people = await prisma.person.findMany({
        include: { memories: true },
      });
      const stats = people
        .map(p => ({ person: p, tagCount: p.memories.length }))
        .sort((a, b) => b.tagCount - a.tagCount)
        .slice(0, limit);
      return stats;
    },
    memoryDateRangeStats: async () => {
      const min = await prisma.memory.findFirst({ orderBy: { date: 'asc' }, select: { date: true } });
      const max = await prisma.memory.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
      return {
        minDate: min?.date || null,
        maxDate: max?.date || null,
      };
    },
  },
  Mutation: {
    createMemory: async (_, { input }) => {
      // Step 1: Create the memory without people
      const memory = await prisma.memory.create({
        data: {
          title: input.title,
          date: input.date,
          description: input.description,
          photoUrl: input.photoUrl,
        },
        include: { people: true, photos: true },
      });

      // Step 2: Connect people in a separate update
      if (input.peopleIds && input.peopleIds.length > 0) {
        await prisma.memory.update({
          where: { id: memory.id },
          data: {
            people: {
              connect: input.peopleIds.map(id => ({ id })),
            },
          },
        });
      }

      // Step 3: Return the memory (optionally re-fetch with people)
      return prisma.memory.findUnique({
        where: { id: memory.id },
        include: { people: true, photos: true },
      });
    },
    updateMemory: async (_, { id, input }) => {
      // Build update data object only with provided fields
      const data = {};
      if (typeof input.title !== 'undefined') data.title = input.title;
      if (typeof input.date !== 'undefined') data.date = input.date;
      if (typeof input.description !== 'undefined') data.description = input.description;
      if (typeof input.photoUrl !== 'undefined') data.photoUrl = input.photoUrl;
      if (typeof input.peopleIds !== 'undefined') {
        data.people = { set: input.peopleIds.map(id => ({ id })) };
      }
      const memory = await prisma.memory.update({
        where: { id },
        data,
        include: { people: true, photos: true },
      });
      return memory;
    },
    deleteMemory: async (_, { id }) => {
      console.log(`[deleteMemory] Attempting to delete memory with id: ${id}`);
      try {
        await prisma.memory.delete({ where: { id } });
        console.log(`[deleteMemory] Successfully deleted memory with id: ${id}`);
        return true;
      } catch (error) {
        console.error(`[deleteMemory] Failed to delete memory with id: ${id}`, error);
        throw error;
      }
    },
    createPerson: async (_, { input }) => {
      // Validation: name is required and not empty after trimming
      const name = input.name?.trim();
      if (!name) {
        throw new Error('Name is required and cannot be empty.');
      }
      // Duplicate detection (case-insensitive, trimmed) in JS
      const possible = await prisma.person.findMany({
        where: {
          // Optionally, you could use 'contains' for partial match, but here we fetch all
        },
      });
      const exists = possible.some(p => p.name.trim().toLowerCase() === name.toLowerCase());
      if (exists) {
        throw new Error('A person with this name already exists.');
      }
      return prisma.person.create({
        data: {
          name,
          relationship: input.relationship,
        },
        include: { memories: true },
      });
    },
    updatePerson: async (_, { id, input }) => {
      // Validation: name is required and not empty after trimming
      const name = input.name?.trim();
      if (!name) {
        throw new Error('Name is required and cannot be empty.');
      }
      // Duplicate detection (case-insensitive, trimmed, exclude self) in JS
      const possible = await prisma.person.findMany({
        where: {
          // Optionally, you could use 'contains' for partial match, but here we fetch all
        },
      });
      const exists = possible.some(p => p.id !== id && p.name.trim().toLowerCase() === name.toLowerCase());
      if (exists) {
        throw new Error('A person with this name already exists.');
      }
      return prisma.person.update({
        where: { id },
        data: {
          name,
          relationship: input.relationship,
        },
        include: { memories: true },
      });
    },
    deletePerson: async (_, { id }) => {
      await prisma.person.delete({ where: { id } });
      return true;
    },
    tagPersonInMemory: async (_, { memoryId, personId }) => {
      return prisma.memory.update({
        where: { id: memoryId },
        data: {
          people: {
            connect: { id: personId },
          },
        },
        include: { people: true, photos: true },
      });
    },
    removePersonFromMemory: async (_, { memoryId, personId }) => {
      return prisma.memory.update({
        where: { id: memoryId },
        data: {
          people: {
            disconnect: { id: personId },
          },
        },
        include: { people: true, photos: true },
      });
    },
  },
  Memory: {
    people: async (parent) => {
      // Direct many-to-many: just return parent.people if available, else query
      if (parent.people) return parent.people;
      return prisma.person.findMany({
        where: { memories: { some: { id: parent.id } } },
      });
    },
    photos: async (parent) => {
      return prisma.photo.findMany({
        where: { memoryId: parent.id },
      });
    },
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
  },
  Person: {
    memories: async (parent) => {
      // Direct many-to-many: just return parent.memories if available, else query
      if (parent.memories) return parent.memories;
      return prisma.memory.findMany({
        where: { people: { some: { id: parent.id } } },
      });
    },
    createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
    updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
  },
};

export default resolvers; 