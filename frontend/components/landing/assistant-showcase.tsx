"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Sparkles,
  FileText,
  CheckCircle2,
  ArrowRight,
  Database,
  Search,
  Layers,
  Cpu,
  CornerDownRight,
  ShieldCheck,
  Activity,
  FileCode,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DemoScenario {
  id: string;
  pillLabel: string;
  userQuestion: string;
  aiResponse: string;
  confidenceScore: number;
  retrievedChunks: number;
  sources: {
    filename: string;
    page: number;
    relevance: number;
    snippet: string;
    docType: string;
    isPrimary?: boolean;
  }[];
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "architecture",
    pillLabel: "What does this document explain?",
    userQuestion: "What does the project architecture look like?",
    aiResponse:
      "Based on your indexed documents, the system uses a Next.js frontend connected to a FastAPI backend, with FAISS handling semantic retrieval and Gemini generating grounded answers.",
    confidenceScore: 96.4,
    retrievedChunks: 4,
    sources: [
      {
        filename: "README.md",
        page: 6,
        relevance: 96.4,
        snippet: "Decoupled cloud architecture connecting a Next.js App Router client with a FastAPI asynchronous RAG backend.",
        docType: "MARKDOWN",
        isPrimary: true,
      },
      {
        filename: "PROJECT_STATE.md",
        page: 3,
        relevance: 91.8,
        snippet: "FAISS vector database indexes semantic chunks locally with cosine similarity retrieval driving Gemini 2.5 Flash.",
        docType: "MARKDOWN",
        isPrimary: false,
      },
      {
        filename: "docker-compose.yml",
        page: 1,
        relevance: 88.5,
        snippet: "Defines backend container on port 8000 and frontend on port 3000 with volume persistence for index storage.",
        docType: "CONFIG",
        isPrimary: false,
      },
    ],
  },
  {
    id: "summary",
    pillLabel: "Summarize the key findings",
    userQuestion: "Summarize the key findings from the uploaded technical report.",
    aiResponse:
      "The documentation emphasizes that Recursive Chunking with 3072-dimensional Gemini embeddings increases retrieval accuracy by 34%, eliminating hallucinated responses via strict context isolation.",
    confidenceScore: 98.1,
    retrievedChunks: 5,
    sources: [
      {
        filename: "technical_report.pdf",
        page: 4,
        relevance: 98.1,
        snippet: "Page-aware chunking preserving semantic boundaries yielded a 34% improvement in citation precision.",
        docType: "PDF",
        isPrimary: true,
      },
      {
        filename: "rag_benchmarks.txt",
        page: 2,
        relevance: 93.5,
        snippet: "Evaluation over 500 domain queries confirmed zero out-of-context hallucinations under strict system prompts.",
        docType: "TEXT",
        isPrimary: false,
      },
    ],
  },
  {
    id: "requirements",
    pillLabel: "What are the main requirements?",
    userQuestion: "What are the main security and ingestion requirements?",
    aiResponse:
      "The system strictly limits uploads to PDF, TXT, and DOCX containers under 10MB, enforces server-side prompt-injection defenses, and isolates vector storage.",
    confidenceScore: 95.0,
    retrievedChunks: 3,
    sources: [
      {
        filename: "SECURITY.md",
        page: 2,
        relevance: 95.0,
        snippet: "All document text chunks are sanitized and encapsulated within isolated contextual boundaries to prevent prompt injections.",
        docType: "MARKDOWN",
        isPrimary: true,
      },
      {
        filename: "ingestion_spec.pdf",
        page: 1,
        relevance: 92.4,
        snippet: "Maximum upload payload is constrained to 10MB with MIME validation across PDF, plain text, and DOCX files.",
        docType: "PDF",
        isPrimary: false,
      },
    ],
  },
  {
    id: "location",
    pillLabel: "Where is this information mentioned?",
    userQuestion: "Where are the vector indexing parameters configured?",
    aiResponse:
      "Vector indexing parameters are specified in the backend FAISS configuration module, using L2-normalized Inner Product similarity and 3072-dimensional embeddings via `models/gemini-embedding-001`.",
    confidenceScore: 94.7,
    retrievedChunks: 4,
    sources: [
      {
        filename: "vector_store.py",
        page: 1,
        relevance: 94.7,
        snippet: "IndexFlatIP initialized with 3072 dimensions after L2 vector normalization for cosine similarity parity.",
        docType: "PYTHON",
        isPrimary: true,
      },
      {
        filename: "README.md",
        page: 8,
        relevance: 90.3,
        snippet: "FAISS vector database indexes semantic chunks locally with sub-millisecond retrieval latency.",
        docType: "MARKDOWN",
        isPrimary: false,
      },
    ],
  },
];

const RAG_PIPELINE_STEPS = [
  { id: "docs", label: "Documents", desc: "PDF/TXT/DOCX" },
  { id: "chunking", label: "Chunking", desc: "Recursive Split" },
  { id: "embeddings", label: "Embeddings", desc: "3072d Gemini" },
  { id: "search", label: "Vector Search", desc: "FAISS Cosine" },
  { id: "context", label: "Retrieved Context", desc: "Top-K Chunks" },
  { id: "ai", label: "AI Answer", desc: "Grounded 2.5 Flash" },
  { id: "sources", label: "Sources", desc: "Page & Score" },
];

export function AssistantShowcase() {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(
    DEMO_SCENARIOS[0]
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(5);
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  // Subtle 3D mouse parallax tracking
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

  // Animate step progression on scenario switch
  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setActiveStepIndex(0);
  };

  useEffect(() => {
    if (activeStepIndex < 6) {
      const timer = setTimeout(() => {
        setActiveStepIndex((prev) => prev + 1);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [activeStepIndex]);

  return (
    <section className="relative py-28 md:py-36 overflow-hidden bg-background border-y border-border">
      {/* Background Holographic Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[350px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-3 px-4 py-1.5 text-xs font-semibold bg-surface border-border text-accent gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span>Cinematic Product Showcase • Interactive Demo</span>
            </Badge>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight"
          >
            Your <span className="text-gradient-accent">AI Knowledge Assistant</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Ask your documents anything. Get answers grounded in your knowledge base.
            Experience how NexusAI indexes, searches vectors, and connects answers directly to source pages.
          </motion.p>
        </div>

        {/* 1. RAG RETRIEVAL SEQUENTIAL VISUALIZATION BAR */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-5xl mx-auto mb-10 overflow-x-auto pb-2"
        >
          <div className="flex items-center justify-between min-w-[720px] rounded-2xl border border-border bg-surface/90 p-3.5 shadow-md">
            {RAG_PIPELINE_STEPS.map((step, sIdx) => {
              const isPassed = sIdx <= activeStepIndex;
              const isCurrent = sIdx === activeStepIndex;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex flex-col items-center text-center px-3 py-1.5 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-accent/15 border border-accent/40 shadow-md scale-105"
                        : isPassed
                        ? "text-text-primary"
                        : "text-text-muted opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isCurrent
                            ? "bg-accent animate-ping"
                            : isPassed
                            ? "bg-emerald-500"
                            : "bg-text-muted"
                        }`}
                      />
                      <span className={`text-xs font-bold ${isCurrent ? "text-accent" : isPassed ? "text-text-primary" : "text-text-muted"}`}>
                        {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-tertiary mt-0.5">
                      {step.desc}
                    </span>
                  </div>

                  {sIdx < RAG_PIPELINE_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-5 sm:w-8 shrink-0 transition-colors duration-300 ${
                        sIdx < activeStepIndex
                          ? "bg-accent"
                          : "bg-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* 2. 3D HOLOGRAPHIC AI ASSISTANT PANEL */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="max-w-5xl mx-auto perspective-[1200px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              transform: shouldReduceMotion
                ? "none"
                : `rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 10}deg)`,
              transformStyle: "preserve-3d",
              transition: "transform 0.15s ease-out",
            }}
            className="relative rounded-3xl border border-border bg-surface p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-lg overflow-hidden glow-primary"
          >
            {/* AI Assistant Pop-Up Top Identity Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-6 mb-8 gap-4">
              <div className="flex items-center gap-4">
                {/* Rotating & Glowing AI Orb / Core */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 p-0.5 shadow-xl shadow-indigo-600/30">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[14px] bg-background border border-indigo-400/40">
                    <Bot className="h-6 w-6 text-indigo-400 animate-pulse" />
                  </div>
                  {/* Orbiting particle ring */}
                  <div className="absolute -inset-1 rounded-2xl border border-indigo-400/30 animate-[spin_10s_linear_infinite]" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-text-primary tracking-tight">
                      NexusAI Intelligent Core
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Interactive Demo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary font-mono mt-0.5">
                    <Activity className="h-3.5 w-3.5 text-accent animate-pulse" />
                    <span>FAISS Vector Retrieval • Gemini Grounding Active</span>
                  </div>
                </div>
              </div>

              {/* Animated Waveform Indicator */}
              <div className="flex items-center gap-1.5 bg-surface-muted px-3.5 py-2 rounded-xl border border-border">
                <span className="text-xs font-mono text-text-secondary mr-2">Signal:</span>
                {[40, 75, 100, 60, 90, 45, 80].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`] }}
                    transition={{
                      duration: 1.2 + (i % 3) * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1 bg-accent rounded-full h-4"
                  />
                ))}
              </div>
            </div>

            {/* Simulated Live Conversation */}
            <div className="space-y-6">
              {/* User Message Bubble */}
              <motion.div
                key={`user-${selectedScenario.id}`}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                style={{ transform: "translateZ(30px)" }}
                className="flex items-start justify-end gap-3"
              >
                <div className="rounded-2xl bg-accent px-5 py-3 text-xs sm:text-sm text-white shadow-lg max-w-xl">
                  <p className="font-medium">{selectedScenario.userQuestion}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-text-secondary border border-border shrink-0">
                  <User className="h-4 w-4" />
                </div>
              </motion.div>

              {/* AI Assistant Grounded Response */}
              <motion.div
                key={`ai-${selectedScenario.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                style={{ transform: "translateZ(45px)" }}
                className="flex items-start gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25 shrink-0 shadow-sm">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>

                <div className="flex-1 max-w-3xl space-y-3.5">
                  {/* Answer Glass Panel */}
                  <div className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6 text-xs sm:text-sm text-text-primary shadow-xl leading-relaxed space-y-4">
                    <p>{selectedScenario.aiResponse}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Grounded Answer
                        </span>
                        <span className="text-xs text-text-secondary font-mono">
                          ({selectedScenario.retrievedChunks} context chunks retrieved)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{selectedScenario.confidenceScore}% Grounding Confidence</span>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Line to Sources */}
                  <div className="flex items-center gap-2 pl-4 text-[11px] font-mono text-text-secondary">
                    <CornerDownRight className="h-4 w-4 text-accent animate-pulse" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-text-tertiary">
                      Retrieved Knowledge Sources & Citations
                    </span>
                  </div>

                  {/* 3. 3D FLOATING SOURCE DOCUMENT CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {selectedScenario.sources.map((src, sIdx) => {
                      const isHovered = hoveredSource === sIdx;
                      return (
                        <motion.div
                          key={`${src.filename}-${sIdx}`}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.2 + sIdx * 0.1 }}
                          onMouseEnter={() => setHoveredSource(sIdx)}
                          onMouseLeave={() => setHoveredSource(null)}
                          style={{
                            transform: isHovered ? "translateZ(60px) translateY(-6px)" : "translateZ(20px)",
                            transition: "all 0.25s ease-out",
                          }}
                          className={`rounded-2xl border p-4 cursor-default flex flex-col justify-between space-y-3 transition-all ${
                            isHovered
                              ? "border-accent bg-surface-elevated shadow-xl"
                              : src.isPrimary
                              ? "border-accent/40 bg-surface-elevated"
                              : "border-border bg-surface-muted hover:border-accent/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                                <span className="text-xs font-semibold text-text-primary truncate font-mono">
                                  {src.filename}
                                </span>
                              </div>
                              <span className="rounded bg-surface border border-border px-1.5 py-0.5 text-[10px] font-mono font-semibold text-text-secondary">
                                Page {src.page}
                              </span>
                            </div>

                            <p className="text-[11px] text-text-secondary line-clamp-3 leading-relaxed">
                              &quot;{src.snippet}&quot;
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] font-mono">
                            <span className="text-text-muted">{src.docType}</span>
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {src.relevance}% Relevance
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 4. INTERACTIVE QUESTION BUTTONS ("Try NexusAI") */}
            <div className="mt-10 pt-6 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>Try NexusAI:</span>
                </span>
                <span className="text-[11px] text-text-tertiary font-mono hidden sm:inline">
                  Click any question to simulate vector retrieval
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {DEMO_SCENARIOS.map((scenario) => {
                  const isActive = selectedScenario.id === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => handleScenarioSelect(scenario)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? "bg-accent text-white shadow-md scale-[1.03]"
                          : "border border-border bg-surface-muted text-text-secondary hover:border-accent/40 hover:bg-surface-elevated hover:text-text-primary"
                      }`}
                    >
                      <span>💡 &quot;{scenario.pillLabel}&quot;</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 5. SEPARATE SECTION CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 text-center space-y-4"
        >
          <h3 className="text-xl font-bold text-text-primary">
            Ready to talk to your knowledge base?
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-sm font-semibold bg-accent hover:bg-accent-hover text-white shadow-xl w-full sm:w-auto transition-all hover:scale-105"
            >
              <Link href="/chat">
                <span>Open RAG Chat</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-6 text-sm font-semibold border-border bg-surface hover:bg-surface-elevated text-text-primary w-full sm:w-auto"
            >
              <Link href="/documents">
                <span>Upload Documents</span>
              </Link>
            </Button>
          </div>
          <p className="text-xs text-text-tertiary font-mono">
            Connects to your local FAISS vector store with zero data leakage.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
