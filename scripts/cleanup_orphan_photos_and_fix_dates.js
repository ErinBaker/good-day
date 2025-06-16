import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function deletePhotoFiles(photo) {
  const ext = path.extname(photo.baseFilename);
  const base = path.basename(photo.baseFilename, ext);
  const folderPath = path.join(process.cwd(), 'uploads', photo.folder);
  const originalPath = path.join(folderPath, photo.baseFilename);
  const thumbnailPath = path.join(folderPath, `${base}_thumbnail${ext}`);
  const mediumPath = path.join(folderPath, `${base}_medium${ext}`);
  [originalPath, thumbnailPath, mediumPath].forEach(p => {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`[cleanup] Deleted file: ${p}`);
    }
  });
}

async function cleanupOrphanPhotos() {
  const orphans = await prisma.photo.findMany({ where: { OR: [{ memoryId: null }, { memoryId: '' }] } });
  for (const photo of orphans) {
    await deletePhotoFiles(photo);
    await prisma.photo.delete({ where: { id: photo.id } });
    console.log(`[cleanup] Deleted orphan photo record: ${photo.id}`);
  }
}

async function fixDateFields() {
  // Fix Photo.createdAt
  const photos = await prisma.photo.findMany();
  for (const photo of photos) {
    if (typeof photo.createdAt === 'number') {
      const iso = new Date(photo.createdAt).toISOString();
      await prisma.photo.update({ where: { id: photo.id }, data: { createdAt: iso } });
      console.log(`[fix-dates] Updated Photo ${photo.id} createdAt to ISO: ${iso}`);
    }
  }
  // Fix Memory.createdAt and updatedAt
  const memories = await prisma.memory.findMany();
  for (const memory of memories) {
    let updated = false;
    let data = {};
    if (typeof memory.createdAt === 'number') {
      data.createdAt = new Date(memory.createdAt).toISOString();
      updated = true;
    }
    if (typeof memory.updatedAt === 'number') {
      data.updatedAt = new Date(memory.updatedAt).toISOString();
      updated = true;
    }
    if (updated) {
      await prisma.memory.update({ where: { id: memory.id }, data });
      console.log(`[fix-dates] Updated Memory ${memory.id} date fields to ISO.`);
    }
  }
}

async function main() {
  await cleanupOrphanPhotos();
  await fixDateFields();
  await prisma.$disconnect();
  console.log('Cleanup and date fix complete.');
}

main().catch(e => { console.error(e); process.exit(1); }); 