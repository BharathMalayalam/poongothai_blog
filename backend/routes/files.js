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
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

const router = express.Router();

// POST /api/upload/:folderId — upload file to a folder (admin)
router.post('/:folderId', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId).lean();
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const { title, description, linkUrl } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    let fileUrl = '';
    let fileName = '';
    let fileType = 'pdf';

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      const isImage = req.file.mimetype.startsWith('image/');
      fileType = isImage ? 'image' : (ext || 'pdf');
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    } else if (linkUrl) {
      fileUrl = linkUrl.trim();
      fileName = 'Google Drive Link';
      fileType = 'link';
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
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/files/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id).lean();
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.fileUrl && file.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(uploadsDir, path.basename(file.fileUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
