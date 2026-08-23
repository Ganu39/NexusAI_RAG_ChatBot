"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Trash2,
  Eye,
  Database,
  Paperclip,
  Cpu,
  Layers,
  Activity,
  Zap,
} from "lucide-react";
import { AskResponse, AskSource } from "@/types";
import { apiClient } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import ReasoningDrawer from "@/components/chat/ReasoningDrawer";
import MobileKnowledgeSheet from "@/components/chat/MobileKnowledgeSheet";

// Dynamic 3D WebGL Canvases
const GlowingAIOrbCanvas = dynamic(() => import("@/components/3d/GlowingAIOrb"), {
  ssr: false,
  loading: () => (
    <div className="w-16 h-16 rounded-full bg-cyan-500/20 blur-md animate-pulse flex items-center justify-center border border-white/20">
      <Bot className="w-8 h-8 text-cyan-400" />
    </div>
  ),
});

const VectorParticleCloudCanvas = dynamic(() => import("@/components/3d/VectorParticleCloud"), {
  ssr: false,
});

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  response?: AskResponse;
  timestamp: string;
}

const RAG_RETRIEVAL_STEPS = [
  { id: "query", label: "Query Ingest" },
  { id: "search", label: "Vector Search" },
  { id: "chunks", label: "Top-K Chunks" },
  { id: "context", label: "Isolated Context" },
  { id: "gemini", label: "Gemini 2.5 Flash" },
  { id: "answer", label: "Citations Ready" },
];

const SUGGESTED_QUESTIONS = [
  "What are the main requirements?",
  "Summarize the key findings",
  "What does this document explain?",
  "Where is this information mentioned?",
];

const SESSION_STORAGE_KEY = "nexusai_rag_chat_messages";

export function RAGChat() {
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [activePipelineStage, setActivePipelineStage] = useState<number>(-1);
  const [activeSourceModal, setActiveSourceModal] = useState<AskSource | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Restore session chat messages from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          const expanded: Record<string, boolean> = {};
          parsed.forEach((m) => {
            if (m.sender === "assistant") expanded[m.id] = true;
          });
          setExpandedSources(expanded);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save session chat messages to sessionStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm("Clear active conversation history?")) {
      setMessages([]);
      setExpandedSources({});
      setError(null);
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  };

  const handleSend = async (customQuestion?: string) => {
    const queryText = (customQuestion || question).trim();
    if (!queryText || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError(null);
    setActivePipelineStage(0);

    const stageTimer1 = setTimeout(() => setActivePipelineStage(1), 300);
    const stageTimer2 = setTimeout(() => setActivePipelineStage(2), 650);
    const stageTimer3 = setTimeout(() => setActivePipelineStage(3), 1000);
    const stageTimer4 = setTimeout(() => setActivePipelineStage(4), 1400);

    const assistantMsgId = `assistant-${Date.now()}`;
    const timestampStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      let isFirstMetadata = true;
      await apiClient.askQuestionStream(
        queryText,
        topK,
        (sources, grounded, retrieved_chunks) => {
          if (isFirstMetadata) {
            isFirstMetadata = false;
            setActivePipelineStage(5);
            const initialMsg: ChatMessage = {
              id: assistantMsgId,
              sender: "assistant",
              text: "",
              response: {
                question: queryText,
                answer: "",
                sources,
                retrieved_chunks,
                grounded,
              },
              timestamp: timestampStr,
            };
            setMessages((prev) => [...prev, initialMsg]);
            setExpandedSources((prev) => ({ ...prev, [assistantMsgId]: true }));
          }
        },
        (token) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === assistantMsgId) {
                const newText = msg.text + token;
                return {
                  ...msg,
                  text: newText,
                  response: msg.response
                    ? { ...msg.response, answer: newText }
                    : undefined,
                };
              }
              return msg;
            })
          );
        }
      );
    } catch {
      try {
        const askRes = await apiClient.askQuestion(queryText, topK);
        setActivePipelineStage(5);
        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          sender: "assistant",
          text: askRes.answer,
          response: askRes,
          timestamp: timestampStr,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setExpandedSources((prev) => ({ ...prev, [assistantMsgId]: true }));
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to connect to NexusAI RAG engine.";
        setError(msg);
      }
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setLoading(false);
      setTimeout(() => setActivePipelineStage(-1), 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0d1321] overflow-hidden relative font-sans text-slate-100">
      {/* 3D WebGL Background Constellation */}
      <VectorParticleCloudCanvas />

      {/* VisionOS Ambient Light Halos */}
      <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* 1. VISIONOS FLOATING HEADER BADGE */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1321]/60 backdrop-blur-3xl px-8 py-4 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative flex items-center justify-center overflow-visible shrink-0 rounded-full bg-cyan-500/10 border border-white/20 shadow-[0_0_25px_rgba(34,211,238,0.25)]">
            <GlowingAIOrbCanvas isProcessing={loading} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-white text-base sm:text-lg tracking-tight font-sans">
                Spatial Knowledge Studio
              </h3>
              <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300 border border-cyan-400/30 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Neural Net v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Apple VisionOS Spatial Computing Architecture • Real-time Grounded RAG
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="md:hidden flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-white/20 bg-white/5 text-cyan-300 text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Knowledge Base</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/60 px-4 py-2 text-xs text-slate-300 backdrop-blur-xl shadow-lg">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-mono">Top-K:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-transparent font-bold text-cyan-300 focus:outline-none cursor-pointer text-xs"
            >
              {[1, 2, 3, 4, 5, 7, 10].map((k) => (
                <option key={k} value={k} className="bg-slate-900 text-white">
                  k = {k}
                </option>
              ))}
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 min-h-[44px] rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all backdrop-blur-md"
              title="Clear conversation history"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PIPELINE STEPPER BADGE */}
      <div className="border-b border-white/5 bg-slate-950/40 px-8 py-2.5 overflow-x-auto z-20 backdrop-blur-xl">
        <div className="flex items-center justify-between min-w-[580px] text-[11px] font-mono text-slate-400">
          {RAG_RETRIEVAL_STEPS.map((step, idx) => {
            const isCurrent = activePipelineStage === idx;
            const isPassed = activePipelineStage > idx;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? "text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                      : isPassed
                      ? "text-emerald-400 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCurrent
                        ? "bg-cyan-400 animate-ping"
                        : isPassed
                        ? "bg-emerald-400"
                        : "bg-slate-700"
                    }`}
                  />
                  <span>{step.label}</span>
                </div>
                {idx < RAG_RETRIEVAL_STEPS.length - 1 && (
                  <span className="text-slate-700">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. MESSAGES SCROLL AREA (VISIONOS FROSTED GLASS CARDS) */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 z-20 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-6">
            {/* 3D WebGL Glowing Mascot Orb */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <GlowingAIOrbCanvas isProcessing={loading} />
            </div>

            <div className="max-w-lg space-y-2">
              <h4 className="text-2xl font-bold text-white tracking-tight font-sans">
                Ask Questions Grounded in Your Documents
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                NexusAI retrieves semantic vector chunks from your document repository and synthesizes grounded answers using Gemini 2.5 Flash with verified source citations.
              </p>
            </div>

            {/* Suggested Question Glass Pills */}
            <div className="w-full max-w-xl space-y-3 pt-2">
              <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest font-semibold text-center">
                SUGGESTED QUESTIONS:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQuestion(q);
                      handleSend(q);
                    }}
                    className="min-h-[56px] rounded-3xl border border-white/15 bg-slate-900/40 backdrop-blur-3xl p-4 text-left text-slate-200 hover:border-cyan-400/60 hover:bg-slate-900/70 hover:text-white active:scale-[0.98] transition-all shadow-2xl flex items-center justify-between group"
                  >
                    <span className="font-medium text-sm">💡 &quot;{q}&quot;</span>
                    <span className="text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 border border-white/20 shrink-0 shadow-lg backdrop-blur-md">
                  <Bot className="h-5 w-5" />
                </div>
              )}

              <div
                className={`flex max-w-3xl flex-col space-y-2.5 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* User Bubble */}
                {msg.sender === "user" ? (
                  <div className="rounded-3xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-4 text-xs sm:text-sm text-slate-950 font-bold shadow-[0_10px_30px_rgba(34,211,238,0.3)] leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  /* VisionOS Frosted Glass Card */
                  <div className="w-full rounded-3xl border border-white/15 bg-slate-900/40 backdrop-blur-3xl p-6 text-xs sm:text-sm text-slate-100 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {/* Header Grounding Status */}
                    {msg.response && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          {msg.response.grounded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30 shadow-sm">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Grounded Answer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30 shadow-sm">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Insufficient Context
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono">
                            ({msg.response.retrieved_chunks} context chunks)
                          </span>
                        </div>

                        {msg.response.sources.length > 0 && (
                          <button
                            onClick={() => toggleSources(msg.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-white transition-colors rounded-full px-3 py-1 bg-cyan-500/10 border border-cyan-400/20"
                          >
                            <span>
                              {expandedSources[msg.id]
                                ? "Hide Citations"
                                : `View ${msg.response.sources.length} Sources & Citations`}
                            </span>
                            {expandedSources[msg.id] ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reasoning Drawer Component */}
                    <ReasoningDrawer />

                    {/* Answer Body */}
                    <div className="leading-relaxed text-slate-100 whitespace-pre-wrap text-sm sm:text-base font-sans">
                      {msg.text}
                    </div>

                    {/* Sources Attribution Grid */}
                    {msg.response && expandedSources[msg.id] && msg.response.sources.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Connected Source Citations:</span>
                          </div>
                          <span className="text-slate-500 text-[10px]">Click source to inspect snippet</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {msg.response.sources.map((src: AskSource, sIdx: number) => (
                            <div
                              key={src.chunk_id || sIdx}
                              onClick={() => setActiveSourceModal(src)}
                              className="rounded-2xl border border-white/15 bg-slate-950/60 p-4 space-y-2 text-slate-300 hover:border-cyan-400/60 hover:bg-slate-900/80 transition-all cursor-pointer group shadow-lg backdrop-blur-xl"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <div className="flex items-center gap-2 text-cyan-300 truncate max-w-[260px] sm:max-w-md">
                                  <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate text-xs font-mono group-hover:text-white transition-colors">{src.filename}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-400/30">
                                    {(src.score * 100).toFixed(1)}% Match
                                  </span>
                                  <Eye className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-slate-500 font-mono px-2">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 shrink-0 border border-white/15 shadow-md">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Dynamic Loading State */}
        {loading && (
          <div className="flex gap-4 items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 border border-white/20 shrink-0 animate-pulse">
              <Bot className="h-5 w-5" />
            </div>
            <div className="rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-3xl px-6 py-4 text-xs text-slate-200 flex items-center gap-3 shadow-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <div>
                <p className="font-semibold text-white font-mono text-sm">
                  {activePipelineStage <= 2
                    ? "Searching vector database..."
                    : "Synthesizing answer with grounded citations..."}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Filtering chunks & calculating vector similarity metrics
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold text-rose-200">Query Execution Error</p>
                <p className="text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              className="rounded-full border border-rose-500/40 bg-rose-600/20 px-5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-600/30 active:scale-95 transition-all"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 4. VISIONOS FLOATING CENTERED PROMPT PILL BAR */}
      <div className="p-6 pb-8 z-20 flex justify-center w-full">
        <div className="max-w-3xl w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 rounded-full border border-white/20 bg-slate-900/60 backdrop-blur-3xl p-2.5 pl-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all shrink-0"
              title="Attach Document"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question grounded in your knowledge base..."
              disabled={loading}
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 font-sans"
            />

            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="h-11 px-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>

      {/* 5. MOBILE KNOWLEDGE BASE BOTTOM SHEET */}
      <MobileKnowledgeSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
      />

      {/* 6. SOURCE SNIPPET VIEWER MODAL */}
      {activeSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-slate-900/90 backdrop-blur-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base font-mono">{activeSourceModal.filename}</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Chunk ID: {activeSourceModal.chunk_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSourceModal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-xl bg-slate-800 border border-white/10 px-3 py-1 text-slate-300 font-mono">
                {activeSourceModal.page_number ? `Page ${activeSourceModal.page_number}` : "Full Document"}
              </span>
              <span className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 font-bold text-emerald-300 font-mono">
                {(activeSourceModal.score * 100).toFixed(1)}% Similarity
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Vector Chunk Text Snippet:
              </span>
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs sm:text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activeSourceModal.text_snippet || "Text snippet preserved in vector metadata."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSourceModal(null)}
                className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-2 text-xs font-bold text-slate-950 hover:brightness-110 transition-all"
              >
                Close Snippet Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RAGChat;
