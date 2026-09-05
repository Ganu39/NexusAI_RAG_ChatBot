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
  Edit3,
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
    <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-accent/30 flex items-center justify-center">
      <Bot className="w-5 h-5 text-accent" />
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
    bgColor: "bg-surface-elevated/90 border-border hover:border-accent/50",
    textColor: "text-text-primary",
    icon: Clock,
  },
  {
    id: "notion-pages",
    title: "Summarize Findings",
    subtitle: "Get instant executive summaries",
    bgColor: "bg-surface-elevated/90 border-border hover:border-accent/50",
    textColor: "text-text-primary",
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
const USER_NAME_STORAGE_KEY = "nexusai_user_display_name";

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

  // Dynamic User Onboarding Name State
  const [userName, setUserName] = useState<string>("");
  const [inputUserName, setInputUserName] = useState<string>("");
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

  const directFileInputRef = useRef<HTMLInputElement>(null);

  // Check & restore user display name on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (savedName && savedName.trim()) {
        setUserName(savedName.trim());
      } else {
        // First-time user: Show "What should we call you?" onboarding modal
        setShowOnboardingModal(true);
      }
    } catch {
      // Storage fallback
    }
  }, []);

  const handleSaveUserName = (overrideName?: string) => {
    const finalName = (overrideName || inputUserName).trim();
    if (!finalName) return;
    setUserName(finalName);
    setShowOnboardingModal(false);
    try {
      localStorage.setItem(USER_NAME_STORAGE_KEY, finalName);
    } catch {
      // Storage fallback
    }
  };

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
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden relative font-sans text-text-primary">
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
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* 1. COMPACT TOP HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-surface/90 backdrop-blur-2xl px-6 py-3.5 gap-4 z-20 shadow-sm">
        <div className="flex items-center gap-3.5">
          <NexusBotAvatarCanvas size="sm" isProcessing={loading} />

          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-text-primary text-base sm:text-lg tracking-tight font-mono">
              Nexus_Bot
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500 border border-emerald-500/20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
            <span className="hidden sm:inline text-xs text-text-tertiary font-mono">
              MODEL: <strong className="text-accent">Gemini 2.5 Flash</strong> • INDEX: <strong className="text-accent">FAISS 3072d</strong>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="flex items-center gap-2 min-h-[40px] px-4 rounded-full border border-border bg-surface-elevated text-text-primary text-xs font-semibold hover:border-accent/40 active:scale-95 transition-all shadow-sm"
          >
            <Database className="w-4 h-4 text-accent" />
            <span>Knowledge Base</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated/90 px-3.5 py-1.5 text-xs text-text-secondary backdrop-blur-md shadow-sm">
            <Sliders className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] text-text-tertiary font-mono">Top-K:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-transparent font-bold text-accent focus:outline-none cursor-pointer text-xs"
            >
              {[1, 2, 3, 4, 5, 7, 10].map((k) => (
                <option key={k} value={k} className="bg-surface text-text-primary">
                  k = {k}
                </option>
              ))}
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 min-h-[40px] rounded-full border border-destructive/30 bg-destructive-subtle px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-all shadow-sm"
              title="Clear conversation history"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PIPELINE STEPPER BADGE */}
      <div className="border-b border-border-subtle bg-surface-muted/70 px-6 py-2 overflow-x-auto z-20 backdrop-blur-md">
        <div className="flex items-center justify-between min-w-[580px] text-[11px] font-mono text-text-tertiary">
          {RAG_RETRIEVAL_STEPS.map((step, idx) => {
            const isCurrent = activePipelineStage === idx;
            const isPassed = activePipelineStage > idx;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? "text-accent font-bold drop-shadow-sm"
                      : isPassed
                      ? "text-emerald-500 font-semibold"
                      : "text-text-inactive"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCurrent
                        ? "bg-accent animate-ping"
                        : isPassed
                        ? "bg-emerald-500"
                        : "bg-border"
                    }`}
                  />
                  <span>{step.label}</span>
                </div>
                {idx < RAG_RETRIEVAL_STEPS.length - 1 && (
                  <span className="text-text-inactive">→</span>
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
              <span className="text-xs font-mono uppercase tracking-widest text-accent">
                AI KNOWLEDGE ASSISTANT
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-sans items-center justify-center">
                <span>Welcome back, {userName || "Explorer"} 👋</span>
                <button
                  onClick={() => {
                    setInputUserName(userName);
                    setShowOnboardingModal(true);
                  }}
                  className="ml-2 inline-flex items-center text-xs text-text-tertiary hover:text-accent transition-colors p-1"
                  title="Change your name"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <br />
                <span className="text-text-secondary font-normal text-xl sm:text-2xl">
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
                  className={`rounded-3xl ${topic.bgColor} p-5 text-left transition-all cursor-pointer hover:shadow-md active:scale-[0.98] border space-y-3 group backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between">
                    <topic.icon className="w-6 h-6 text-accent" />
                    <span className="text-text-inactive group-hover:text-accent group-hover:translate-x-1 transition-all">→</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-text-primary text-sm font-mono">{topic.title}</h5>
                    <p className="text-xs text-text-secondary mt-0.5">{topic.subtitle}</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shrink-0 shadow-sm">
                  <Bot className="h-5 w-5 text-accent" />
                </div>
              )}

              <div
                className={`flex max-w-2xl flex-col space-y-2.5 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* User Message Bubble */}
                {msg.sender === "user" ? (
                  <div className="rounded-3xl bg-accent px-6 py-4 text-xs sm:text-sm text-white font-medium shadow-md leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  /* Assistant Glass Card */
                  <div className="w-full rounded-3xl border border-border bg-surface/90 backdrop-blur-2xl p-6 text-xs sm:text-sm text-text-primary space-y-4 shadow-sm">
                    {/* Grounding Status Header */}
                    {msg.response && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-border-subtle">
                        <div className="flex items-center gap-2">
                          {msg.response.grounded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              Grounded Answer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              Insufficient Context
                            </span>
                          )}
                          <span className="text-xs text-text-tertiary font-mono">
                            ({msg.response.retrieved_chunks} context chunks)
                          </span>
                        </div>

                        {msg.response.sources.length > 0 && (
                          <button
                            onClick={() => toggleSources(msg.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline transition-colors"
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
                    <div className="leading-relaxed text-text-primary text-sm sm:text-base font-sans font-normal p-1">
                      <ReactMarkdown
                        components={{
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-5 my-3 space-y-2 text-text-secondary" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-5 my-3 space-y-2 text-text-secondary" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed text-text-secondary" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-3.5 leading-relaxed text-text-secondary font-sans" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-bold text-text-primary" {...props} />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 className="text-lg font-bold text-text-primary mt-4 mb-2 tracking-wide font-mono border-b border-border-subtle pb-1" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-base font-bold text-text-primary mt-4 mb-2 tracking-wide font-mono border-b border-border-subtle pb-1" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-sm font-bold text-text-primary mt-3 mb-1.5 tracking-wide font-mono uppercase" {...props} />
                          ),
                          code: ({ node, ...props }) => (
                            <code className="bg-surface-elevated text-accent px-2 py-0.5 rounded-md border border-border font-mono text-xs shadow-inner" {...props} />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {/* Connected Sources Attribution Grid */}
                    {msg.response && expandedSources[msg.id] && msg.response.sources.length > 0 && (
                      <div className="pt-3 border-t border-border-subtle space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="h-3.5 w-3.5 text-accent" />
                            <span>Connected Source Citations:</span>
                          </div>
                          <span className="text-text-inactive text-[10px]">Click to view snippet</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {msg.response.sources.map((src: AskSource, sIdx: number) => (
                            <div
                              key={src.chunk_id || sIdx}
                              onClick={() => setActiveSourceModal(src)}
                              className="rounded-2xl border border-border bg-surface-elevated/80 p-3.5 space-y-2 text-text-secondary hover:border-accent/60 hover:bg-surface-elevated transition-all cursor-pointer group shadow-sm"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <div className="flex items-center gap-2 text-accent truncate max-w-[260px] sm:max-w-md">
                                  <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                                  <span className="truncate text-xs font-mono group-hover:text-text-primary transition-colors">{src.filename}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="rounded-full bg-accent/10 px-3 py-0.5 text-[10px] font-mono font-bold text-accent border border-accent/20">
                                    {(src.score * 100).toFixed(1)}% Match
                                  </span>
                                  <Eye className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reaction Feedback Pills */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                      <button
                        onClick={() => handleFeedback(msg.id, "great")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          msg.feedback === "great"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500 font-bold"
                            : "bg-surface-elevated border-border text-text-secondary hover:bg-surface"
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Great 🥳</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, "bad")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          msg.feedback === "bad"
                            ? "bg-destructive-subtle border-destructive/40 text-destructive font-bold"
                            : "bg-surface-elevated border-border text-text-secondary hover:bg-surface"
                        }`}
                      >
                        <Frown className="w-3.5 h-3.5 text-destructive" />
                        <span>Bad 😢</span>
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-text-tertiary font-mono px-2">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-elevated text-accent shrink-0 border border-border shadow-sm font-mono text-xs font-bold">
                  {userName ? userName.slice(0, 2).toUpperCase() : "US"}
                </div>
              )}
            </div>
          ))
        )}

        {/* Dynamic Loading State */}
        {(loading || uploading) && (
          <div className="flex gap-4 items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shrink-0 animate-pulse">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <div className="rounded-3xl border border-accent/30 bg-surface/90 px-6 py-4 text-xs text-text-secondary flex items-center gap-3 shadow-md backdrop-blur-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <div>
                <p className="font-semibold text-text-primary font-mono text-sm">
                  {uploading
                    ? "Uploading & Vectorizing Document into FAISS..."
                    : activePipelineStage <= 2
                    ? "Searching vector database..."
                    : "Synthesizing answer with grounded citations..."}
                </p>
                <p className="text-[11px] text-text-tertiary font-mono mt-0.5">
                  Nexus_Bot processing embeddings & metrics
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="rounded-3xl border border-destructive/30 bg-destructive-subtle p-5 text-xs text-destructive flex items-center justify-between gap-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Query Execution Error</p>
                <p className="text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              className="rounded-full border border-destructive/40 bg-destructive/10 px-5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-all"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 4. FLOATING DARK PILL INPUT BAR */}
      <div className="p-6 pb-8 z-20 flex justify-center w-full">
        <div className="max-w-2xl w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 rounded-full border border-border bg-surface-elevated/95 backdrop-blur-2xl p-2 pl-4 shadow-lg"
          >
            <button
              type="button"
              onClick={() => directFileInputRef.current?.click()}
              disabled={uploading || loading}
              className="h-10 w-10 flex items-center justify-center rounded-full text-text-tertiary hover:text-accent hover:bg-accent/10 active:scale-95 transition-all shrink-0 border border-transparent hover:border-accent/30"
              title="Attach & Upload Document (PDF, TXT, DOCX)"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
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
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-text-primary placeholder:text-text-inactive focus:outline-none disabled:opacity-50 font-sans"
            />

            <button
              type="submit"
              disabled={!question.trim() || loading || uploading}
              className="h-11 px-6 flex items-center justify-center gap-2 rounded-full bg-accent text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-50 shrink-0"
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

      {/* 5. UNIVERSAL KNOWLEDGE BASE MODAL */}
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

      {/* 6. FIRST-TIME USER ONBOARDING NAME POPUP MODAL */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 shadow-2xl space-y-6 text-center relative overflow-hidden">
            {/* Glow Halo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

            {/* Mascot Avatar */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <NexusBotAvatarCanvas size="lg" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-accent">
                Welcome to NexusAI 🧠⚡
              </span>
              <h3 className="text-2xl font-extrabold text-text-primary tracking-tight font-sans">
                What should we call you?
              </h3>
              <p className="text-xs text-text-secondary">
                Nexus_Bot will use this name to personalize your workspace identity & greetings.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveUserName();
              }}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  type="text"
                  value={inputUserName}
                  onChange={(e) => setInputUserName(e.target.value)}
                  placeholder="Enter your name (e.g. Ganu, Alex)..."
                  autoFocus
                  className="w-full rounded-full border border-border bg-surface-elevated px-5 py-3 text-sm text-text-primary placeholder:text-text-inactive focus:border-accent focus:outline-none font-sans text-center shadow-inner"
                />
              </div>

              <div className="flex items-center gap-3">
                {userName && (
                  <button
                    type="button"
                    onClick={() => setShowOnboardingModal(false)}
                    className="w-1/3 min-h-[46px] rounded-full border border-border bg-surface-muted text-xs font-bold text-text-secondary hover:bg-surface-elevated transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!inputUserName.trim()}
                  className="flex-1 min-h-[46px] rounded-full bg-accent font-bold text-sm text-white hover:bg-accent-hover active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  Get Started 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SOURCE SNIPPET VIEWER MODAL */}
      {activeSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-base font-mono">{activeSourceModal.filename}</h4>
                  <p className="text-xs font-mono text-text-tertiary">
                    Chunk ID: {activeSourceModal.chunk_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSourceModal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-1.5 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-surface-elevated border border-border px-3.5 py-1 text-text-secondary font-mono">
                {activeSourceModal.page_number ? `Page ${activeSourceModal.page_number}` : "Full Document"}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 font-bold text-emerald-500 font-mono">
                {(activeSourceModal.score * 100).toFixed(1)}% Match
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                Vector Chunk Text Snippet:
              </span>
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-4 text-xs sm:text-sm font-mono text-text-secondary leading-relaxed whitespace-pre-wrap">
                {activeSourceModal.text_snippet || "Text snippet preserved in vector metadata."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSourceModal(null)}
                className="min-h-[44px] rounded-full bg-accent px-6 py-2 text-xs font-bold text-white hover:bg-accent-hover transition-colors shadow-md"
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
