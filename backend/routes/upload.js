const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
let fileTypeFromFile;
import('file-type').then(mod => { fileTypeFromFile = mod.fileTypeFromFile; });

const router = express.Router();

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Helper to get date folder
function getDateFolder() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return path.join(String(yyyy), mm, dd);
}

// Multer storage with date folders and UUID filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = getDateFolder();
    const fullPath = path.join('uploads', folder);
    fs.mkdirSync(fullPath, { recursive: true });
    req._uploadFolder = folder; // Save for later use
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    req._baseFilename = uuid + ext; // Save for later use
    cb(null, uuid + ext);
  }
});

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (!ACCEPTED_TYPES.includes(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

// POST /api/photos/upload
router.post('/api/photos/upload', (req, res, next) => {
  console.log('Upload route hit');
  upload.single('photo')(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      if (err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'Upload error' });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
  }
  if (req.file.size > MAX_SIZE) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
  }
  let fileType;
  // File content validation using file-type
  try {
    console.log('Starting image processing for', req.file.filename);
    if (!fileTypeFromFile) {
      const mod = await import('file-type');
      fileTypeFromFile = mod.fileTypeFromFile;
    }
    fileType = await fileTypeFromFile(req.file.path);
    if (!fileType || !ACCEPTED_TYPES.includes(fileType.mime)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File content does not match allowed image types.' });
    }
    // Optionally, check extension matches content
    const ext = path.extname(req.file.filename).toLowerCase();
    let allowedExts = [];
    if (fileType.mime === 'image/jpeg') allowedExts = ['.jpg', '.jpeg'];
    else if (fileType.mime === 'image/png') allowedExts = ['.png'];
    else if (fileType.mime === 'image/webp') allowedExts = ['.webp'];
    if (!allowedExts.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `File extension (${ext}) does not match file content (${allowedExts.join(' or ')})` });
    }
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Could not validate file content.' });
  }
  const ext = path.extname(req.file.filename);
  const base = path.basename(req.file.filename, ext);
  const folder = req._uploadFolder;
  const baseFilename = req._baseFilename;
  const originalName = `${base}_original${ext}`;
  const mediumName = `${base}_medium${ext}`;
  const thumbName = `${base}_thumbnail${ext}`;
  const originalPath = path.join('uploads', folder, originalName);
  const mediumPath = path.join('uploads', folder, mediumName);
  const thumbPath = path.join('uploads', folder, thumbName);
  const format = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpeg';
  const qualityOpts = format === 'png' ? {} : { quality: 80 };
  try {
    // Original (max 2000x2000)
    await sharp(req.file.path)
      .resize({ width: 2000, height: 2000, fit: 'inside' })
      [format](qualityOpts)
      .toFile(originalPath);
    // Medium (max 1000x1000)
    await sharp(req.file.path)
      .resize({ width: 1000, height: 1000, fit: 'inside' })
      [format](qualityOpts)
      .toFile(mediumPath);
    // Thumbnail (max 200x200)
    await sharp(req.file.path)
      .resize({ width: 200, height: 200, fit: 'inside' })
      [format](qualityOpts)
      .toFile(thumbPath);
    // Remove the original upload
    fs.unlinkSync(req.file.path);
    // Set file permissions to 0640
    [originalPath, mediumPath, thumbPath].forEach(p => {
      if (fs.existsSync(p)) fs.chmodSync(p, 0o640);
    });
    // Get image dimensions from sharp metadata
    const sharpMeta = await sharp(originalPath).metadata();
    // Store metadata in Photo table
    const photo = await prisma.photo.create({
      data: {
        originalFilename: req.file.originalname,
        folder,
        baseFilename,
        mimeType: fileType.mime,
        size: req.file.size,
        width: sharpMeta.width || 0,
        height: sharpMeta.height || 0,
      }
    });
    res.json({
      id: photo.id,
      folder,
      baseFilename,
      original: originalName,
      medium: mediumName,
      thumbnail: thumbName
    });
  } catch (err) {
    console.log('Catching error in image processing');
    console.error('Image processing error:', err);
    // Clean up files on error
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    res.status(500).json({ error: 'Image processing failed.' });
  }
});

// GET /api/photos/:folder/:id?size=original|medium|thumbnail
router.get('/api/photos/:folder(*)/:id', (req, res) => {
  const { folder, id } = req.params;
  const { size } = req.query;
  const allowedSizes = ['original', 'medium', 'thumbnail'];
  let fileToServe = id;
  if (size && allowedSizes.includes(size)) {
    const ext = path.extname(id);
    const base = path.basename(id, ext);
    fileToServe = `${base}_${size}${ext}`;
  }
  const filePath = path.join('uploads', folder, fileToServe);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  // Set caching headers
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  // ETag support
  const stat = fs.statSync(filePath);
  const etag = `${stat.size}-${stat.mtime.getTime()}`;
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  res.sendFile(path.resolve(filePath));
});

// PATCH /api/photos/:photoId/link/:memoryId
router.patch('/api/photos/:photoId/link/:memoryId', async (req, res) => {
  const { photoId, memoryId } = req.params;
  try {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: { memoryId: parseInt(memoryId, 10) },
    });
    res.json(photo);
  } catch (err) {
    res.status(400).json({ error: 'Could not link photo to memory.' });
  }
});

// PATCH /api/photos/:photoId/unlink
router.patch('/api/photos/:photoId/unlink', async (req, res) => {
  const { photoId } = req.params;
  try {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: { memoryId: null },
    });
    res.json(photo);
  } catch (err) {
    res.status(400).json({ error: 'Could not unlink photo.' });
  }
});

// GET /api/memories/:memoryId/photos
router.get('/api/memories/:memoryId/photos', async (req, res) => {
  const { memoryId } = req.params;
  try {
    const photos = await prisma.photo.findMany({ where: { memoryId: parseInt(memoryId, 10) } });
    res.json(photos);
  } catch (err) {
    res.status(400).json({ error: 'Could not retrieve photos for memory.' });
  }
});

// DELETE /api/photos/:photoId
router.delete('/api/photos/:photoId', async (req, res) => {
  const { photoId } = req.params;
  try {
    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) return res.status(404).json({ error: 'Photo not found.' });
    // Delete files
    ['original', 'medium', 'thumbnail'].forEach(size => {
      const ext = path.extname(photo.baseFilename);
      const base = path.basename(photo.baseFilename, ext);
      const filename = `${base}_${size}${ext}`;
      const filePath = path.join('uploads', photo.folder, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    await prisma.photo.delete({ where: { id: photoId } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete photo.' });
  }
});

// DELETE /api/memories/:memoryId
router.delete('/api/memories/:memoryId', async (req, res) => {
  const { memoryId } = req.params;
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
});

module.exports = router; 