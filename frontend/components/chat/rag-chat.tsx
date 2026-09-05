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
  Copy,
  Check,
  Download,
  Pencil,
  X,
  RefreshCw,
} from "lucide-react";
import { AskResponse, AskSource, IngestedDocumentSummary, IndexingResponse } from "@/types";
import { apiClient } from "@/lib/api";
import { generateChatPdf } from "@/lib/pdf-generator";
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
  uploadedDoc?: IngestedDocumentSummary;
  indexingStatus?: "idle" | "indexing" | "indexed" | "failed";
  indexingError?: string;
  indexingResult?: IndexingResponse;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  // Copy Previous User Query State
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [activeUserMessageId, setActiveUserMessageId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyQuery = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQueryId(id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedQueryId(null);
      }, 1500);
    } catch {
      // Safe fallback for older browsers or restricted permissions
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopiedQueryId(id);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedQueryId(null);
        }, 1500);
      } catch {
        // Safe fail without crashing
      }
    }
  };

  // Edit & Delete User Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editingMessageId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const len = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(len, len);
    }
  }, [editingMessageId]);

  const handleStartEdit = (msg: ChatMessage) => {
    if (loading) return;
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
    setDeletingMessageId(null);
    setActiveUserMessageId(msg.id);
  };

  const handleSaveEdit = async (userMsgId: string) => {
    if (loading) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;

    const uIdx = messages.findIndex((m) => m.id === userMsgId);
    if (uIdx === -1) return;

    const oldUserMsg = messages[uIdx];
    if (oldUserMsg.text === trimmed) {
      setEditingMessageId(null);
      setEditingText("");
      return;
    }

    const nextMsg = messages[uIdx + 1];
    const targetAssistantId =
      nextMsg && nextMsg.sender === "assistant"
        ? nextMsg.id
        : `assistant-${Date.now()}`;

    const timestampStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Update selected user message and prepare its corresponding assistant response
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === userMsgId);
      if (idx === -1) return prev;
      const nextList = [...prev];
      nextList[idx] = { ...nextList[idx], text: trimmed };

      if (idx + 1 < nextList.length && nextList[idx + 1].sender === "assistant") {
        nextList[idx + 1] = {
          id: targetAssistantId,
          sender: "assistant",
          text: "",
          response: undefined,
          timestamp: timestampStr,
        };
      } else {
        nextList.splice(idx + 1, 0, {
          id: targetAssistantId,
          sender: "assistant",
          text: "",
          response: undefined,
          timestamp: timestampStr,
        });
      }
      return nextList;
    });

    setEditingMessageId(null);
    setEditingText("");
    setLoading(true);
    setRegeneratingMessageId(targetAssistantId);
    setError(null);
    setActivePipelineStage(0);

    const stageTimer1 = setTimeout(() => setActivePipelineStage(1), 300);
    const stageTimer2 = setTimeout(() => setActivePipelineStage(2), 650);
    const stageTimer3 = setTimeout(() => setActivePipelineStage(3), 1000);
    const stageTimer4 = setTimeout(() => setActivePipelineStage(4), 1400);

    try {
      let isFirstMetadata = true;
      await apiClient.askQuestionStream(
        trimmed,
        topK,
        (sources, grounded, retrieved_chunks) => {
          if (isFirstMetadata) {
            isFirstMetadata = false;
            setActivePipelineStage(5);
            setExpandedSources((prev) => ({
              ...prev,
              [targetAssistantId]: true,
            }));
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === targetAssistantId) {
                  return {
                    ...msg,
                    text: "",
                    response: {
                      question: trimmed,
                      answer: "",
                      sources,
                      retrieved_chunks,
                      grounded,
                    },
                    timestamp: timestampStr,
                  };
                }
                return msg;
              })
            );
          }
        },
        (token) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === targetAssistantId) {
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
        const askRes = await apiClient.askQuestion(trimmed, topK);
        setActivePipelineStage(5);
        setExpandedSources((prev) => ({
          ...prev,
          [targetAssistantId]: true,
        }));
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === targetAssistantId) {
              return {
                ...msg,
                text: askRes.answer,
                response: askRes,
                timestamp: timestampStr,
              };
            }
            return msg;
          })
        );
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
      setRegeneratingMessageId(null);
      setTimeout(() => setActivePipelineStage(-1), 2500);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleStartDelete = (id: string) => {
    if (loading) return;
    setDeletingMessageId(id);
    if (editingMessageId === id) {
      setEditingMessageId(null);
      setEditingText("");
    }
    setActiveUserMessageId(id);
  };

  const handleCancelDelete = () => {
    setDeletingMessageId(null);
  };

  const handleDeleteMessage = (id: string) => {
    if (loading) return;
    const uIdx = messages.findIndex((m) => m.id === id);
    if (uIdx === -1) return;

    // Delete selected user query, its corresponding assistant answer, and every message below it
    const updated = messages.slice(0, uIdx);
    setMessages(updated);
    setDeletingMessageId(null);
    if (editingMessageId) {
      setEditingMessageId(null);
      setEditingText("");
    }
    if (copiedQueryId) setCopiedQueryId(null);
    if (activeUserMessageId) setActiveUserMessageId(null);
  };

  // PDF Export State & Handler
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadPdf = () => {
    if (messages.length === 0 || loading) return;
    try {
      setIsExportingPdf(true);
      setExportError(null);
      const success = generateChatPdf({
        messages,
        userName,
        metadata: {
          modelName: "Gemini 2.5 Flash",
          indexInfo: "FAISS 3072d",
          topK,
        },
      });
      if (success) {
        setExportSuccessNotice(true);
        setTimeout(() => setExportSuccessNotice(false), 2000);
      } else {
        setExportError("Failed to generate PDF document.");
        setTimeout(() => setExportError(null), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error exporting PDF.";
      setExportError(msg);
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setIsExportingPdf(false);
    }
  };

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
      setEditingMessageId(null);
      setEditingText("");
      setDeletingMessageId(null);
      setRegeneratingMessageId(null);
      setCopiedQueryId(null);
      setActiveUserMessageId(null);
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  };

  const handleIndexDocument = async (messageId: string, documentId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, indexingStatus: "indexing", indexingError: undefined }
          : msg
      )
    );

    try {
      const res = await apiClient.indexDocument(documentId);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const updatedDoc: IngestedDocumentSummary | undefined = msg.uploadedDoc
            ? {
                ...msg.uploadedDoc,
                is_indexed: true,
                chunks_created: res.chunks_created,
                embeddings_created: res.embeddings_created,
              }
            : undefined;
          return {
            ...msg,
            indexingStatus: "indexed",
            indexingResult: res,
            uploadedDoc: updatedDoc,
            text: `Document **${msg.uploadedDoc?.filename || "document"}** indexed successfully (${res.chunks_created} chunks in FAISS). You can now ask questions grounded in this document.`,
          };
        })
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate vector index.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, indexingStatus: "failed", indexingError: msg }
            : m
        )
      );
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
      const uploadRes = await apiClient.uploadDocument(file);
      const doc = uploadRes.document;
      const systemNotice: ChatMessage = {
        id: `assistant-doc-${doc?.document_id || Date.now()}`,
        sender: "assistant",
        text: `Uploaded document: **${doc?.filename || file.name}** (${formatBytes(doc?.file_size || file.size)}).`,
        timestamp: timestampStr,
        uploadedDoc: doc,
        indexingStatus: doc?.is_indexed ? "indexed" : "idle",
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
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
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

          {/* Download Chat PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={messages.length === 0 || loading || isExportingPdf}
            className={`flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              messages.length === 0 || loading || isExportingPdf
                ? "border-border/40 bg-surface-elevated/40 text-text-tertiary/40 cursor-not-allowed opacity-50"
                : exportSuccessNotice
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-bold"
                : "border-border bg-surface-elevated text-text-primary hover:border-accent/40 hover:text-accent hover:bg-surface"
            }`}
            aria-label="Download chat as PDF"
            title={messages.length === 0 ? "No messages to export" : "Download chat as PDF"}
          >
            {exportSuccessNotice ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Downloaded</span>
              </>
            ) : isExportingPdf ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-accent" />
                <span className="hidden sm:inline">Download Chat</span>
              </>
            )}
          </button>

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

      {/* Export Error Banner */}
      {exportError && (
        <div className="mx-6 mt-2 rounded-xl bg-destructive-subtle border border-destructive/40 text-destructive text-xs px-3 py-1.5 shadow-sm flex items-center gap-2 z-30">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

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
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 z-20 max-w-5xl 2xl:max-w-6xl mx-auto w-full">
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
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                  msg.sender === "user" ? "items-end group/userMsg" : "items-start"
                }`}
              >
                {/* User Message Bubble / Inline Edit Mode */}
                {msg.sender === "user" ? (
                  editingMessageId === msg.id ? (
                    <div className="w-full sm:min-w-[320px] max-w-2xl rounded-3xl border border-accent/40 bg-surface-elevated/95 backdrop-blur-md p-4 shadow-lg flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-mono text-text-tertiary">
                        <span className="flex items-center gap-1.5 text-accent font-semibold">
                          <Pencil className="w-3.5 h-3.5" />
                          Edit message
                        </span>
                        <span className="text-[10px] text-text-tertiary hidden sm:inline">
                          Ctrl+Enter to save • Esc to cancel
                        </span>
                      </div>
                      <textarea
                        ref={editTextareaRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelEdit();
                          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleSaveEdit(msg.id);
                          }
                        }}
                        className="w-full min-h-[80px] max-h-[260px] resize-y rounded-2xl bg-surface border border-border p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-inactive focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-sans leading-relaxed transition-all"
                        placeholder="Edit your message..."
                        disabled={loading}
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated active:scale-95 transition-all"
                          disabled={loading}
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(msg.id)}
                          disabled={loading || !editingText.trim()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      tabIndex={0}
                      onClick={() =>
                        setActiveUserMessageId((prev) =>
                          prev === msg.id ? null : msg.id
                        )
                      }
                      className="rounded-3xl bg-accent px-6 py-4 text-xs sm:text-sm text-white font-medium shadow-md leading-relaxed cursor-default focus:outline-none"
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )
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

                    {/* Uploaded Document Card with Indexing Workflow */}
                    {msg.uploadedDoc ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-border bg-surface-elevated/70 p-4 space-y-3 shadow-xs">
                          {/* File info & Status Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                                <FileText className="h-5 w-5 text-accent" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-semibold text-text-primary text-xs sm:text-sm truncate max-w-[200px] sm:max-w-md">
                                  {msg.uploadedDoc.filename}
                                </h5>
                                <span className="text-[11px] text-text-tertiary font-mono">
                                  {formatBytes(msg.uploadedDoc.file_size)} • {msg.uploadedDoc.file_type.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {msg.indexingStatus === "indexing" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent border border-accent/20">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                                  Indexing…
                                </span>
                              ) : msg.indexingStatus === "indexed" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-300 border border-purple-500/20">
                                  <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                                  Indexed
                                </span>
                              ) : msg.indexingStatus === "failed" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive border border-destructive/20">
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                  Index failed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                  Uploaded
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details Metadata */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-[11px] text-text-secondary font-mono">
                            <div>Pages: {msg.uploadedDoc.page_count ?? 1}</div>
                            <div>Chars: {(msg.uploadedDoc.character_count ?? 0).toLocaleString()}</div>
                            {msg.indexingStatus === "indexed" && (
                              <div className="text-purple-600 dark:text-purple-300 font-semibold col-span-2 sm:col-span-1">
                                {msg.indexingResult?.chunks_created ?? msg.uploadedDoc.chunks_created ?? 0} Chunks in FAISS
                              </div>
                            )}
                          </div>

                          {/* Error snippet if failed */}
                          {msg.indexingStatus === "failed" && msg.indexingError && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                              <span className="font-mono text-[11px] leading-relaxed break-all">
                                {msg.indexingError}
                              </span>
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                            {(!msg.indexingStatus || msg.indexingStatus === "idle") && (
                              <button
                                type="button"
                                onClick={() => handleIndexDocument(msg.id, msg.uploadedDoc!.document_id)}
                                disabled={loading || uploading}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                title="Index into FAISS Vector Database"
                              >
                                <Cpu className="h-3.5 w-3.5" />
                                <span>Index Document</span>
                              </button>
                            )}

                            {msg.indexingStatus === "indexing" && (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-1.5 text-xs font-semibold text-accent/70 opacity-60 cursor-not-allowed"
                              >
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Indexing…</span>
                              </button>
                            )}

                            {msg.indexingStatus === "failed" && (
                              <button
                                type="button"
                                onClick={() => handleIndexDocument(msg.id, msg.uploadedDoc!.document_id)}
                                disabled={loading || uploading}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                                title="Retry indexing document"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Retry Index</span>
                              </button>
                            )}

                            {msg.indexingStatus === "indexed" && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                Ready for RAG Q&A
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Reasoning Drawer Component */}
                        <ReasoningDrawer />

                        {/* Answer Body */}
                        <div className="leading-relaxed text-text-primary text-sm sm:text-base font-sans font-normal p-1">
                          {msg.text ? (
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
                          ) : regeneratingMessageId === msg.id ? (
                            <div className="flex items-center gap-2.5 text-xs font-mono text-text-secondary animate-pulse py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-accent" />
                              <span>Regenerating answer with Gemini 2.5 Flash...</span>
                            </div>
                          ) : null}
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
                        {msg.text && (
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
                        )}
                      </>
                    )}
                  </div>
                )}

                {msg.sender === "user" ? (
                  editingMessageId === msg.id ? (
                    <span className="text-[10px] text-text-tertiary font-mono px-2">
                      {msg.timestamp}
                    </span>
                  ) : deletingMessageId === msg.id ? (
                    <div className="flex items-center gap-2 px-1 animate-in fade-in duration-150">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive-subtle/90 px-3 py-1 text-xs text-text-primary shadow-sm">
                        <span className="text-[11px] font-medium text-destructive">
                          Delete this query?
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleCancelDelete}
                            className="px-2 py-0.5 rounded-lg border border-border/60 bg-surface text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="px-2 py-0.5 rounded-lg bg-destructive text-[11px] font-semibold text-white hover:bg-destructive/90 transition-colors shadow-xs active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-tertiary font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-1">
                      <div
                        className={`flex items-center gap-1.5 transition-[opacity,transform] duration-150 ease-out ${
                          copiedQueryId === msg.id || activeUserMessageId === msg.id
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-0.5 pointer-events-none group-hover/userMsg:opacity-100 group-hover/userMsg:translate-y-0 group-hover/userMsg:pointer-events-auto group-focus-within/userMsg:opacity-100 group-focus-within/userMsg:translate-y-0 group-focus-within/userMsg:pointer-events-auto focus-visible:opacity-100 focus-visible:translate-y-0 focus-visible:pointer-events-auto"
                        }`}
                      >
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg)}
                          disabled={loading}
                          className="group/editBtn inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-2.5 py-1 text-[11px] font-mono text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:border-accent/40 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150"
                          aria-label="Edit message"
                          title="Edit message"
                        >
                          <Pencil className="h-3 w-3 text-text-tertiary group-hover/editBtn:text-accent transition-colors duration-150" />
                          <span>Edit</span>
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyQuery(msg.id, msg.text)}
                          className="group/copyBtn inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-2.5 py-1 text-[11px] font-mono text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:border-accent/40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150"
                          aria-label={
                            copiedQueryId === msg.id ? "Query copied" : "Copy query"
                          }
                          title={
                            copiedQueryId === msg.id ? "Query copied" : "Copy query"
                          }
                        >
                          {copiedQueryId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500 transition-transform duration-150" />
                              <span className="text-emerald-500 font-semibold">
                                Copied
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-text-tertiary group-hover/copyBtn:text-accent transition-colors duration-150" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleStartDelete(msg.id)}
                          disabled={loading}
                          className="group/delBtn inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-2.5 py-1 text-[11px] font-mono text-text-secondary hover:text-destructive hover:border-destructive/40 hover:bg-destructive-subtle/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive transition-all duration-150"
                          aria-label="Delete message"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3 text-text-tertiary group-hover/delBtn:text-destructive transition-colors duration-150" />
                          <span>Delete</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-text-tertiary font-mono ml-0.5">
                        {msg.timestamp}
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-[10px] text-text-tertiary font-mono px-2">
                    {msg.timestamp}
                  </span>
                )}
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
        {((loading && !regeneratingMessageId) || uploading) && (
          <div className="flex gap-4 items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shrink-0 animate-pulse">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <div className="rounded-3xl border border-accent/30 bg-surface/90 px-6 py-4 text-xs text-text-secondary flex items-center gap-3 shadow-md backdrop-blur-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <div>
                <p className="font-semibold text-text-primary font-mono text-sm">
                  {uploading
                    ? "Uploading & extracting document text..."
                    : activePipelineStage <= 2
                    ? "Searching vector database..."
                    : "Synthesizing answer with grounded citations..."}
                </p>
                <p className="text-[11px] text-text-tertiary font-mono mt-0.5">
                  {uploading
                    ? "Parsing pages & extracting text content"
                    : "Nexus_Bot processing embeddings & metrics"}
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
        <div className="max-w-4xl 2xl:max-w-5xl w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 rounded-full border border-border bg-surface-elevated/95 backdrop-blur-2xl p-2 pl-4 shadow-lg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-200"
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
                  className="w-full rounded-full border border-border bg-surface-elevated px-5 py-3 text-sm text-text-primary placeholder:text-text-inactive focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none font-sans text-center shadow-inner transition-all duration-200"
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
