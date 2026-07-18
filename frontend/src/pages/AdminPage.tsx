import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn, LogOut, FolderPlus, Upload, Trash2, FolderOpen,
  FileText, Image, CheckCircle, XCircle, Loader2, GraduationCap,
  Eye, ChevronRight, Shield, AlertCircle, X, Link2
} from 'lucide-react';

interface Folder { _id: string; name: string; description: string; fileCount: number; subfolderCount?: number; parentFolderId?: string | null; }
interface FileItem { _id: string; title: string; fileType: string; fileName: string; fileUrl: string; }

type Toast = { id: number; message: string; type: 'success' | 'error' };

export default function AdminPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [folderCreating, setFolderCreating] = useState(false);

  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [fileDesc, setFileDesc] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [driveLink, setDriveLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openFolder, setOpenFolder] = useState<{
    folder: Folder;
    files: FileItem[];
    subfolders: Folder[];
    path: Array<{ _id: string; name: string }>
  } | null>(null);
  const [folderFilesLoading, setFolderFilesLoading] = useState(false);

  // Subfolder and inner-folder file upload states
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [subfolderCreating, setSubfolderCreating] = useState(false);

  const [subFileTitle, setSubFileTitle] = useState('');
  const [subFileDesc, setSubFileDesc] = useState('');
  const [subFileObj, setSubFileObj] = useState<File | null>(null);
  const [subUploadMode, setSubUploadMode] = useState<'file' | 'link'>('file');
  const [subDriveLink, setSubDriveLink] = useState('');
  const [subUploading, setSubUploading] = useState(false);
  const subFileInputRef = useRef<HTMLInputElement>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const getFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || '';
    return `${backendUrl.replace(/\/$/, '')}${url}`;
  };

  const authFetch = (url: string, opts: RequestInit = {}) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const fullUrl = url.startsWith('http') ? url : `${apiBase.replace(/\/$/, '')}${url}`;
    return fetch(fullUrl, { ...opts, headers: { ...((opts.headers as Record<string, string>) || {}), Authorization: `Bearer ${token}` } });
  };

  const loadFolders = () => {
    setFoldersLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || '';
    fetch(`${apiBase.replace(/\/$/, '')}/api/folders`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFolders(d); setFoldersLoading(false); })
      .catch(() => setFoldersLoading(false));
  };

  useEffect(() => { if (token) loadFolders(); }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const r = await fetch(`${apiBase.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Login failed');
      localStorage.setItem('admin_token', d.token);
      setToken(d.token);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setFolders([]);
    setOpenFolder(null);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolderCreating(true);
    try {
      const r = await authFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), description: newFolderDesc.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(`Folder "${newFolderName}" created!`);
      setNewFolderName('');
      setNewFolderDesc('');
      loadFolders();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setFolderCreating(false);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}" and ALL its contents (including subfolders and files)? This cannot be undone.`)) return;
    try {
      const r = await authFetch(`/api/folders/${folder._id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error);
      toast(`Folder "${folder.name}" deleted`);
      if (openFolder?.path?.some(p => p._id === folder._id)) setOpenFolder(null);
      loadFolders();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const executeUpload = async (
    folderId: string,
    title: string,
    description: string,
    mode: 'file' | 'link',
    file: File | null,
    link: string,
    setLoadingState: (val: boolean) => void,
    onSuccess: () => void
  ) => {
    if (!folderId || !title.trim()) return;
    if (mode === 'file' && !file) return;
    if (mode === 'link' && !link.trim()) return;

    setLoadingState(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      if (mode === 'file' && file) {
        form.append('file', file);
      } else if (mode === 'link') {
        form.append('linkUrl', link.trim());
      }
      const r = await authFetch(`/api/upload/${folderId}`, { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      
      toast(`"${title}" uploaded!`);
      onSuccess();
      loadFolders();
      if (openFolder?.folder._id === folderId) {
        loadFolderFiles(openFolder.folder);
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setLoadingState(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeUpload(
      selectedFolderId,
      fileTitle,
      fileDesc,
      uploadMode,
      fileObj,
      driveLink,
      setUploading,
      () => {
        setFileTitle('');
        setFileDesc('');
        setFileObj(null);
        setDriveLink('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  const loadFolderFiles = async (folder: Folder) => {
    setFolderFilesLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const r = await fetch(`${apiBase.replace(/\/$/, '')}/api/folders/${folder._id}`);
      const d = await r.json();
      setOpenFolder({
        folder: d.folder || folder,
        files: d.files || [],
        subfolders: d.subfolders || [],
        path: d.path || []
      });
    } catch (err) {
      console.error(err);
      toast('Failed to load folder details', 'error');
    } finally {
      setFolderFilesLoading(false);
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm(`Delete "${file.title}"?`)) return;
    try {
      const r = await authFetch(`/api/files/${file._id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error);
      toast(`"${file.title}" deleted`);
      if (openFolder) loadFolderFiles(openFolder.folder);
      loadFolders();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleCreateSubfolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openFolder || !newSubFolderName.trim()) return;
    setSubfolderCreating(true);
    try {
      const r = await authFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubFolderName.trim(),
          description: `Subfolder of ${openFolder.folder.name}`,
          parentFolderId: openFolder.folder._id
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(`Subfolder "${newSubFolderName}" created!`);
      setNewSubFolderName('');
      loadFolders();
      loadFolderFiles(openFolder.folder);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setSubfolderCreating(false);
    }
  };

  const handleUploadToCurrentFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openFolder) return;
    await executeUpload(
      openFolder.folder._id,
      subFileTitle,
      subFileDesc,
      subUploadMode,
      subFileObj,
      subDriveLink,
      setSubUploading,
      () => {
        setSubFileTitle('');
        setSubFileDesc('');
        setSubFileObj(null);
        setSubDriveLink('');
        if (subFileInputRef.current) subFileInputRef.current.value = '';
      }
    );
  };

  const handleDeleteSubfolder = async (sub: Folder) => {
    if (!confirm(`Delete subfolder "${sub.name}" and ALL its contents? This cannot be undone.`)) return;
    try {
      const r = await authFetch(`/api/folders/${sub._id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error);
      toast(`Subfolder "${sub.name}" deleted`);
      loadFolders();
      if (openFolder) loadFolderFiles(openFolder.folder);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const getFolderDisplayName = (folder: Folder): string => {
    if (!folder.parentFolderId) return folder.name;
    const parent = folders.find(f => f._id === folder.parentFolderId);
    if (parent) {
      return `${getFolderDisplayName(parent)} > ${folder.name}`;
    }
    return folder.name;
  };

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6 font-sans">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-white">Admin Login</h1>
            <p className="text-slate-400 text-sm mt-1">Academic Content Library — IRTT</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="poongothai@irttech.ac.in" required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/60" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••••" required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/60" />
              </div>
              {loginError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />{loginError}
                </div>
              )}
              <button type="submit" disabled={loginLoading}
                className="flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-60 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm">
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">
                ← Back to Home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-extrabold text-base leading-none">Admin Dashboard</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Dr. M. Poongothai — IRTT</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/blog')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
            <Eye className="w-3.5 h-3.5" /> View Site
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Create Folder */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <FolderPlus className="w-4 h-4 text-rose-600" />
              </div>
              <h2 className="font-display font-bold text-slate-900 text-base">Create Folder</h2>
            </div>
            <form onSubmit={handleCreateFolder} className="flex flex-col gap-3">
              <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. DSA)" required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400" />
              <textarea value={newFolderDesc} onChange={e => setNewFolderDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400" />
              <button type="submit" disabled={folderCreating || !newFolderName.trim()}
                className="flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer">
                {folderCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                {folderCreating ? 'Creating...' : 'Create Folder'}
              </button>
            </form>
          </div>

          {/* Upload File */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-display font-bold text-slate-900 text-base">Upload File / Link</h2>
            </div>
            
            <div className="flex border-b border-slate-100 mb-3.5">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 pb-2 text-xs font-bold transition-all cursor-pointer text-center ${uploadMode === 'file' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Local File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 pb-2 text-xs font-bold transition-all cursor-pointer text-center ${uploadMode === 'link' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Drive / URL Link
              </button>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-3">
              <select value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)} required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 bg-white">
                <option value="">Select a folder...</option>
                {folders.map(f => <option key={f._id} value={f._id}>{getFolderDisplayName(f)}</option>)}
              </select>
              <input type="text" value={fileTitle} onChange={e => setFileTitle(e.target.value)}
                placeholder="File/Link title" required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400" />
              <textarea value={fileDesc} onChange={e => setFileDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400" />
              
              {uploadMode === 'file' ? (
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs text-slate-500 text-center">
                    {fileObj ? <span className="text-blue-600 font-semibold">{fileObj.name}</span>
                      : <>Click to select<br /><span className="text-slate-400">PDF, JPG, PNG (max 25MB)</span></>}
                  </span>
                  <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="sr-only"
                    onChange={e => setFileObj(e.target.files?.[0] ?? null)} />
                </label>
              ) : (
                <div className="relative">
                  <input type="url" value={driveLink} onChange={e => setDriveLink(e.target.value)}
                    placeholder="Google Drive link (https://drive.google.com/...)" required
                    className="w-full px-3.5 py-2.5 pl-9 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400" />
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              )}

              <button type="submit" disabled={uploading || !selectedFolderId || !fileTitle.trim() || (uploadMode === 'file' ? !fileObj : !driveLink.trim())}
                className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (uploadMode === 'file' ? <Upload className="w-4 h-4" /> : <Link2 className="w-4 h-4" />)}
                {uploading ? 'Processing...' : (uploadMode === 'file' ? 'Upload File' : 'Add Drive Link')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!openFolder ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <h2 className="font-display font-bold text-slate-900 text-base">Folders ({folders.filter(f => !f.parentFolderId).length})</h2>
                </div>
                {foldersLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              {folders.filter(f => !f.parentFolderId).length === 0 && !foldersLoading && (
                <p className="text-sm text-slate-400 text-center py-6">No folders yet. Create one above.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {folders.filter(f => !f.parentFolderId).map(folder => (
                  <div key={folder._id}
                    className={`group border rounded-xl p-4 transition-all duration-200 cursor-pointer ${openFolder?.folder._id === folder._id ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'}`}
                    onClick={() => loadFolderFiles(folder)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderOpen className={`w-5 h-5 shrink-0 ${openFolder?.folder._id === folder._id ? 'text-rose-500' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{folder.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {folder.subfolderCount || 0} subfolder{folder.subfolderCount !== 1 ? 's' : ''} • {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 transition-colors" />
                        <button onClick={e => { e.stopPropagation(); handleDeleteFolder(folder); }}
                          className="p-1 hover:bg-red-100 rounded-md transition-colors text-slate-300 hover:text-red-500 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                
                {/* Folder Header & Breadcrumbs */}
                <div className="flex flex-col gap-2 mb-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <button onClick={() => setOpenFolder(null)} className="hover:text-rose-600 transition-colors cursor-pointer font-bold">
                        Root
                      </button>
                      {openFolder.path?.map((p, idx) => (
                        <span key={p._id} className="flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          {idx === openFolder.path.length - 1 ? (
                            <span className="text-slate-800 font-bold max-w-[150px] truncate">
                              {p.name}
                            </span>
                          ) : (
                            <button 
                              onClick={() => {
                                const f = folders.find(x => x._id === p._id);
                                if (f) loadFolderFiles(f);
                              }} 
                              className="hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              {p.name}
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => setOpenFolder(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-sm">{openFolder.folder.name}</h3>
                      {openFolder.folder.description && (
                        <p className="text-[11px] text-slate-500">{openFolder.folder.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subfolder and Upload forms (Option 1 and Option 2) */}
                {!folderFilesLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-b border-slate-100 pb-5">
                    {/* Option 1: Create Subfolder */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <FolderPlus className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-slate-700">Add Subfolder</span>
                      </div>
                      <form onSubmit={handleCreateSubfolder} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newSubFolderName} 
                          onChange={e => setNewSubFolderName(e.target.value)}
                          placeholder="Subfolder name" 
                          required
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-400" 
                        />
                        <button 
                          type="submit" 
                          disabled={subfolderCreating || !newSubFolderName.trim()}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {subfolderCreating ? '...' : 'Create'}
                        </button>
                      </form>
                    </div>

                    {/* Option 2: Upload File Here */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="flex justify-between items-center mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-700">Upload Here</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSubUploadMode('file')}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${subUploadMode === 'file' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            File
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubUploadMode('link')}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${subUploadMode === 'link' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Link
                          </button>
                        </div>
                      </div>
                      <form onSubmit={handleUploadToCurrentFolder} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={subFileTitle} 
                            onChange={e => setSubFileTitle(e.target.value)}
                            placeholder="File/Link title" 
                            required
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" 
                          />
                          {subUploadMode === 'file' && (
                            <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer text-center truncate max-w-[120px]">
                              {subFileObj ? subFileObj.name : 'Choose File'}
                              <input 
                                ref={subFileInputRef}
                                type="file" 
                                accept=".pdf,image/*" 
                                className="sr-only"
                                onChange={e => setSubFileObj(e.target.files?.[0] ?? null)} 
                              />
                            </label>
                          )}
                        </div>
                        {subUploadMode === 'link' && (
                          <div className="relative">
                            <input 
                              type="url" 
                              value={subDriveLink} 
                              onChange={e => setSubDriveLink(e.target.value)}
                              placeholder="Google Drive link (https://drive.google.com/...)" 
                              required
                              className="w-full px-3 py-1.5 pl-7 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" 
                            />
                            <Link2 className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                          </div>
                        )}
                        <button 
                          type="submit" 
                          disabled={subUploading || !subFileTitle.trim() || (subUploadMode === 'file' ? !subFileObj : !subDriveLink.trim())}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          {subUploading ? 'Processing...' : (subUploadMode === 'file' ? 'Upload' : 'Add Link')}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {folderFilesLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>}

                {/* Subfolders List */}
                {!folderFilesLoading && openFolder.subfolders && openFolder.subfolders.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400" /> Subfolders ({openFolder.subfolders.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {openFolder.subfolders.map(sub => (
                        <div key={sub._id}
                          className="group border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 rounded-xl p-3 transition-all duration-200 cursor-pointer flex items-center justify-between min-w-0"
                          onClick={() => loadFolderFiles(sub)}>
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-rose-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-xs truncate">{sub.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">
                                {sub.subfolderCount || 0} subfolder{sub.subfolderCount !== 1 ? 's' : ''} • {sub.fileCount} file{sub.fileCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-rose-500" />
                            <button onClick={e => { e.stopPropagation(); handleDeleteSubfolder(sub); }}
                              className="p-1 hover:bg-red-100 rounded-md transition-colors text-slate-300 hover:text-red-500 cursor-pointer">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files List */}
                {!folderFilesLoading && (
                  <div>
                    {openFolder.subfolders && openFolder.subfolders.length > 0 && (
                      <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> Files ({openFolder.files.length})
                      </h4>
                    )}
                    {openFolder.files.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No files in this folder yet.</p>
                    )}
                    <div className="flex flex-col gap-2">
                      {openFolder.files.map(file => (
                        <div key={file._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${file.fileType === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {file.fileType === 'pdf' ? <FileText className="w-4 h-4 text-red-500" /> : <Image className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{file.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{file.fileName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a href={getFileUrl(file.fileUrl)} target="_blank" rel="noreferrer"
                              className="p-1.5 hover:bg-blue-100 rounded-md transition-colors text-slate-300 hover:text-blue-500 cursor-pointer" title="View file">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => handleDeleteFile(file)}
                              className="p-1.5 hover:bg-red-100 rounded-md transition-colors text-slate-300 hover:text-red-500 cursor-pointer" title="Delete file">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
