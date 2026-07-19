import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen, ChevronRight, ArrowLeft, Download,
  FileText, Image, Eye, X, Loader2, Search,
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

const getFileUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendUrl = import.meta.env.VITE_API_URL || '';
  return `${backendUrl.replace(/\/$/, '')}${url}`;
};

const getFileIconAndStyle = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'pdf') {
    return {
      bg: 'bg-gradient-to-br from-red-500 to-rose-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-100',
      icon: 'pdf'
    };
  }
  if (t === 'image') {
    return {
      bg: 'bg-gradient-to-br from-blue-400 to-indigo-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: 'image'
    };
  }
  if (['doc', 'docx', 'txt', 'rtf'].includes(t)) {
    return {
      bg: 'bg-gradient-to-br from-blue-500 to-sky-600',
      badge: 'bg-sky-50 text-sky-700 border-sky-100',
      icon: 'doc'
    };
  }
  if (['xls', 'xlsx', 'csv'].includes(t)) {
    return {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: 'sheet'
    };
  }
  if (['ppt', 'pptx'].includes(t)) {
    return {
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: 'slide'
    };
  }
  return {
    bg: 'bg-gradient-to-br from-slate-500 to-slate-700',
    badge: 'bg-slate-50 text-slate-700 border-slate-100',
    icon: 'file'
  };
};

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FolderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewer, setViewer] = useState<FileItem | null>(null);

  useEffect(() => {
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || '';
    fetch(`${apiBase.replace(/\/$/, '')}/api/folders/${id}`)
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

  const filtered = data?.files.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.fileName.toLowerCase().includes(search.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const handleDownload = (file: FileItem) => {
    const a = document.createElement('a');
    a.href = getFileUrl(file.fileUrl);
    a.download = file.fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] to-[#f0f4f8] font-sans"
      style={{ backgroundImage: 'radial-gradient(circle at 80% 10%, #ffe4e644 0%, transparent 40%), radial-gradient(circle at 5% 90%, #dbeafe44 0%, transparent 40%)' }}>

      {/* HEADER */}
      <header className="bg-blue-950/95 backdrop-blur-md border-b border-blue-900/50 sticky top-0 z-30 shadow-md text-white">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>

          <nav className="flex items-center gap-1.5 text-xs text-blue-100/80 font-medium flex-1 flex-wrap">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer px-1.5 py-1 rounded hover:bg-white/5">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-blue-800" />
            <button onClick={() => navigate('/blog')} className="hover:text-rose-400 transition-colors cursor-pointer px-1.5 py-1 rounded hover:bg-white/5">
              Study Materials
            </button>
            {data?.path?.map((p, idx) => (
              <span key={p._id} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-blue-800" />
                {idx === data.path.length - 1 ? (
                  <span className="text-white font-semibold truncate max-w-[150px]">{p.name}</span>
                ) : (
                  <button onClick={() => navigate(`/blog/folder/${p._id}`)} className="hover:text-rose-400 transition-colors cursor-pointer">{p.name}</button>
                )}
              </span>
            ))}
            {!data && <><ChevronRight className="w-3.5 h-3.5 text-blue-800" /><span className="text-blue-300/60">Loading...</span></>}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-sm">Loading folder...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <FolderX className="w-12 h-12 text-red-400" />
            <p className="text-slate-600 font-semibold">{error}</p>
            <button onClick={() => navigate('/blog')} className="px-4 py-2 bg-rose-500 text-white font-bold rounded-lg text-sm transition-colors hover:bg-rose-600 cursor-pointer">← Back</button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Folder hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md">
                  <FolderOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900">{data.folder.name}</h1>
                  {data.folder.description && (
                    <p className="text-slate-500 text-sm mt-0.5">{data.folder.description}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Search bar */}
            <div className="relative max-w-md mb-6 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search files in this folder..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 shadow-sm"
                />
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                {filtered.length} of {data.files.length} file{data.files.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Subfolders */}
            {data.subfolders && data.subfolders.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
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
                        className="bg-white border border-slate-200/60 rounded-2xl p-4 cursor-pointer group flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display font-bold text-sm truncate text-slate-800 group-hover:text-rose-600 transition-colors">{sub.name}</h3>
                            {sub.description && <p className="text-[11px] text-slate-400 truncate">{sub.description}</p>}
                          </div>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ml-2">
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
                <FolderX className="w-10 h-10 text-slate-400" />
                <p className="text-slate-500 font-semibold">This folder is empty</p>
              </div>
            )}

            {/* Files grid */}
            {filtered.length > 0 && (
              <div>
                {data.subfolders && data.subfolders.length > 0 && (
                  <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 mt-8">
                    <FileText className="w-3.5 h-3.5" />
                    Files ({filtered.length})
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((file, i) => {
                    const fileMeta = getFileIconAndStyle(file.fileType);
                    return (
                      <motion.div
                        key={file._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div className="flex flex-col sm:block w-full">
                          {/* Desktop Only: Icon & Badge */}
                          <div className="hidden sm:flex items-start justify-between mb-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${fileMeta.bg}`}>
                              {fileMeta.icon === 'image' ? <Image className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fileMeta.badge}`}>{file.fileType.toUpperCase()}</span>
                          </div>

                          {/* Responsive Layout Container */}
                          <div className="flex flex-row items-center justify-between sm:block w-full gap-4">
                            {/* Info Area (Title & Mobile Badge) */}
                            <div className="min-w-0 flex-1 sm:block">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base truncate sm:line-clamp-2 group-hover:text-rose-600 transition-colors">{file.title}</h3>
                                <span className={`sm:hidden text-[8px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${fileMeta.badge}`}>{file.fileType.toUpperCase()}</span>
                              </div>
                              {file.description && <p className="hidden sm:block text-sm text-slate-500 line-clamp-2 mt-1 sm:mb-4">{file.description}</p>}
                            </div>

                            {/* Buttons Area */}
                            <div className="flex gap-2 pt-0 sm:pt-3 border-t-0 sm:border-t border-slate-100 shrink-0">
                              <button
                                onClick={() => {
                                  if (file.fileUrl.startsWith('http')) window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
                                  else setViewer(file);
                                }}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-4 sm:flex-1 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 whitespace-nowrap"
                              >
                                <Eye className="hidden sm:inline-block w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => handleDownload(file)}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-4 sm:flex-1 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 whitespace-nowrap"
                              >
                                <Download className="hidden sm:inline-block w-3.5 h-3.5" /> Download
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 bg-white/40 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>© 2026 Dr. M. Poongothai — IRTT</span>
          <button onClick={() => navigate('/blog')} className="hover:text-rose-600 transition-colors cursor-pointer">← All Folders</button>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {(() => {
                    const fileMeta = getFileIconAndStyle(viewer.fileType);
                    return (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        viewer.fileType === 'pdf' ? 'bg-red-500/10' :
                        viewer.fileType === 'image' ? 'bg-blue-500/10' :
                        'bg-slate-500/10'
                      }`}>
                        {fileMeta.icon === 'image' ? <Image className="w-4 h-4 text-blue-500" /> : <FileText className={`w-4 h-4 ${
                          viewer.fileType === 'pdf' ? 'text-red-500' : 'text-slate-500'
                        }`} />}
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{viewer.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{viewer.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(viewer)} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={() => setViewer(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-50">
                {(() => {
                  const t = viewer.fileType.toLowerCase();
                  const absoluteUrl = getFileUrl(viewer.fileUrl);
                  
                  if (t === 'pdf') {
                    return (
                      <iframe src={absoluteUrl} className="w-full rounded-lg border border-slate-200 bg-white" style={{ height: 'calc(90vh - 120px)' }} title={viewer.title} />
                    );
                  }
                  
                  if (t === 'image') {
                    return (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <img src={absoluteUrl} alt={viewer.title} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-slate-200" />
                      </div>
                    );
                  }
                  
                  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(t)) {
                    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
                    return (
                      <iframe src={officeUrl} className="w-full rounded-lg border border-slate-200 bg-white" style={{ height: 'calc(90vh - 120px)' }} title={viewer.title} />
                    );
                  }
                  
                  if (t === 'txt') {
                    return (
                      <iframe src={absoluteUrl} className="w-full rounded-lg border border-slate-200 bg-white p-4 font-mono text-sm" style={{ height: 'calc(90vh - 120px)' }} title={viewer.title} />
                    );
                  }
                  
                  return (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-semibold text-base">Preview not available</p>
                        <p className="text-slate-400 text-xs mt-1">This file type ({viewer.fileType.toUpperCase()}) cannot be displayed in the browser.</p>
                      </div>
                      <button
                        onClick={() => handleDownload(viewer)}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm shadow-md shadow-rose-500/20"
                      >
                        <Download className="w-4 h-4" /> Download to Open
                      </button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
