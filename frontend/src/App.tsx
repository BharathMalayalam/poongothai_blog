/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowUpRight } from 'lucide-react';

// Component imports
import DropdownMenu from './components/DropdownMenu';

// Asset imports
import classroomBg from './assets/images/classroom_bg.jpg';

// Page imports (Code splitting / Lazy load)
const BlogPage = lazy(() => import('./pages/BlogPage'));
const FolderPage = lazy(() => import('./pages/FolderPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

export default function App() {
  const navigate = useNavigate();

  // Copy status feedback states
  const [copiedType, setCopiedType] = useState<'email' | 'phone' | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const aboutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAboutMouseEnter = () => {
    if (aboutTimeoutRef.current) {
      clearTimeout(aboutTimeoutRef.current);
      aboutTimeoutRef.current = null;
    }
    setShowAbout(true);
  };

  const handleAboutMouseLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => {
      setShowAbout(false);
    }, 250); // 250ms delay
  };

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDropdownNavigate = (_section: string) => {
    // Navigation handled by DropdownMenu internally via useNavigate
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white relative">
        <div className="absolute inset-0 bg-slate-950/90 z-0" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 animate-pulse">
            <GraduationCap className="w-6 h-6 text-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-slate-400">Loading resources...</span>
          </div>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/folder/:id" element={<FolderPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={
          <div className="min-h-screen flex flex-col relative overflow-x-hidden font-sans text-white bg-cover bg-center" style={{ backgroundImage: `url(${classroomBg})` }}>
            {/* Backdrop overlay for text contrast */}
            <div className="absolute inset-0 bg-slate-950/75 z-0" />
   
            {/* HEADER NAVBAR */}
            <header className="relative z-30 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              {/* Left: Branding + Dropdown */}
              <div 
                className="relative z-50"
                onMouseEnter={handleAboutMouseEnter}
                onMouseLeave={handleAboutMouseLeave}
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer py-1 select-none"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-md">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="font-display font-extrabold text-white text-lg tracking-tight">
                    Dr. M. Poongothai<span className="text-white font-light">.</span>
                  </span>
                </div>
                
                <AnimatePresence>
                  {showAbout && (
                    <motion.div
                      onMouseEnter={handleAboutMouseEnter}
                      onMouseLeave={handleAboutMouseLeave}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full -mt-2 pt-2 w-72 z-50"
                    >
                      <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-5 pb-7 ">
                        {/* Header */}
                        <div className="pb-3 border-b border-slate-100 mb-3">
                          <h3 className="text-sm font-bold text-slate-900">Dr. M. Poongothai</h3>
                          <p className="text-[10px] text-slate-400 font-mono">Assistant Professor(SR), Dept. of IT, GCE</p>
                        </div>
                        
                        {/* Details */}
                        <div className="flex flex-col gap-3.5 text-xs text-slate-700">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 leading-none">Qualifications</p>
                            <p className="font-bold text-slate-800 leading-normal">M.E., Ph.D.</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 leading-none">Specialization</p>
                            <p className="font-semibold text-slate-800 leading-normal">Data Mining</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 leading-none">Experience</p>
                            <p className="font-semibold text-slate-800 leading-normal">16 Years Teaching & Research</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 leading-none">Location</p>
                            <p className="text-slate-600 leading-normal"><b>GCE Erode</b>, Tamil Nadu</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
   
              {/* Right: Dropdown Menu */}
              <div className="flex items-center gap-6">
                <span onClick={() => navigate('/blog')} className="cursor-pointer hover:text-slate-300 transition-colors font-semibold text-slate-200 text-l hover:underline underline-offset-6">Blogs</span>
                <DropdownMenu onNavigate={handleDropdownNavigate} />
              </div>
            </header>
   
            {/* MAIN HERO CONTENT */}
            <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-12">
              {/* Left side: Serif Typography */}
              <div className="flex flex-col items-start max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-4"
                >
                  <h1 className="text-5xl sm:text-6xl lg:text-5xl font-display font-bold italic text-white leading-tight tracking-tight">
                  Education is the most powerful weapon which you can use to change the world.
                  </h1>
                  <p className="text-base sm:text-lg text-slate-300 font-normal">
                    Inspiring minds and shaping futures.
                  </p>
                  
                  {/* Mobile-only responsive Blogs Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="pt-2 md:hidden"
                  >
                    <button
                      onClick={() => navigate('/blog')}
                      className="px-6 py-3 bg-white text-slate-900 font-bold rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 border border-slate-200"
                    >
                      <span>Blogs</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-900" />
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </main>
   
            {/* FIXED BLOG CIRCULAR BUTTON IN BOTTOM RIGHT CORNER (Desktop only) */}
            <div className="absolute bottom-24 right-8 z-30 hidden md:block">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onClick={() => navigate('/blog')}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 text-slate-900 flex flex-col items-center justify-center font-bold tracking-tight text-[11px] transition-all duration-300 hover:scale-105 shadow-2xl cursor-pointer select-none border border-slate-200"
              >
                <ArrowUpRight className="w-3 h-3 mt-0.5 text-slate-950" />
              </motion.button>
            </div>
   
            {/* FOOTER SECTION */}
            <footer className="relative z-10 mt-auto w-full max-w-7xl mx-auto px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <div>
                © 2026 Dr. M. Poongothai. All academic rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">Department of IT, GCE Erode</span>
              </div>
            </footer>
          </div>
        } />
      </Routes>
    </Suspense>
  );
}
