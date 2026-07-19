import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FolderOpen, Search, ChevronRight, BookOpen,
  GraduationCap, ArrowLeft, Loader2, FolderX
} from 'lucide-react';

interface Folder {
  _id: string;
  name: string;
  description: string;
  fileCount: number;
  subfolderCount?: number;
  parentFolderId?: string | null;
  createdAt: string;
}

const FOLDER_COLORS = [
  { bg: 'from-rose-400 to-rose-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  { bg: 'from-emerald-400 to-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'from-violet-400 to-purple-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'from-blue-400 to-sky-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'from-rose-400 to-pink-500', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  { bg: 'from-indigo-400 to-blue-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
];

export default function BlogPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    fetch(`${apiBase.replace(/\/$/, '')}/api/folders`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFolders(data);
        else setError('Failed to load folders');
        setLoading(false);
      })
      .catch(() => {
        setError('Cannot connect to server. Make sure the backend is running.');
        setLoading(false);
      });
  }, []);

  const filtered = folders
    .filter(f => !f.parentFolderId)
    .filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] to-[#f0f4f8] font-sans"
      style={{ backgroundImage: 'radial-gradient(circle at 80% 10%, #ffe4e644 0%, transparent 40%), radial-gradient(circle at 5% 90%, #dbeafe44 0%, transparent 40%)' }}>

      {/* Header */}
      <header className="bg-blue-950/95 backdrop-blur-md border-b border-blue-900/50 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white font-display leading-none">Dr. M. Poongothai<span className="text-rose-400 font-bold">.</span></p>
              <p className="text-[10px] text-blue-200/60 font-mono mt-0.5">Academic Library</p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-blue-100/80 font-medium">
            <button onClick={() => navigate('/')} className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-blue-800" />
            <span className="text-white font-semibold">Study Materials</span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 border border-rose-200 rounded-full text-sm font-semibold text-rose-700 mb-4">
            <BookOpen className="w-4 h-4" />
            Academic Content Library
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 mb-3">
            Study <span className="text-rose-500" style={{ textDecoration: 'underline', textDecorationColor: '#be123c', textUnderlineOffset: '6px' }}>Materials</span>
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Browse folders, access PDFs and notes organized by subject. Click a folder to explore its contents.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search folders..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 shadow-sm"
          />
        </motion.div>

        {/* State: loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-sm">Loading folders...</p>
          </div>
        )}

        {/* State: error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <FolderX className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-600 font-semibold">Connection Error</p>
            <p className="text-sm text-slate-400 max-w-sm text-center">{error}</p>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-600 transition-colors cursor-pointer"
            >
              Go to Admin to Add Content
            </button>
          </div>
        )}

        {/* State: empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-slate-700 font-semibold text-lg">No folders found</p>
            <p className="text-sm text-slate-400">
              {search ? 'Try a different search term' : 'Admin has not created any folders yet.'}
            </p>
          </div>
        )}

        {/* Folder grid */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-xs text-slate-400 font-mono mb-4 text-center">
              {filtered.length} folder{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((folder, i) => {
                const color = FOLDER_COLORS[i % FOLDER_COLORS.length];
                return (
                  <motion.div
                    key={folder._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => navigate(`/blog/folder/${folder._id}`)}
                    className={`group cursor-pointer bg-white border ${color.border} rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}
                  >
                    {/* Decorative gradient accent top */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.bg} rounded-t-2xl`} />

                    <div className="flex items-start justify-between mb-4 pt-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${color.badge}`}>
                        {folder.subfolderCount ? `${folder.subfolderCount} dir${folder.subfolderCount > 1 ? 's' : ''} • ` : ''}{folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-slate-700 mb-1 transition-colors">
                      {folder.name}
                    </h3>
                    {folder.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">{folder.description}</p>
                    )}

                    <div className={`flex items-center gap-1 text-xs font-semibold ${color.text} group-hover:gap-2 transition-all`}>
                      <span>Open Folder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>© 2026 Dr. M. Poongothai — IRTT</span>
          <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors cursor-pointer">← Back to Portfolio</button>
        </div>
      </footer>
    </div>
  );
}
