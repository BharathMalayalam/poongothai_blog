import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF and image files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

const router = express.Router();

// POST /api/upload/:folderId — upload file to a folder (admin)
router.post('/:folderId', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const { title, description, linkUrl } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    let fileUrl = '';
    let fileName = '';
    let fileType = 'pdf';

    if (req.file) {
      const isImage = req.file.mimetype.startsWith('image/');
      fileType = isImage ? 'image' : 'pdf';
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    } else if (linkUrl) {
      fileUrl = linkUrl.trim();
      fileName = 'Google Drive Link';
      fileType = 'pdf';
    } else {
      return res.status(400).json({ error: 'No file uploaded and no link provided' });
    }

    const file = new File({
      title: title.trim(),
      description: description?.trim() || '',
      fileUrl,
      fileName,
      fileType,
      folderId: req.params.folderId,
    });
    await file.save();
    res.status(201).json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.fileUrl && file.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(uploadsDir, path.basename(file.fileUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
