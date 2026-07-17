/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function ProfileSection() {
  const profileImg = '/src/assets/images/dr_poongothai.png';

  return (
    <div className="relative w-full max-w-[380px] aspect-square mx-auto flex items-center justify-center p-6 select-none" id="profile-container">
      {/* Background ambient glowing rings and decorative orbits */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Soft elegant background glows using theme colors */}
        <div className="absolute w-[85%] h-[85%] bg-gradient-to-tr from-teal-500/10 to-violet-500/10 rounded-full filter blur-2xl opacity-60 animate-pulse" />
        
        {/* Subtle decorative dashed ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute w-[90%] h-[90%] border border-dashed border-slate-200 rounded-full"
        />

        {/* Outer solid thin accent ring */}
        <div className="absolute w-[78%] h-[78%] border border-teal-500/20 rounded-full" />
      </div>

      {/* Main Professional Profile Frame */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        className="relative z-10 w-[74%] aspect-square rounded-full p-3 bg-white/80 backdrop-blur-md shadow-xl border border-slate-100"
      >
        <div className="relative w-full h-full rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
          {/* Subtle color gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 via-transparent to-secondary-500/5 mix-blend-overlay z-10 pointer-events-none" />
          
          <img
            src={profileImg}
            alt="Dr. M. Poongothai"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform hover:scale-[1.03] transition-transform duration-700"
          />
        </div>

        {/* Elegant Academic Badge on Bottom Arc */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-slate-200/80 shadow-md px-4 py-1.5 rounded-full flex items-center gap-1.5 z-20"
        >
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-3xs font-mono font-bold text-slate-700 whitespace-nowrap uppercase tracking-widest">
            Verified Faculty
          </span>
        </motion.div>
      </motion.div>

      {/* Top right floating particle indicator */}
      <div className="absolute top-8 right-8 w-4 h-4 text-violet-500/40 animate-pulse">
        <Sparkles className="w-full h-full" />
      </div>
    </div>
  );
}
