import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    memory: async (_, { id }) => {
      const memory = await prisma.memory.findUnique({ where: { id } });
      if (!memory) return null;
      return memory;
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
        // Delete the memory
        await prisma.memory.delete({ where: { id } });
        return true;
      } catch (err) {
        throw new Error('Could not delete memory and associated photos.');
      }
    }
  },
  Memory: {
    photos: async (parent) => {
      return prisma.photo.findMany({ where: { memoryId: parent.id } });
    }
  }
};

export default resolvers; 