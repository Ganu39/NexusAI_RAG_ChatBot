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
  Plus,
  Mic,
  Smile,
  Frown,
  ArrowRight,
  HelpCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { AskResponse, AskSource } from "@/types";
import { apiClient } from "@/lib/api";
import ReasoningDrawer from "@/components/chat/ReasoningDrawer";
import MobileKnowledgeSheet from "@/components/chat/MobileKnowledgeSheet";

// Dynamic 3D WebGL Canvas
const GlowingAIOrbCanvas = dynamic(() => import("@/components/3d/GlowingAIOrb"), {
  ssr: false,
  loading: () => (
    <div className="w-16 h-16 rounded-full bg-[#635BFF]/20 blur-md animate-pulse flex items-center justify-center border border-[#635BFF]/30">
      <Bot className="w-8 h-8 text-[#635BFF]" />
    </div>
  ),
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
    bgColor: "bg-[#F7E5F0]", // Soft Pink
    textColor: "text-slate-800",
    badgeColor: "bg-pink-100 text-pink-700",
    icon: Clock,
  },
  {
    id: "notion-pages",
    title: "Summarize Findings",
    subtitle: "Get instant executive summaries",
    bgColor: "bg-[#E8E5FA]", // Soft Lavender
    textColor: "text-slate-800",
    badgeColor: "bg-purple-100 text-[#635BFF]",
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
    <div className="flex h-screen w-full flex-col bg-[#FAF6F0] overflow-hidden relative font-sans text-slate-800">
      {/* 1. KOHAKU WARM STUDIO TOP BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/70 bg-white/90 backdrop-blur-xl px-8 py-4 gap-4 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative flex items-center justify-center overflow-visible shrink-0 rounded-2xl bg-[#E8E5FA] border border-purple-200 shadow-sm">
            <GlowingAIOrbCanvas isProcessing={loading} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight font-sans">
                Kohaku Bot
              </h3>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Friendly RAG Assistant • Grounded in Your Indexed Knowledge
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="md:hidden flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-slate-200 bg-white text-[#635BFF] text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all"
          >
            <Database className="w-4 h-4 text-[#635BFF]" />
            <span>Knowledge Base</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm">
            <Sliders className="h-3.5 w-3.5 text-[#635BFF]" />
            <span className="text-[11px] text-slate-400 font-medium">Top-K:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-transparent font-bold text-[#635BFF] focus:outline-none cursor-pointer text-xs"
            >
              {[1, 2, 3, 4, 5, 7, 10].map((k) => (
                <option key={k} value={k} className="bg-white text-slate-800">
                  k = {k}
                </option>
              ))}
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 min-h-[44px] rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-all shadow-sm"
              title="Clear conversation history"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PIPELINE STEPPER BADGE */}
      <div className="border-b border-slate-200/50 bg-white/60 px-8 py-2 overflow-x-auto z-20 backdrop-blur-md">
        <div className="flex items-center justify-between min-w-[580px] text-[11px] font-mono text-slate-500">
          {RAG_RETRIEVAL_STEPS.map((step, idx) => {
            const isCurrent = activePipelineStage === idx;
            const isPassed = activePipelineStage > idx;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? "text-[#635BFF] font-bold"
                      : isPassed
                      ? "text-emerald-600 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCurrent
                        ? "bg-[#635BFF] animate-ping"
                        : isPassed
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  />
                  <span>{step.label}</span>
                </div>
                {idx < RAG_RETRIEVAL_STEPS.length - 1 && (
                  <span className="text-slate-300">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 z-20 max-w-3xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-6">
            {/* Friendly Glossy Mascot Hero */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <GlowingAIOrbCanvas isProcessing={loading} />
              <div className="absolute top-2 -right-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-md border border-slate-100 animate-bounce">
                Hey Tam 👋
              </div>
            </div>

            <div className="max-w-md space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
                Welcome Back
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                How may I help you today
              </h4>
            </div>

            {/* Pastel Topic Cards */}
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => {
                    setQuestion(topic.title);
                    handleSend(topic.title);
                  }}
                  className={`rounded-3xl ${topic.bgColor} p-5 text-left transition-all cursor-pointer hover:shadow-lg active:scale-[0.98] border border-white/60 space-y-3 group`}
                >
                  <div className="flex items-center justify-between">
                    <topic.icon className="w-6 h-6 text-[#635BFF]" />
                    <span className="text-slate-400 group-hover:text-[#635BFF] group-hover:translate-x-1 transition-all">→</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{topic.title}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{topic.subtitle}</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8E5FA] text-[#635BFF] border border-purple-200 shrink-0 shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
              )}

              <div
                className={`flex max-w-2xl flex-col space-y-2.5 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* User Message Bubble */}
                {msg.sender === "user" ? (
                  <div className="rounded-3xl bg-[#635BFF] px-6 py-4 text-xs sm:text-sm text-white font-medium shadow-md leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  /* Assistant Response Card */
                  <div className="w-full rounded-3xl bg-white p-6 text-xs sm:text-sm text-slate-800 space-y-4 shadow-md border border-slate-200/60">
                    {/* Grounding Status Header */}
                    {msg.response && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          {msg.response.grounded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              Grounded Answer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
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
                            className="flex items-center gap-1 text-xs font-semibold text-[#635BFF] hover:underline"
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
                    <div className="leading-relaxed text-slate-800 whitespace-pre-wrap text-sm sm:text-base font-sans">
                      {msg.text}
                    </div>

                    {/* Connected Sources Attribution Grid */}
                    {msg.response && expandedSources[msg.id] && msg.response.sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="h-3.5 w-3.5 text-[#635BFF]" />
                            <span>Connected Source Citations:</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">Click to view snippet</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {msg.response.sources.map((src: AskSource, sIdx: number) => (
                            <div
                              key={src.chunk_id || sIdx}
                              onClick={() => setActiveSourceModal(src)}
                              className="rounded-2xl border border-purple-100 bg-[#FBF9FE] p-3.5 space-y-2 text-slate-700 hover:border-[#635BFF]/50 hover:bg-[#F4F1FD] transition-all cursor-pointer group shadow-sm"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <div className="flex items-center gap-2 text-[#635BFF] truncate max-w-[260px] sm:max-w-md">
                                  <FileText className="h-3.5 w-3.5 text-[#635BFF] shrink-0" />
                                  <span className="truncate text-xs font-mono group-hover:underline">{src.filename}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="rounded-full bg-[#E8E5FA] px-3 py-0.5 text-[10px] font-mono font-bold text-[#635BFF] border border-purple-200">
                                    {(src.score * 100).toFixed(1)}% Match
                                  </span>
                                  <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#635BFF] transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reaction Feedback Pills */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleFeedback(msg.id, "great")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          msg.feedback === "great"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Great 🥳</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, "bad")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          msg.feedback === "bad"
                            ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Frown className="w-3.5 h-3.5 text-rose-500" />
                        <span>Bad 😢</span>
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 font-mono px-2">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shrink-0 border border-slate-200 shadow-sm">
                  <User className="h-5 w-5 text-[#635BFF]" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Dynamic Loading State */}
        {loading && (
          <div className="flex gap-4 items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8E5FA] text-[#635BFF] border border-purple-200 shrink-0 animate-pulse">
              <Bot className="h-5 w-5 text-[#635BFF]" />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-xs text-slate-700 flex items-center gap-3 shadow-md">
              <Loader2 className="h-5 w-5 animate-spin text-[#635BFF]" />
              <div>
                <p className="font-semibold text-slate-900 font-sans text-sm">
                  {activePipelineStage <= 2
                    ? "Searching vector database..."
                    : "Synthesizing answer with grounded citations..."}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Calculating vector similarity metrics
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-700 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-semibold text-rose-900">Query Execution Error</p>
                <p className="text-rose-700/80 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              className="rounded-full border border-rose-300 bg-white px-5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 4. FLOATING WHITE PILL INPUT BAR */}
      <div className="p-6 pb-8 z-20 flex justify-center w-full">
        <div className="max-w-2xl w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white p-2 pl-4 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
              title="Attach Document"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={loading}
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 font-sans"
            />

            <button
              type="button"
              className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="h-11 px-6 flex items-center justify-center gap-2 rounded-full bg-[#635BFF] text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:bg-[#5249E6] active:scale-95 disabled:opacity-50 shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8E5FA] text-[#635BFF] border border-purple-200">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base font-mono">{activeSourceModal.filename}</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Chunk ID: {activeSourceModal.chunk_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSourceModal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-slate-700 font-mono">
                {activeSourceModal.page_number ? `Page ${activeSourceModal.page_number}` : "Full Document"}
              </span>
              <span className="rounded-full bg-[#E8E5FA] border border-purple-200 px-3.5 py-1 font-bold text-[#635BFF] font-mono">
                {(activeSourceModal.score * 100).toFixed(1)}% Match
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Vector Chunk Text Snippet:
              </span>
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
                {activeSourceModal.text_snippet || "Text snippet preserved in vector metadata."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSourceModal(null)}
                className="min-h-[44px] rounded-full bg-[#635BFF] px-6 py-2 text-xs font-bold text-white hover:bg-[#5249E6] transition-colors shadow-sm"
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
