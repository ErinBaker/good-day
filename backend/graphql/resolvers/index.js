const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    memory: async (_, { id }) => {
      const memory = await prisma.memory.findUnique({ where: { id } });
      if (!memory) return null;
      return memory;
    },
    memories: async (_, { limit = 10, offset = 0, sortBy = 'createdAt' }) => {
      return prisma.memory.findMany({
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: 'desc' }
      });
    },
    person: async (_, { id }) => {
      const person = await prisma.person.findUnique({ where: { id } });
      if (!person) return null;
      return person;
    },
    people: async (_, { limit = 10, offset = 0, sortBy = 'createdAt' }) => {
      return prisma.person.findMany({
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: 'desc' }
      });
    }
  },
  Mutation: {
    deleteMemory: async (_, { id }) => {
      try {
        // Find all photos for this memory
        const photos = await prisma.photo.findMany({ where: { memoryId: id } });
        // Delete all photo files
        photos.forEach(photo => {
          ['original', 'medium', 'thumbnail'].forEach(size => {
            const ext = path.extname(photo.baseFilename);
            const base = path.basename(photo.baseFilename, ext);
            const filename = `${base}_${size}${ext}`;
            const filePath = path.join('uploads', photo.folder, filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          });
        });
        // Delete all photo records
        await prisma.photo.deleteMany({ where: { memoryId: id } });
        // Delete memory-people relationships
        await prisma.memoryPeople.deleteMany({ where: { memoryId: id } });
        // Delete the memory
        await prisma.memory.delete({ where: { id } });
        return true;
      } catch (err) {
        throw new Error('Could not delete memory and associated data.');
      }
    },
    createMemory: async (_, { input }) => {
      try {
        const { title, date, description, photoUrl, peopleIds } = input;
        const memory = await prisma.memory.create({
          data: { title, date, description, photoUrl }
        });
        if (peopleIds && peopleIds.length > 0) {
          await Promise.all(peopleIds.map(personId =>
            prisma.memoryPeople.create({ data: { memoryId: memory.id, personId } })
          ));
        }
        return memory;
      } catch (err) {
        throw new Error('Could not create memory.');
      }
    },
    updateMemory: async (_, { id, input }) => {
      try {
        const { title, date, description, photoUrl, peopleIds } = input;
        const memory = await prisma.memory.update({
          where: { id },
          data: { title, date, description, photoUrl }
        });
        if (peopleIds) {
          // Remove existing relationships
          await prisma.memoryPeople.deleteMany({ where: { memoryId: id } });
          // Add new relationships
          await Promise.all(peopleIds.map(personId =>
            prisma.memoryPeople.create({ data: { memoryId: id, personId } })
          ));
        }
        return memory;
      } catch (err) {
        throw new Error('Could not update memory.');
      }
    },
    createPerson: async (_, { input }) => {
      try {
        const { name, relationship } = input;
        return await prisma.person.create({ data: { name, relationship } });
      } catch (err) {
        throw new Error('Could not create person.');
      }
    },
    updatePerson: async (_, { id, input }) => {
      try {
        const { name, relationship } = input;
        return await prisma.person.update({ where: { id }, data: { name, relationship } });
      } catch (err) {
        throw new Error('Could not update person.');
      }
    },
    deletePerson: async (_, { id }) => {
      try {
        // Remove relationships
        await prisma.memoryPeople.deleteMany({ where: { personId: id } });
        await prisma.person.delete({ where: { id } });
        return true;
      } catch (err) {
        throw new Error('Could not delete person.');
      }
    },
    tagPersonInMemory: async (_, { memoryId, personId }) => {
      try {
        await prisma.memoryPeople.create({ data: { memoryId, personId } });
        return prisma.memory.findUnique({ where: { id: memoryId } });
      } catch (err) {
        throw new Error('Could not tag person in memory.');
      }
    },
    removePersonFromMemory: async (_, { memoryId, personId }) => {
      try {
        await prisma.memoryPeople.deleteMany({ where: { memoryId, personId } });
        return prisma.memory.findUnique({ where: { id: memoryId } });
      } catch (err) {
        throw new Error('Could not remove person from memory.');
      }
    }
  },
  Memory: {
    photos: async (parent) => {
      return prisma.photo.findMany({ where: { memoryId: parent.id } });
    },
    people: async (parent) => {
      // Assuming a join table memoryPeople with memoryId and personId
      const memoryPeople = await prisma.memoryPeople.findMany({ where: { memoryId: parent.id } });
      const personIds = memoryPeople.map(mp => mp.personId);
      return prisma.person.findMany({ where: { id: { in: personIds } } });
    }
  },
  Person: {
    memories: async (parent) => {
      // Assuming a join table memoryPeople with memoryId and personId
      const memoryPeople = await prisma.memoryPeople.findMany({ where: { personId: parent.id } });
      const memoryIds = memoryPeople.map(mp => mp.memoryId);
      return prisma.memory.findMany({ where: { id: { in: memoryIds } } });
    }
  }
};

module.exports = resolvers; 