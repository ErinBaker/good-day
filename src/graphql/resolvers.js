import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    memory: async (_, { id }) => {
      return prisma.memory.findUnique({
        where: { id: Number(id) },
        include: { people: true, photos: true },
      });
    },
    memories: async (_, { limit = 10, offset = 0, sortBy = 'date' }) => {
      return prisma.memory.findMany({
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: 'desc' },
        include: { people: true, photos: true },
      });
    },
    person: async (_, { id }) => {
      return prisma.person.findUnique({
        where: { id: Number(id) },
        include: { memories: true },
      });
    },
    people: async (_, { limit = 10, offset = 0, sortBy = 'name' }) => {
      return prisma.person.findMany({
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: 'asc' },
        include: { memories: true },
      });
    },
  },
  Mutation: {
    createMemory: async (_, { input }) => {
      const memory = await prisma.memory.create({
        data: {
          title: input.title,
          date: input.date,
          description: input.description,
          photoUrl: input.photoUrl,
          people: {
            connect: input.peopleIds?.map(id => ({ id: Number(id) })) || [],
          },
        },
        include: { people: true, photos: true },
      });
      return memory;
    },
    updateMemory: async (_, { id, input }) => {
      const memory = await prisma.memory.update({
        where: { id: Number(id) },
        data: {
          title: input.title,
          date: input.date,
          description: input.description,
          photoUrl: input.photoUrl,
          people: {
            set: input.peopleIds?.map(id => ({ id: Number(id) })) || [],
          },
        },
        include: { people: true, photos: true },
      });
      return memory;
    },
    deleteMemory: async (_, { id }) => {
      await prisma.memory.delete({ where: { id: Number(id) } });
      return true;
    },
    createPerson: async (_, { input }) => {
      // Validation: name is required and not empty after trimming
      const name = input.name?.trim();
      if (!name) {
        throw new Error('Name is required and cannot be empty.');
      }
      // Duplicate detection (case-insensitive, trimmed)
      const existing = await prisma.person.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });
      if (existing) {
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
      // Duplicate detection (case-insensitive, trimmed, exclude self)
      const existing = await prisma.person.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
          NOT: { id: Number(id) },
        },
      });
      if (existing) {
        throw new Error('A person with this name already exists.');
      }
      return prisma.person.update({
        where: { id: Number(id) },
        data: {
          name,
          relationship: input.relationship,
        },
        include: { memories: true },
      });
    },
    deletePerson: async (_, { id }) => {
      await prisma.person.delete({ where: { id: Number(id) } });
      return true;
    },
    tagPersonInMemory: async (_, { memoryId, personId }) => {
      return prisma.memory.update({
        where: { id: Number(memoryId) },
        data: {
          people: {
            connect: { id: Number(personId) },
          },
        },
        include: { people: true, photos: true },
      });
    },
    removePersonFromMemory: async (_, { memoryId, personId }) => {
      return prisma.memory.update({
        where: { id: Number(memoryId) },
        data: {
          people: {
            disconnect: { id: Number(personId) },
          },
        },
        include: { people: true, photos: true },
      });
    },
  },
  Memory: {
    people: async (parent) => {
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
      return prisma.memory.findMany({
        where: { people: { some: { id: parent.id } } },
      });
    },
  },
};

export default resolvers; 