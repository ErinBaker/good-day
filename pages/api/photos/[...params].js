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
  // GET /api/photos/:folderParts.../:filename
  if (req.method === 'GET' && params.length >= 2) {
    const folderParts = params.slice(0, -1);
    const filename = params[params.length - 1];
    const { size } = req.query;
    const allowedSizes = ['original', 'medium', 'thumbnail'];
    let fileToServe = filename;
    if (size && allowedSizes.includes(size)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      fileToServe = `${base}_${size}${ext}`;
    }
    // Use absolute path from project root
    const filePath = path.join(process.cwd(), 'uploads', ...folderParts, fileToServe);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    // Set caching headers
    const stat = fs.statSync(filePath);
    const etag = `${stat.size}-${stat.mtime.getTime()}`;
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    res.setHeader('Content-Type', 'image/' + path.extname(filePath).slice(1));
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  // PATCH /api/photos/:photoId/link/:memoryId
  if (req.method === 'PATCH' && params.length === 3 && params[1] === 'link') {
    const photoId = params[0];
    const memoryId = params[2];
    try {
      const photo = await prisma.photo.update({
        where: { id: photoId },
        data: { memoryId: parseInt(memoryId, 10) },
      });
      res.json(photo);
    } catch {
      res.status(400).json({ error: 'Could not link photo to memory.' });
    }
    return;
  }
  // PATCH /api/photos/:photoId/unlink
  if (req.method === 'PATCH' && params.length === 2 && params[1] === 'unlink') {
    const photoId = params[0];
    try {
      const photo = await prisma.photo.update({
        where: { id: photoId },
        data: { memoryId: null },
      });
      res.json(photo);
    } catch {
      res.status(400).json({ error: 'Could not unlink photo.' });
    }
    return;
  }
  // DELETE /api/photos/:photoId
  if (req.method === 'DELETE' && params.length === 1) {
    const photoId = params[0];
    try {
      const photo = await prisma.photo.findUnique({ where: { id: photoId } });
      if (!photo) return res.status(404).json({ error: 'Photo not found.' });
      // Delete files
      ['original', 'medium', 'thumbnail'].forEach(size => {
        const ext = path.extname(photo.baseFilename);
        const base = path.basename(photo.baseFilename, ext);
        const filename = `${base}_${size}${ext}`;
        const filePath = path.join(process.cwd(), 'uploads', photo.folder, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      await prisma.photo.delete({ where: { id: photoId } });
      res.json({ success: true });
    } catch {
      res.status(400).json({ error: 'Could not delete photo.' });
    }
    return;
  }
  res.status(405).json({ error: 'Method Not Allowed or Invalid Route' });
} 