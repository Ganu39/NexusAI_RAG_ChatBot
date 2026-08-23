"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Plus,
  Smile,
  Frown,
  ArrowRight,
  Clock,
  BookOpen,
  Cpu,
} from "lucide-react";
import { AskResponse, AskSource } from "@/types";
import { apiClient } from "@/lib/api";
import ReasoningDrawer from "@/components/chat/ReasoningDrawer";
import MobileKnowledgeSheet from "@/components/chat/MobileKnowledgeSheet";
import ReactMarkdown from "react-markdown";

// Dynamic 3D Nexus_Bot Mascot Component
const NexusBotAvatarCanvas = dynamic(() => import("@/components/3d/GlowingAIOrb"), {
  ssr: false,
  loading: () => (
    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center">
      <Bot className="w-5 h-5 text-cyan-400" />
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
  feedback?: "great" | "bad";
}

const SUGGESTED_TOPICS = [
  {
    id: "time-tracking",
    title: "Document Requirements",
    subtitle: "Explore key specs & rules",
    bgColor: "bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400",
    textColor: "text-slate-100",
    icon: Clock,
  },
  {
    id: "notion-pages",
    title: "Summarize Findings",
    subtitle: "Get instant executive summaries",
    bgColor: "bg-slate-900/80 border-violet-500/30 hover:border-violet-400",
    textColor: "text-slate-100",
    icon: BookOpen,
  },
];

const RAG_RETRIEVAL_STEPS = [
  { id: "query", label: "Query Ingest" },
  { id: "search", label: "Vector Search" },
  { id: "chunks", label: "Top-K Chunks" },
  { id: "context", label: "Isolated Context" },
  { id: "gemini", label: "Gemini 2.5 Flash" },
  { id: "answer", label: "Citations Ready" },
];

const SESSION_STORAGE_KEY = "nexusai_rag_chat_messages";

export function RAGChat() {
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [activePipelineStage, setActivePipelineStage] = useState<number>(-1);
  const [activeSourceModal, setActiveSourceModal] = useState<AskSource | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFeedback = (msgId: string, type: "great" | "bad") => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === msgId ? { ...msg, feedback: type } : msg))
    );
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

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const timestampStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      await apiClient.uploadDocument(file);
      const systemNotice: ChatMessage = {
        id: `assistant-upload-${Date.now()}`,
        sender: "assistant",
        text: `📄 Successfully uploaded and indexed **${file.name}** into your FAISS vector database! You can now ask questions grounded in this document.`,
        timestamp: timestampStr,
      };
      setMessages((prev) => [...prev, systemNotice]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      setError(msg);
    } finally {
      setUploading(false);
      if (directFileInputRef.current) {
        directFileInputRef.current.value = "";
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
    <div className="flex h-screen w-full flex-col bg-[#020617] overflow-hidden relative font-sans text-slate-100">
      {/* Hidden Direct File Picker */}
      <input
        type="file"
        ref={directFileInputRef}
        onChange={handleDirectFileUpload}
        accept=".pdf,.txt,.docx,.md"
        className="hidden"
      />

      {/* 3D WebGL Background Constellation */}
      <VectorParticleCloudCanvas />

      {/* Dark Ambient Glow Halos */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* 1. COMPACT TOP HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-[#020617]/90 backdrop-blur-2xl px-6 py-3.5 gap-4 z-20 shadow-xl">
        <div className="flex items-center gap-3.5">
          <NexusBotAvatarCanvas size="sm" isProcessing={loading} />

          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight font-mono">
              Nexus_Bot
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400 border border-cyan-500/30 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Online
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              MODEL: <strong className="text-cyan-400">Gemini 2.5 Flash</strong> • INDEX: <strong className="text-violet-400">FAISS 3072d</strong>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="flex items-center gap-2 min-h-[40px] px-4 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 active:scale-95 transition-all shadow-md"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Knowledge Base</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur-md shadow-md">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-mono">Top-K:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-transparent font-bold text-cyan-400 focus:outline-none cursor-pointer text-xs"
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
              className="flex items-center gap-1.5 min-h-[40px] rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all shadow-md"
              title="Clear conversation history"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PIPELINE STEPPER BADGE */}
      <div className="border-b border-white/5 bg-slate-950/70 px-6 py-2 overflow-x-auto z-20 backdrop-blur-md">
        <div className="flex items-center justify-between min-w-[580px] text-[11px] font-mono text-slate-400">
          {RAG_RETRIEVAL_STEPS.map((step, idx) => {
            const isCurrent = activePipelineStage === idx;
            const isPassed = activePipelineStage > idx;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? "text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
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
                        : "bg-slate-800"
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

      {/* 3. MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 z-20 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-6">
            {/* 3D Robot Mascot (Nexus_Bot) Avatar */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <NexusBotAvatarCanvas size="lg" isProcessing={loading} />
            </div>

            <div className="max-w-md space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                AI KNOWLEDGE ASSISTANT
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                Welcome back, Ganu 👋<br />
                <span className="text-slate-300 font-normal text-xl sm:text-2xl">
                  How may I help you today?
                </span>
              </h4>
            </div>

            {/* Topic Cards */}
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => {
                    setQuestion(topic.title);
                    handleSend(topic.title);
                  }}
                  className={`rounded-3xl ${topic.bgColor} p-5 text-left transition-all cursor-pointer hover:shadow-2xl active:scale-[0.98] border space-y-3 group backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between">
                    <topic.icon className="w-6 h-6 text-cyan-400" />
                    <span className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">→</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm font-mono">{topic.title}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{topic.subtitle}</p>
                  </div>
                </div>
              ))}
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0 shadow-lg">
                  <Bot className="h-5 w-5 text-cyan-400" />
                </div>
              )}

              <div
                className={`flex max-w-2xl flex-col space-y-2.5 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* User Message Bubble */}
                {msg.sender === "user" ? (
                  <div className="rounded-3xl bg-cyan-600 px-6 py-4 text-xs sm:text-sm text-white font-medium shadow-lg shadow-cyan-600/20 leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  /* Assistant Dark Glass Card */
                  <div className="w-full rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 text-xs sm:text-sm text-slate-100 space-y-4 shadow-2xl">
                    {/* Grounding Status Header */}
                    {msg.response && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          {msg.response.grounded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              Grounded Answer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
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
                            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <span>
                              {expandedSources[msg.id]
                                ? "Hide Citations"
                                : `View ${msg.response.sources.length} Sources`}
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
                    <div className="leading-relaxed text-slate-100 text-sm sm:text-base font-sans font-normal prose prose-invert max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Connected Sources Attribution Grid */}
                    {msg.response && expandedSources[msg.id] && msg.response.sources.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Connected Source Citations:</span>
                          </div>
                          <span className="text-slate-500 text-[10px]">Click to view snippet</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {msg.response.sources.map((src: AskSource, sIdx: number) => (
                            <div
                              key={src.chunk_id || sIdx}
                              onClick={() => setActiveSourceModal(src)}
                              className="rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 space-y-2 text-slate-300 hover:border-cyan-400/60 hover:bg-slate-900 transition-all cursor-pointer group shadow-sm"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <div className="flex items-center gap-2 text-cyan-300 truncate max-w-[260px] sm:max-w-md">
                                  <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate text-xs font-mono group-hover:text-white transition-colors">{src.filename}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="rounded-full bg-cyan-500/10 px-3 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-500/20">
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

                    {/* Reaction Feedback Pills */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleFeedback(msg.id, "great")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          msg.feedback === "great"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                            : "bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Great 🥳</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, "bad")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          msg.feedback === "bad"
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold"
                            : "bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <Frown className="w-3.5 h-3.5 text-rose-400" />
                        <span>Bad 😢</span>
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-500 font-mono px-2">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 shrink-0 border border-white/10 shadow-md">
                  <User className="h-5 w-5 text-cyan-400" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Dynamic Loading / Uploading State */}
        {(loading || uploading) && (
          <div className="flex gap-4 items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0 animate-pulse">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 px-6 py-4 text-xs text-slate-200 flex items-center gap-3 shadow-xl backdrop-blur-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <div>
                <p className="font-semibold text-white font-mono text-sm">
                  {uploading
                    ? "Uploading & Vectorizing Document into FAISS..."
                    : activePipelineStage <= 2
                    ? "Searching vector database..."
                    : "Synthesizing answer with grounded citations..."}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Nexus_Bot processing document embeddings & metrics
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-md backdrop-blur-md">
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

      {/* 4. FLOATING DARK PILL INPUT BAR WITH REAL DIRECT FILE ATTACHMENT */}
      <div className="p-6 pb-8 z-20 flex justify-center w-full">
        <div className="max-w-2xl w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/90 backdrop-blur-2xl p-2 pl-4 shadow-2xl"
          >
            {/* Real File Upload Attachment Button */}
            <button
              type="button"
              onClick={() => directFileInputRef.current?.click()}
              disabled={uploading || loading}
              className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 active:scale-95 transition-all shrink-0 border border-transparent hover:border-cyan-500/30"
              title="Attach & Upload Document (PDF, TXT, DOCX)"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nexus_Bot anything..."
              disabled={loading || uploading}
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 font-sans"
            />

            <button
              type="submit"
              disabled={!question.trim() || loading || uploading}
              className="h-11 px-6 flex items-center justify-center gap-2 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 active:scale-95 disabled:opacity-50 shrink-0"
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

      {/* 5. UNIVERSAL KNOWLEDGE BASE MODAL (DESKTOP + MOBILE) */}
      <MobileKnowledgeSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        onUploadSuccess={(filename) => {
          const timestampStr = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const systemNotice: ChatMessage = {
            id: `assistant-upload-${Date.now()}`,
            sender: "assistant",
            text: `📄 Successfully uploaded and indexed **${filename}** into your FAISS vector database! You can now ask questions grounded in this document.`,
            timestamp: timestampStr,
          };
          setMessages((prev) => [...prev, systemNotice]);
        }}
      />

      {/* 6. SOURCE SNIPPET VIEWER MODAL */}
      {activeSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
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
              <span className="rounded-full bg-slate-800 border border-white/10 px-3.5 py-1 text-slate-300 font-mono">
                {activeSourceModal.page_number ? `Page ${activeSourceModal.page_number}` : "Full Document"}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 font-bold text-emerald-400 font-mono">
                {(activeSourceModal.score * 100).toFixed(1)}% Match
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
                className="min-h-[44px] rounded-full bg-cyan-500 px-6 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md"
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
