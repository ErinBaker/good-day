import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    memory: async (_, { id }) => {
      return prisma.memory.findUnique({
        where: { id },
        include: { people: true, photos: true },
      });
    },
    memories: async (_, { limit = 10, offset = 0, sortBy = 'date', dateFrom, dateTo, peopleIds }) => {
      const where = {};
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom);
        if (dateTo) where.date.lte = new Date(dateTo);
      }
      if (peopleIds && peopleIds.length > 0) {
        where.people = {
          every: {
            id: { in: peopleIds }
          }
        };
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
      const where = search
        ? { name: { contains: search } }
        : {};
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
      return {
        minDate: min?.date ? min.date.toISOString() : null,
        maxDate: max?.date ? max.date.toISOString() : null,
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
      await prisma.memory.delete({ where: { id } });
      return true;
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