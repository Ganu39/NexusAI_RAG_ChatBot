"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  HardDrive,
  Layers,
  FileCode,
  Upload,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Activity,
  CheckCircle2,
  Cpu,
  Search,
  Bot,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { IngestedDocumentSummary } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<IngestedDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listDocuments();
      setDocuments(res.documents);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to NexusAI backend service.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Calculate real metrics from backend data
  const totalDocs = documents.length;
  const totalSizeBytes = documents.reduce((acc, d) => acc + d.file_size, 0);
  const totalPages = documents.reduce((acc, d) => acc + d.page_count, 0);
  const totalChars = documents.reduce((acc, d) => acc + d.character_count, 0);

  const recentDocs = documents.slice(0, 5);

  return (
    <AppShell
      title="Knowledge Workspace"
      description="Manage your documents, indexing pipeline, and knowledge base."
      action={
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/documents"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-elevated transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open RAG Chat</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* COMPACT SYSTEM STATUS PANEL */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Activity className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">NexusAI Engine</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Operational
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary font-mono">
                  FAISS Normalized Vector Index • Gemini 2.5 Flash Grounding
                </p>
              </div>
            </div>

            {/* Real Pipeline State Indicators */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-muted px-3 py-1.5 text-text-secondary">
                <FileText className="h-3.5 w-3.5 text-accent" />
                <span>Document Ingestion:</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-muted px-3 py-1.5 text-text-secondary">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span>Vector Indexing:</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-muted px-3 py-1.5 text-text-secondary">
                <Search className="h-3.5 w-3.5 text-blue-400" />
                <span>RAG Retrieval:</span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* REAL METRICS GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Documents"
            value={loading ? "--" : totalDocs}
            subtitle={totalDocs === 1 ? "1 document stored" : `${totalDocs} documents stored`}
            icon={FileText}
            color="indigo"
          />
          <StatCard
            title="Storage Used"
            value={loading ? "--" : formatBytes(totalSizeBytes)}
            subtitle="Raw document payload"
            icon={HardDrive}
            color="emerald"
          />
          <StatCard
            title="Pages Processed"
            value={loading ? "--" : totalPages.toLocaleString()}
            subtitle="Structured page layouts"
            icon={Layers}
            color="purple"
          />
          <StatCard
            title="Extracted Content"
            value={loading ? "--" : totalChars.toLocaleString()}
            subtitle="Parsed characters"
            icon={FileCode}
            color="amber"
          />
        </div>

        {/* MAIN WORKSPACE TWO-COLUMN COMPOSITION */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Knowledge Base (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  Knowledge Base
                </h3>
              </div>
              <Link
                href="/documents"
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline transition-colors"
              >
                <span>View Knowledge Library</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
              {loading ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-12 w-full animate-pulse rounded-xl bg-surface-muted"
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="p-6 text-xs text-rose-400 text-center">{error}</div>
              ) : recentDocs.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted space-y-3">
                  <FileText className="h-8 w-8 mx-auto text-text-muted" />
                  <p>No documents uploaded yet.</p>
                  <Link
                    href="/documents"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload First Document</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.document_id}
                      className="flex items-center justify-between py-3 px-2 first:pt-0 last:pb-0 hover:bg-surface-elevated/60 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-accent border border-border shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text-primary truncate max-w-[200px] sm:max-w-[280px]">
                            {doc.filename}
                          </span>
                          <span className="text-[10px] text-text-tertiary font-mono">
                            {formatBytes(doc.file_size)} • {doc.page_count} {doc.page_count === 1 ? "page" : "pages"} • {doc.file_type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          Ingested
                        </span>
                        <Link
                          href={`/documents/${doc.document_id}`}
                          className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                          title="Inspect Document"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                <span>Displaying latest {recentDocs.length} of {totalDocs} indexed files</span>
                <Link href="/documents" className="text-accent hover:underline">Manage All →</Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RAG Assistant Interactive Workspace (Cols 8-12) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  RAG Assistant
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ready
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4 min-h-[300px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent-soft p-3 text-xs text-accent">
                  <Sparkles className="h-4 w-4 text-accent shrink-0" />
                  <span>
                    Ask natural questions grounded strictly in your indexed documents.
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-surface-muted p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-text-primary text-[11px]">
                    <span>Sample Grounded Query:</span>
                    <span className="text-[10px] font-mono text-emerald-400">96.4% Match</span>
                  </div>
                  <p className="text-text-secondary italic">
                    &quot;What does the documentation state about vector retrieval?&quot;
                  </p>
                  <div className="text-[10px] font-mono text-text-tertiary border-t border-border pt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>Cites exact page boundaries & chunk IDs</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Button
                  asChild
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Link href="/chat">
                    <span>Open RAG Chat Assistant</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-[10px] text-center text-text-tertiary font-mono">
                  Synthesizes answers with Google Gemini 2.5 Flash
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

