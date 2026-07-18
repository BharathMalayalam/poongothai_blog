import express from 'express';
import mongoose from 'mongoose';
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
  let current = await Folder.findById(folderId).lean();
  while (current) {
    pathArr.unshift({ _id: current._id, name: current.name });
    if (current.parentFolderId) {
      current = await Folder.findById(current.parentFolderId).lean();
    } else {
      current = null;
    }
  }
  return pathArr;
};

// Helper to recursively delete subfolders and files
const deleteFolderRecursive = async (folderId) => {
  const subfolders = await Folder.find({ parentFolderId: folderId }).lean();
  for (const sub of subfolders) {
    await deleteFolderRecursive(sub._id);
  }

  const files = await File.find({ folderId }).lean();
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
    // Single aggregation query to fetch folders and compute subfolder/file counts
    const foldersWithCount = await Folder.aggregate([
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'folderId',
          as: 'files'
        }
      },
      {
        $lookup: {
          from: 'folders',
          localField: '_id',
          foreignField: 'parentFolderId',
          as: 'subfolders'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          parentFolderId: 1,
          createdAt: 1,
          fileCount: { $size: '$files' },
          subfolderCount: { $size: '$subfolders' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json(foldersWithCount);
  } catch (err) {
    console.error('Error fetching folders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/folders/:id — public (folder + files + subfolders + path)
router.get('/:id', async (req, res) => {
  try {
    const folderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }

    const folderObjId = new mongoose.Types.ObjectId(folderId);
    const folder = await Folder.findById(folderId).lean();
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    // Fetch folder files, subfolders with counts, and path in parallel
    const [files, subfoldersWithCount, folderPath] = await Promise.all([
      File.find({ folderId }).sort({ createdAt: -1 }).lean(),
      Folder.aggregate([
        { $match: { parentFolderId: folderObjId } },
        {
          $lookup: {
            from: 'files',
            localField: '_id',
            foreignField: 'folderId',
            as: 'files'
          }
        },
        {
          $lookup: {
            from: 'folders',
            localField: '_id',
            foreignField: 'parentFolderId',
            as: 'subfolders'
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            parentFolderId: 1,
            createdAt: 1,
            fileCount: { $size: '$files' },
            subfolderCount: { $size: '$subfolders' }
          }
        },
        { $sort: { createdAt: -1 } }
      ]),
      buildFolderPath(folderId)
    ]);

    res.json({ folder, files, subfolders: subfoldersWithCount, path: folderPath });
  } catch (err) {
    console.error(`Error fetching folder ${req.params.id}:`, err);
    res.status(500).json({ error: 'Internal server error' });
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
    }).lean();
    if (existing) return res.status(400).json({ error: 'Folder with this name already exists at this level' });
    
    const folder = new Folder({
      name: name.trim(),
      description: description?.trim() || '',
      parentFolderId: parentFolderId || null
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/folders/:id — admin only
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id).lean();
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    // Recursively delete folder and all contents
    await deleteFolderRecursive(req.params.id);

    res.json({ message: 'Folder and all its contents recursively deleted' });
  } catch (err) {
    console.error(`Error deleting folder ${req.params.id}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
