import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'image'], required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('File', fileSchema);
