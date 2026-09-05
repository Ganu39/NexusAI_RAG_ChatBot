"use client";

import React, { useState } from "react";
import { ArrowRight, GitBranch, Upload, FileText, Database, Search, Bot, CheckCircle2, Sparkles, Layers, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-background">
      {/* Background Holographic Atmosphere */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[350px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT SIDE: Split Headline, Meta & CTAs (Cols 1-6) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold bg-surface border-border text-accent gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono">NexusAI Engine Active</span>
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary font-mono">FAISS 3072d</span>
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.12] text-text-primary"
            >
              Turn Your Documents Into an <br />
              <span className="text-gradient-accent">Intelligent Knowledge Base</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed"
            >
              Upload documents, generate vector embeddings, and ask questions with grounded AI answers backed by verified source citations and similarity scores.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto"
            >
              <Button asChild size="lg" className="h-12 px-7 text-sm font-semibold bg-accent hover:bg-accent-hover text-white shadow-lg transition-all">
                <Link href="/dashboard">
                  <span>Open Workspace</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm font-semibold border-border bg-surface hover:bg-surface-elevated text-text-primary transition-all">
                <Link href="/documents">
                  <Upload className="mr-2 w-4 h-4 text-emerald-500" />
                  <span>Upload Document</span>
                </Link>
              </Button>

              <Button asChild size="lg" variant="ghost" className="h-12 px-4 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted">
                <Link href="https://github.com/Ganu39/NexusAI" target="_blank" rel="noreferrer">
                  <GitBranch className="mr-1.5 w-4 h-4" />
                  <span>View on GitHub ↗</span>
                </Link>
              </Button>
            </motion.div>

            {/* Quick architectural capability tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 text-xs font-mono text-text-tertiary pt-3 border-t border-border/70 w-full"
            >
              <div className="flex items-center gap-1.5 text-text-secondary">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Deterministic Grounding</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>FAISS Indexing</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Bot className="w-3.5 h-3.5 text-purple-500" />
                <span>Gemini 2.5 Flash</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE: Interactive 3D Knowledge Visualization Canvas (Cols 7-12) */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="lg:col-span-6 perspective-[1200px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                transform: shouldReduceMotion
                  ? "none"
                  : `rotateX(${mousePos.y * -10}deg) rotateY(${mousePos.x * 12}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.15s ease-out",
              }}
              className="relative rounded-3xl border border-border bg-surface/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden glow-primary"
            >
              {/* Header Status of 3D Canvas */}
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                    RAG Knowledge Visualization
                  </span>
                </div>
                <span className="text-[10px] font-mono text-accent bg-surface-muted px-2 py-0.5 rounded border border-border">
                  Spatial Node Flow
                </span>
              </div>

              {/* 3D Spatial Knowledge Playground */}
              <div className="relative min-h-[340px] sm:min-h-[380px] flex items-center justify-center">
                {/* Orbital Background Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full border border-indigo-500/15 border-dashed animate-[spin_40s_linear_infinite]" />
                  <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full border border-purple-500/20 animate-[spin_25s_linear_infinite_reverse]" />
                </div>

                {/* 1. TOP NODE: 📄 Document Ingestion */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transform: "translateZ(45px)" }}
                  className="absolute top-1 left-2 sm:top-2 sm:left-4 z-20"
                >
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated/95 p-3 shadow-lg hover:border-accent/50 transition-all">
                    <FileText className="h-4 w-4 text-accent" />
                    <div>
                      <div className="text-xs font-bold text-text-primary font-mono">Architecture.pdf</div>
                      <div className="text-[9px] text-text-secondary">PDF • 1.4 MB • 6 Pages</div>
                    </div>
                  </div>
                </motion.div>

                {/* 2. TOP-RIGHT NODE: 🔹 Chunking & Embeddings */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  style={{ transform: "translateZ(40px)" }}
                  className="absolute top-1 right-2 sm:top-2 sm:right-4 z-20"
                >
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated/95 p-3 shadow-lg hover:border-purple-500/50 transition-all">
                    <Database className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-xs font-bold text-text-primary font-mono">Vector Embeddings</div>
                      <div className="text-[9px] text-purple-600 dark:text-purple-300">Gemini 3072d • FAISS</div>
                    </div>
                  </div>
                </motion.div>

                {/* 3. CENTER: ✦ NEXUSAI AI CORE ✦ */}
                <motion.div
                  animate={{
                    y: [0, -4, 0],
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transform: "translateZ(65px)" }}
                  className="relative z-30 flex flex-col items-center justify-center"
                >
                  <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 p-0.5 shadow-2xl shadow-indigo-600/35">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-[14px] bg-background border border-indigo-400/40 p-2 text-center">
                      <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse mb-1" />
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-primary">
                        NexusAI
                      </span>
                      <span className="text-[7px] font-mono text-indigo-400">
                        RAG Core
                      </span>
                    </div>
                    {/* Orbiting pulse particle */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-md shadow-indigo-400 animate-ping" />
                  </div>
                </motion.div>

                {/* 4. BOTTOM-LEFT NODE: 🔍 Semantic Retrieval */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  style={{ transform: "translateZ(35px)" }}
                  className="absolute bottom-1 left-2 sm:bottom-2 sm:left-4 z-20"
                >
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated/95 p-3 shadow-lg hover:border-blue-500/50 transition-all">
                    <Search className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-xs font-bold text-text-primary font-mono">Semantic Retrieval</div>
                      <div className="text-[9px] text-text-secondary">Cosine Top-K Chunks</div>
                    </div>
                  </div>
                </motion.div>

                {/* 5. BOTTOM-RIGHT NODE: ✓ Grounded Answer & Citations */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                  style={{ transform: "translateZ(50px)" }}
                  className="absolute bottom-1 right-2 sm:bottom-2 sm:right-4 z-20"
                >
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-surface-elevated/95 p-3 shadow-lg hover:border-emerald-500/60 transition-all">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-text-primary font-mono">Grounded Answer</div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-300">Page 6 • 96.4% Match</div>
                    </div>
                  </div>
                </motion.div>

                {/* SVG 3D Connecting Beams */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 stroke-border stroke-[1.5]">
                  <line x1="25%" y1="20%" x2="50%" y2="50%" strokeDasharray="4 4" className="stroke-indigo-500/40" />
                  <line x1="75%" y1="20%" x2="50%" y2="50%" strokeDasharray="4 4" className="stroke-purple-500/40" />
                  <line x1="25%" y1="80%" x2="50%" y2="50%" strokeDasharray="4 4" className="stroke-blue-500/40" />
                  <line x1="75%" y1="80%" x2="50%" y2="50%" strokeDasharray="4 4" className="stroke-emerald-500/40" />
                </svg>
              </div>

              {/* Footer Indicator on Canvas */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] font-mono text-text-tertiary">
                <span className="flex items-center gap-1 text-text-secondary">
                  <Cpu className="w-3 h-3 text-accent" />
                  <span>3072d Dimension Space</span>
                </span>
                <span className="text-emerald-500 font-semibold">100% Deterministic Grounding</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

