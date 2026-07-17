import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen, ChevronRight, ArrowLeft, Download,
  FileText, Image, Eye, X, Loader2, Filter,
  GraduationCap, FolderX
} from 'lucide-react';

interface FileItem {
  _id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  createdAt: string;
}

interface Subfolder {
  _id: string;
  name: string;
  description: string;
  fileCount: number;
  subfolderCount?: number;
}

interface FolderPathNode { _id: string; name: string; }

interface FolderData {
  folder: { _id: string; name: string; description: string; parentFolderId?: string | null };
  files: FileItem[];
  subfolders: Subfolder[];
  path: FolderPathNode[];
}

const SUBFOLDER_ACCENTS = [
  { gradient: 'from-cyan-500 to-cyan-700', icon: 'text-cyan-400' },
  { gradient: 'from-violet-500 to-purple-700', icon: 'text-violet-400' },
  { gradient: 'from-amber-500 to-orange-600', icon: 'text-amber-400' },
  { gradient: 'from-emerald-500 to-teal-600', icon: 'text-emerald-400' },
  { gradient: 'from-rose-500 to-pink-600', icon: 'text-rose-400' },
];

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FolderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pdf' | 'image'>('all');
  const [viewer, setViewer] = useState<FileItem | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/folders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.folder) setData(d);
        else setError('Folder not found');
        setLoading(false);
      })
      .catch(() => {
        setError('Cannot connect to server.');
        setLoading(false);
      });
  }, [id]);

  const filtered = data?.files.filter(f => filter === 'all' || f.fileType === filter) ?? [];

  const handleDownload = (file: FileItem) => {
    const a = document.createElement('a');
    a.href = file.fileUrl;
    a.download = file.fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-cosmic-mesh font-sans text-white">
      <div className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/4 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-500/4 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <header className="glass border-b border-white/[0.07] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white shadow-lg glow-cyan-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>

          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-1 flex-wrap">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer px-1.5 py-1 rounded hover:bg-white/5">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button onClick={() => navigate('/blog')} className="hover:text-cyan-400 transition-colors cursor-pointer px-1.5 py-1 rounded hover:bg-white/5">
              Study Materials
            </button>
            {data?.path?.map((p, idx) => (
              <span key={p._id} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                {idx === data.path.length - 1 ? (
                  <span className="text-slate-200 font-semibold truncate max-w-[150px]">{p.name}</span>
                ) : (
                  <button onClick={() => navigate(`/blog/folder/${p._id}`)} className="hover:text-cyan-400 transition-colors cursor-pointer">{p.name}</button>
                )}
              </span>
            ))}
            {!data && <><ChevronRight className="w-3.5 h-3.5 text-slate-600" /><span className="text-slate-500">Loading...</span></>}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            <p className="text-sm">Loading folder...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <FolderX className="w-12 h-12 text-red-400" />
            <p className="text-slate-400 font-semibold">{error}</p>
            <button onClick={() => navigate('/blog')} className="btn-primary">← Back</button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Folder hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg glow-cyan">
                  <FolderOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white">{data.folder.name}</h1>
                  {data.folder.description && (
                    <p className="text-slate-400 text-sm mt-0.5">{data.folder.description}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-6">
              {(['all', 'pdf', 'image'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    filter === tab
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                      : 'glass text-slate-400 hover:text-slate-200 hover:border-cyan-500/30'
                  }`}
                >
                  {tab === 'all' ? `All (${data.files.length})` : tab === 'pdf' ? `PDF (${data.files.filter(f => f.fileType === 'pdf').length})` : `Images (${data.files.filter(f => f.fileType === 'image').length})`}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Subfolders */}
            {data.subfolders && data.subfolders.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Subfolders ({data.subfolders.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.subfolders.map((sub, i) => {
                    const accent = SUBFOLDER_ACCENTS[i % SUBFOLDER_ACCENTS.length];
                    return (
                      <motion.div
                        key={sub._id}
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/blog/folder/${sub._id}`)}
                        className="glass-card rounded-2xl p-4 cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className={`font-display font-bold text-sm truncate group-hover:${accent.icon.replace('text-', 'text-')} transition-colors text-white group-hover:text-cyan-300`}>{sub.name}</h3>
                            {sub.description && <p className="text-[11px] text-slate-500 truncate">{sub.description}</p>}
                          </div>
                        </div>
                        <span className="badge badge-cyan shrink-0 ml-2">
                          {sub.subfolderCount ? `${sub.subfolderCount}d · ` : ''}{sub.fileCount}f
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(data.subfolders || []).length === 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <FolderX className="w-10 h-10 text-slate-600" />
                <p className="text-slate-500 font-semibold">This folder is empty</p>
                <button onClick={() => navigate('/admin')} className="text-sm text-cyan-600 hover:text-cyan-400 cursor-pointer transition-colors">
                  Add subfolders or upload files as admin →
                </button>
              </div>
            )}

            {/* Files grid */}
            {filtered.length > 0 && (
              <div>
                {data.subfolders && data.subfolders.length > 0 && (
                  <h2 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5 mt-8">
                    <FileText className="w-3.5 h-3.5" />
                    Files ({filtered.length})
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((file, i) => (
                    <motion.div
                      key={file._id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-2xl p-5 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${file.fileType === 'pdf' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'}`}>
                          {file.fileType === 'pdf' ? <FileText className="w-6 h-6 text-white" /> : <Image className="w-6 h-6 text-white" />}
                        </div>
                        <span className={`badge ${file.fileType === 'pdf' ? 'badge-rose' : 'badge-cyan'}`}>{file.fileType.toUpperCase()}</span>
                      </div>

                      <h3 className="font-display font-bold text-white text-base mb-1 line-clamp-2 group-hover:text-cyan-300 transition-colors">{file.title}</h3>
                      {file.description && <p className="text-sm text-slate-500 line-clamp-2 mb-4">{file.description}</p>}
                      {!file.description && <div className="mb-4" />}

                      <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                        <button
                          onClick={() => {
                            if (file.fileUrl.startsWith('http')) window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
                            else setViewer(file);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer glass hover:bg-white/[0.08] text-slate-400"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-[10px] font-mono text-slate-600">
          <span>© 2026 Dr. M. Poongothai — IRTT</span>
          <button onClick={() => navigate('/blog')} className="hover:text-cyan-500 transition-colors cursor-pointer">← All Folders</button>
        </div>
      </footer>

      {/* FILE VIEWER MODAL */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/[0.12]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewer.fileType === 'pdf' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                    {viewer.fileType === 'pdf' ? <FileText className="w-4 h-4 text-red-400" /> : <Image className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{viewer.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{viewer.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(viewer)} className="btn-primary text-xs py-1.5 px-3">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={() => setViewer(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-black/20">
                {viewer.fileType === 'pdf' ? (
                  <iframe src={viewer.fileUrl} className="w-full rounded-lg" style={{ height: 'calc(90vh - 120px)' }} title={viewer.title} />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <img src={viewer.fileUrl} alt={viewer.title} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
