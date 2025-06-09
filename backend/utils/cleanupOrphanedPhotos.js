const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function getAllPhotoFiles() {
  const photos = await prisma.photo.findMany();
  const referenced = new Set();
  for (const photo of photos) {
    ['original', 'medium', 'thumbnail'].forEach(size => {
      const ext = path.extname(photo.baseFilename);
      const base = path.basename(photo.baseFilename, ext);
      const filename = `${base}_${size}${ext}`;
      referenced.add(path.join(UPLOADS_DIR, photo.folder, filename));
    });
  }
  return referenced;
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

async function cleanup() {
  const referenced = await getAllPhotoFiles();
  const allFiles = walk(UPLOADS_DIR);
  let deleted = 0;
  for (const file of allFiles) {
    if (!referenced.has(file)) {
      fs.unlinkSync(file);
      deleted++;
      console.log('Deleted orphaned file:', file);
    }
  }
  console.log(`Cleanup complete. Deleted ${deleted} orphaned files.`);
  await prisma.$disconnect();
}

cleanup().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 