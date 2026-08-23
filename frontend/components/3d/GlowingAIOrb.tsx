'use client';

import React from 'react';
import Image from 'next/image';

interface GlowingAIOrbCanvasProps {
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GlowingAIOrbCanvas({
  isProcessing = false,
  size = 'lg',
}: GlowingAIOrbCanvasProps) {
  if (size === 'sm') {
    return (
      <div className="w-9 h-9 relative flex items-center justify-center shrink-0">
        {/* Ambient Glow */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 blur-sm ${
            isProcessing ? 'bg-cyan-400/60 animate-pulse' : 'bg-cyan-500/25'
          }`}
        />
        {/* Compact Avatar */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-cyan-400/50 shadow-md bg-slate-950 flex items-center justify-center">
          <Image
            src="/nexusbot-avatar.jpg"
            alt="Nexus_Bot Logo"
            width={36}
            height={36}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isProcessing ? 'scale-110' : 'scale-100'
            }`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {/* Ambient Pulsing Ring */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-xl ${
          isProcessing
            ? 'bg-cyan-400/50 scale-125 animate-pulse'
            : 'bg-violet-500/20 scale-100'
        }`}
      />

      {/* 3D Robot Head Mascot (Nexus_Bot) Container */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-cyan-400/50 p-0.5 shadow-[0_0_35px_rgba(6,182,212,0.35)] backdrop-blur-xl group hover:border-cyan-300 transition-all duration-300 bg-slate-950">
        <Image
          src="/nexusbot-avatar.jpg"
          alt="Nexus_Bot Mascot"
          width={128}
          height={128}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isProcessing ? 'scale-105 animate-pulse' : 'group-hover:scale-105'
          }`}
          priority
        />
      </div>
    </div>
  );
}

export default GlowingAIOrbCanvas;
