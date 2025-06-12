import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getDateFolder() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return path.join(String(yyyy), mm, dd);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = getDateFolder();
    const fullPath = path.join('uploads', folder);
    fs.mkdirSync(fullPath, { recursive: true });
    req._uploadFolder = folder;
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Always use a unique temp name for the upload
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    const tempName = uuid + '_upload' + ext;
    req._baseFilename = uuid + ext; // The final base filename (no _upload)
    cb(null, tempName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ACCEPTED_TYPES.includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
    } else {
      cb(null, true);
    }
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  upload.single('photo')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
    }
    if (req.file.size > MAX_SIZE) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
    }
    // File content validation using file-type
    try {
      console.log('File path:', req.file.path);
      console.log('File exists:', fs.existsSync(req.file.path));
      const fileType = await import('file-type');
      console.log('Dynamic import fileType:', fileType);
      console.log('Dynamic import fileType.default:', fileType.default);
      let fileTypeResult;
      if (fileType.fromFile) {
        fileTypeResult = await fileType.fromFile(req.file.path);
      } else if (fileType.default && fileType.default.fromFile) {
        fileTypeResult = await fileType.default.fromFile(req.file.path);
      } else {
        throw new Error('fromFile not found in file-type import');
      }
      console.log('fileType result:', fileTypeResult);
      if (!fileTypeResult || !ACCEPTED_TYPES.includes(fileTypeResult.mime)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'File content does not match allowed image types.' });
      }
      // Optionally, check extension matches content
      const ext = path.extname(req.file.filename).toLowerCase();
      let allowedExts = [];
      if (fileTypeResult.mime === 'image/jpeg') allowedExts = ['.jpg', '.jpeg'];
      else if (fileTypeResult.mime === 'image/png') allowedExts = ['.png'];
      else if (fileTypeResult.mime === 'image/webp') allowedExts = ['.webp'];
      if (!allowedExts.includes(ext)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: `File extension (${ext}) does not match file content (${allowedExts.join(' or ')})` });
      }
    } catch (e) {
      console.error('Error during file-type validation:', e);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Could not validate file content.' });
    }
    const ext = path.extname(req.file.filename);
    const base = path.basename(req._baseFilename, ext); // Use the final base filename (no _upload)
    const folder = req._uploadFolder;
    const baseFilename = req._baseFilename;
    // Save original as base filename (no _original)
    const originalName = `${base}${ext}`;
    const mediumName = `${base}_medium${ext}`;
    const thumbName = `${base}_thumbnail${ext}`;
    const originalPath = path.join('uploads', folder, originalName);
    const mediumPath = path.join('uploads', folder, mediumName);
    const thumbPath = path.join('uploads', folder, thumbName);
    const format = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpeg';
    const qualityOpts = format === 'png' ? {} : { quality: 80 };
    try {
      // Original (max 2000x2000) - save as base filename
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
      // Remove the temp upload
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
          mimeType: req.file.mimetype,
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
    } catch (e) {
      console.error('Error during image processing:', e);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      res.status(500).json({ error: 'Image processing failed.', details: e && e.message ? e.message : String(e) });
    }
  });
} 