"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Database,
  ShieldCheck,
  Trash2,
  HardDrive,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient, getOrCreateUserId, SystemMetrics } from "@/lib/api";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Custom User ID editing state
  const [isEditingUserId, setIsEditingUserId] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => {
    const currentId = getOrCreateUserId();
    setUserId(currentId);
    setCustomInput(currentId);
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const data = await apiClient.getMetrics();
      setMetrics(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load system metrics.";
      setMetricsError(msg);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleCopyUserId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustomUserId = () => {
    const clean = customInput.trim();
    if (!clean) {
      setIdError("User ID cannot be empty.");
      return;
    }
    const sanitized = clean.replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!sanitized) {
      setIdError("User ID must contain valid alphanumeric characters.");
      return;
    }

    localStorage.setItem("nexusai_user_id", sanitized);
    setUserId(sanitized);
    setIsEditingUserId(false);
    setIdError(null);
    window.location.reload();
  };

  const handleResetUserId = () => {
    if (
      window.confirm(
        "Generate a new random Workspace User ID? Your repository view will switch to a fresh isolated workspace."
      )
    ) {
      const newId = `usr_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      localStorage.setItem("nexusai_user_id", newId);
      setUserId(newId);
      setCustomInput(newId);
      window.location.reload();
    }
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Clear all locally saved chat history?")) {
      try {
        sessionStorage.removeItem("nexusai_rag_chat_messages");
        setCacheCleared(true);
        setTimeout(() => setCacheCleared(false), 2500);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <AppShell
      title="Workspace Settings"
      description="Manage workspace isolation, custom user IDs, vector store provider, and operational telemetry."
    >
      <div className="max-w-5xl space-y-6">
        {/* 1. USER ID & WORKSPACE ISOLATION */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-base">
                  Browser Workspace Isolation
                </h3>
                <p className="text-xs text-text-tertiary font-mono">
                  Unique client identifier isolating your document repository and vector searches.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
              Active Workspace
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                Your Workspace User ID:
              </label>
              {!isEditingUserId && (
                <button
                  onClick={() => {
                    setIsEditingUserId(true);
                    setCustomInput(userId);
                    setIdError(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Customize User ID</span>
                </button>
              )}
            </div>

            {isEditingUserId ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom User ID (e.g. my_workspace_1)..."
                    className="flex-1 rounded-2xl border border-accent/50 bg-surface-elevated px-4 py-3 font-mono text-xs text-accent font-semibold focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-200"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCustomUserId}
                      className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-xs font-semibold text-white hover:bg-accent-hover transition-all shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-hover-shadow"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save & Switch</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUserId(false);
                        setIdError(null);
                      }}
                      className="flex items-center justify-center rounded-2xl border border-border bg-surface-muted p-3 text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-hover-shadow"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {idError && (
                  <p className="text-xs text-destructive">{idError}</p>
                )}
                <p className="text-[11px] text-text-tertiary leading-relaxed">
                  Type any custom workspace name (e.g., <code className="text-accent font-mono">my_workspace</code> or <code className="text-accent font-mono font-semibold">team_alpha</code>). You can switch between custom IDs anytime!
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 rounded-2xl border border-border bg-surface-elevated px-4 py-3 font-mono text-xs text-accent font-semibold select-all truncate">
                  {userId || "Loading User ID..."}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyUserId}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-xs font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-hover-shadow"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-accent" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetUserId}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive btn-hover-shadow"
                    title="Generate a new random isolated workspace ID"
                  >
                    <RefreshCw className="h-4 w-4 text-destructive" />
                    <span>Randomize</span>
                  </button>
                </div>
              </div>
            )}

            <p className="text-[11px] text-text-inactive leading-relaxed">
              Your User ID is saved in your browser&apos;s <code className="text-accent font-mono">localStorage</code>. Documents uploaded under this ID remain isolated to your session.
            </p>
          </div>
        </div>

        {/* 2. VECTOR STORE INFRASTRUCTURE & TELEMETRY */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shadow-sm">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-base">
                  Vector Store & System Telemetry
                </h3>
                <p className="text-xs text-text-tertiary font-mono">
                  Operational metrics for vector embeddings and document indexing.
                </p>
              </div>
            </div>
            <button
              onClick={fetchMetrics}
              disabled={loadingMetrics}
              className="rounded-xl border border-border bg-surface-elevated p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted disabled:opacity-50 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-hover-shadow"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${loadingMetrics ? "animate-spin text-accent" : ""}`} />
            </button>
          </div>

          {loadingMetrics ? (
            <div className="flex items-center justify-center p-8 text-xs text-text-tertiary gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <span>Fetching telemetry metrics from production backend...</span>
            </div>
          ) : metricsError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive-subtle p-4 text-xs text-destructive">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <span>{metricsError}</span>
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Cpu className="h-4 w-4 text-accent" />
                  <span className="font-semibold">Active Vector Provider:</span>
                </div>
                <span className="rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent border border-accent/20 font-mono uppercase">
                  {metrics.vector_provider} (Inner Product Cosine Similarity)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Total Documents</span>
                  <div className="text-lg font-bold text-text-primary font-mono">{metrics.total_documents}</div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Indexed Documents</span>
                  <div className="text-lg font-bold text-emerald-500 font-mono">{metrics.total_indexed_documents}</div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Total Chunks</span>
                  <div className="text-lg font-bold text-accent font-mono">{metrics.total_chunks_created}</div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Embeddings Created</span>
                  <div className="text-lg font-bold text-accent font-mono">{metrics.total_embeddings_created}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 3. RAG ARCHITECTURE CONFIGURATION */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3.5 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">
                RAG Engine Architecture
              </h3>
              <p className="text-xs text-text-tertiary font-mono">
                System parameters and LLM synthesis configurations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">LLM Synthesis Engine</span>
              <div className="font-semibold text-text-primary">Google Gemini 2.5 Flash</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Embedding Model</span>
              <div className="font-mono text-accent font-semibold">models/gemini-embedding-001 (3072d)</div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">Security Status</span>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
                <span>Prompt Injection Defense Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LOCAL STORAGE MAINTENANCE */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3.5 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive-subtle text-destructive border border-destructive/30 shadow-sm">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">
                Storage & Cache Maintenance
              </h3>
              <p className="text-xs text-text-tertiary font-mono">
                Clear locally cached chat sessions and transient browser data.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-semibold text-text-primary">Clear Chat Session History</h4>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Resets locally persisted conversation turns stored in your browser session.
              </p>
            </div>

            <button
              onClick={handleClearChatHistory}
              className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive-subtle px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive shrink-0 btn-hover-shadow"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span>{cacheCleared ? "Chat History Cleared!" : "Clear Chat History"}</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
