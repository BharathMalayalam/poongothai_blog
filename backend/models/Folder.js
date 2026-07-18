import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance optimization
folderSchema.index({ parentFolderId: 1, createdAt: -1 });
folderSchema.index({ createdAt: -1 });
folderSchema.index({ name: 1, parentFolderId: 1 });

export default mongoose.model('Folder', folderSchema);
