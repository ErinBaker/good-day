import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    // Delete all records in the correct order to respect foreign key constraints
    console.log('Deleting all photos...');
    await prisma.photo.deleteMany({});
    
    console.log('Deleting all memories...');
    await prisma.memory.deleteMany({});
    
    console.log('Deleting all people...');
    await prisma.person.deleteMany({});

    // Clean up the uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('Cleaning up uploads directory...');
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }
    }

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase(); 