import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { params } = req.query;
  // GET /api/memories/:memoryId/photos
  if (req.method === 'GET' && params.length === 2 && params[1] === 'photos') {
    const memoryId = params[0];
    try {
      const photos = await prisma.photo.findMany({ where: { memoryId: parseInt(memoryId, 10) } });
      res.json(photos);
    } catch (err) {
      res.status(400).json({ error: 'Could not retrieve photos for memory.' });
    }
    return;
  }
  // DELETE /api/memories/:memoryId
  if (req.method === 'DELETE' && params.length === 1) {
    const memoryId = params[0];
    try {
      // Find all photos for this memory
      const photos = await prisma.photo.findMany({ where: { memoryId: parseInt(memoryId, 10) } });
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
      await prisma.photo.deleteMany({ where: { memoryId: parseInt(memoryId, 10) } });
      // Delete the memory
      await prisma.memory.delete({ where: { id: parseInt(memoryId, 10) } });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: 'Could not delete memory and associated photos.' });
    }
    return;
  }
  res.status(405).json({ error: 'Method Not Allowed or Invalid Route' });
} 