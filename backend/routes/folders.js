import express from 'express';
import Folder from '../models/Folder.js';
import File from '../models/File.js';
import { requireAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Helper to build folder breadcrumbs
const buildFolderPath = async (folderId) => {
  const pathArr = [];
  let current = await Folder.findById(folderId);
  while (current) {
    pathArr.unshift({ _id: current._id, name: current.name });
    if (current.parentFolderId) {
      current = await Folder.findById(current.parentFolderId);
    } else {
      current = null;
    }
  }
  return pathArr;
};

// Helper to recursively delete subfolders and files
const deleteFolderRecursive = async (folderId) => {
  const subfolders = await Folder.find({ parentFolderId: folderId });
  for (const sub of subfolders) {
    await deleteFolderRecursive(sub._id);
  }

  const files = await File.find({ folderId });
  for (const file of files) {
    const filePath = path.join(__dirname, '..', 'uploads', path.basename(file.fileUrl));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink file:', filePath, err);
      }
    }
  }
  await File.deleteMany({ folderId });
  await Folder.findByIdAndDelete(folderId);
};

// GET /api/folders — public
router.get('/', async (req, res) => {
  try {
    const folders = await Folder.find().sort({ createdAt: -1 });
    // Attach file and subfolder counts to each folder
    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const count = await File.countDocuments({ folderId: folder._id });
        const subfolderCount = await Folder.countDocuments({ parentFolderId: folder._id });
        return { ...folder.toObject(), fileCount: count, subfolderCount };
      })
    );
    res.json(foldersWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/folders/:id — public (folder + files + subfolders + path)
router.get('/:id', async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    const files = await File.find({ folderId: req.params.id }).sort({ createdAt: -1 });
    const subfolders = await Folder.find({ parentFolderId: req.params.id }).sort({ createdAt: -1 });
    
    const subfoldersWithCount = await Promise.all(
      subfolders.map(async (sf) => {
        const count = await File.countDocuments({ folderId: sf._id });
        const subfolderCount = await Folder.countDocuments({ parentFolderId: sf._id });
        return { ...sf.toObject(), fileCount: count, subfolderCount };
      })
    );

    const folderPath = await buildFolderPath(req.params.id);

    res.json({ folder, files, subfolders: subfoldersWithCount, path: folderPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/folders — admin only
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, parentFolderId } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name required' });
    
    // Check duplicate in same level
    const existing = await Folder.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      parentFolderId: parentFolderId || null
    });
    if (existing) return res.status(400).json({ error: 'Folder with this name already exists at this level' });
    
    const folder = new Folder({
      name: name.trim(),
      description: description?.trim() || '',
      parentFolderId: parentFolderId || null
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/folders/:id — admin only
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    // Recursively delete folder and all contents
    await deleteFolderRecursive(req.params.id);

    res.json({ message: 'Folder and all its contents recursively deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
