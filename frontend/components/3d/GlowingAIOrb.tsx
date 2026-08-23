'use client';

import React from 'react';
import { Bot, Sparkles, Cpu } from 'lucide-react';

export function GlowingAIOrbCanvas({ isProcessing = false }: { isProcessing?: boolean }) {
  return (
    <div className="w-full h-full min-h-[120px] min-w-[120px] relative flex items-center justify-center">
      {/* Ambient Pulsing Glow Rings */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl ${
          isProcessing
            ? 'bg-cyan-500/40 scale-125 animate-pulse'
            : 'bg-indigo-500/25 scale-100'
        }`}
      />

      {/* 3D Robot Head Mascot (Nexus_Bot) Container */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-950/90 border border-cyan-400/40 p-3 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center backdrop-blur-xl group hover:border-cyan-300 transition-all duration-300">
        {/* Antenna Light */}
        <div className="absolute -top-3 flex flex-col items-center">
          <div
            className={`w-3 h-3 rounded-full border border-white/40 shadow-sm ${
              isProcessing
                ? 'bg-cyan-400 animate-ping shadow-[0_0_12px_rgba(34,211,238,1)]'
                : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
            }`}
          />
          <div className="w-1 h-3 bg-slate-700" />
        </div>

        {/* Robot Face Visor Screen */}
        <div className="w-full h-14 sm:h-16 rounded-2xl bg-slate-950 border border-cyan-500/50 flex items-center justify-center relative overflow-hidden shadow-inner px-2">
          {/* Scanlines Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(6,182,212,0.08)_50%)] bg-[length:100%_4px] pointer-events-none" />

          {/* Animated Glowing Eyes */}
          <div className="flex items-center gap-3.5 z-10">
            <div
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] transition-transform ${
                isProcessing ? 'scale-125 animate-pulse bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]' : ''
              }`}
            />
            <div
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] transition-transform ${
                isProcessing ? 'scale-125 animate-pulse bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]' : ''
              }`}
            />
          </div>

          {/* Curved Digital Smile Expression */}
          <div className="absolute bottom-2 w-8 h-1 rounded-full bg-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
        </div>

        {/* Bot Name Badge */}
        <div className="mt-1.5 flex items-center gap-1">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-extrabold tracking-wider text-white font-mono uppercase">
            Nexus_Bot
          </span>
        </div>
      </div>
    </div>
  );
}

export default GlowingAIOrbCanvas;
