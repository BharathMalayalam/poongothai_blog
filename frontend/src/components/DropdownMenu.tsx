import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, LogIn, FolderOpen, Menu, X } from 'lucide-react';

interface DropdownMenuProps {
  onNavigate: (section: string) => void;
}

export default function DropdownMenu({ onNavigate }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        id="dropdown-profile-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 glass rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-200 text-slate-300 hover:text-white cursor-pointer"
        aria-label="Menu"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-4 h-4" />
              </motion.span>
            : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="w-4 h-4" />
              </motion.span>
          }
        </AnimatePresence>
        <span className="text-xs font-semibold">Menu</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="dropdown-menu-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-52 z-50"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl py-2 overflow-hidden text-slate-900">
              <div className="px-3.5 py-1.5 text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase border-b border-slate-100 mb-1">
                Navigation
              </div>

              <button
                id="nav-home-btn"
                onClick={() => handleItemClick(() => { onNavigate('home'); navigate('/'); })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <Home className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                Home
              </button>

              <button
                id="nav-blog-btn"
                onClick={() => handleItemClick(() => navigate('/blog'))}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                Blogs
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                id="nav-signin-btn"
                onClick={() => handleItemClick(() => navigate('/admin'))}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left cursor-pointer group font-semibold"
              >
                <LogIn className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                Sign In
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
