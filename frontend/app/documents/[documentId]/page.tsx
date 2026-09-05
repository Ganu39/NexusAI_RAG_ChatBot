"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Calendar,
  Layers,
  FileCode,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Cpu,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import { IngestedDocumentSummary } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return "Unknown";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

interface PageParams {
  params: Promise<{ documentId: string }>;
}

export default function DocumentDetailPage({ params }: PageParams) {
  const resolvedParams = use(params);
  const documentId = resolvedParams.documentId;
  const router = useRouter();

  const [doc, setDoc] = useState<IngestedDocumentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<{
    chunks: number;
    embeddings: number;
  } | null>(null);

  useEffect(() => {
    async function loadDoc() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.getDocument(documentId);
        setDoc(data);
        if (data.is_indexed) {
          setIndexResult({
            chunks: data.chunks_created || 0,
            embeddings: data.embeddings_created || 0,
          });
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Document not found or backend unavailable.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [documentId]);

  const handleIndex = async () => {
    if (!doc) return;
    setIndexing(true);
    setError(null);
    try {
      const res = await apiClient.indexDocument(doc.document_id);
      setIndexResult({
        chunks: res.chunks_created,
        embeddings: res.embeddings_created,
      });
      // Refresh doc data
      const updated = await apiClient.getDocument(doc.document_id);
      setDoc(updated);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate vector index.";
      setError(msg);
    } finally {
      setIndexing(false);
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${doc.filename}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.deleteDocument(doc.document_id);
      router.push("/documents");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete document.";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  const isIndexed = doc?.is_indexed || Boolean(indexResult);

  return (
    <AppShell
      title={doc ? doc.filename : "Document Details"}
      description={`UUID: ${documentId}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/documents"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Repository</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-accent-hover transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Ask in RAG Chat</span>
          </Link>
          {doc && (
            <>
              <button
                onClick={handleIndex}
                disabled={indexing || deleting}
                className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-white disabled:opacity-50 transition-all"
              >
                {indexing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Cpu className="h-4 w-4" />
                )}
                <span>{isIndexed ? "Re-Index Vector" : "Index Vector"}</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || indexing}
                className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete Document</span>
              </button>
            </>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-xs text-text-secondary">Loading document metadata...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 p-12 text-center text-rose-400 space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <div>
            <h3 className="text-base font-semibold text-rose-300">
              Document Error
            </h3>
            <p className="mt-1 text-xs text-rose-400/80">{error}</p>
          </div>
          <Link
            href="/documents"
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
          >
            Return to Documents
          </Link>
        </div>
      ) : doc ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary truncate max-w-[280px] sm:max-w-lg">{doc.filename}</h2>
                  <span className="rounded-lg bg-surface-muted border border-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary uppercase">
                    {doc.file_type}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-text-tertiary">
                  Document ID: {doc.document_id}
                </p>
              </div>
            </div>

            <div>
              {isIndexed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                  Indexed ({doc.chunks_created || indexResult?.chunks || 0} Chunks)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Uploaded & Ingested
                </span>
              )}
            </div>
          </div>

          {/* Index Result Banner */}
          {isIndexed && (
            <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-purple-700 dark:text-purple-300 text-xs">
              <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400 shrink-0" />
              <div>
                <p className="font-semibold text-purple-800 dark:text-purple-200">
                  Document Vector Embeddings Active in FAISS Index
                </p>
                <p className="text-text-secondary mt-0.5">
                  Generated {doc.chunks_created || indexResult?.chunks || 0} page-aware semantic text chunks and{" "}
                  {doc.embeddings_created || indexResult?.embeddings || 0} Gemini 3072d vector embeddings.
                </p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <HardDrive className="h-4 w-4 text-emerald-500" />
                <span>File Size</span>
              </div>
              <div className="text-xl font-bold text-text-primary font-mono">
                {formatBytes(doc.file_size)}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Layers className="h-4 w-4 text-purple-500" />
                <span>Page Count</span>
              </div>
              <div className="text-xl font-bold text-text-primary">
                {doc.page_count} {doc.page_count === 1 ? "Page" : "Pages"}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <FileCode className="h-4 w-4 text-amber-500" />
                <span>Character Count</span>
              </div>
              <div className="text-xl font-bold text-text-primary font-mono">
                {doc.character_count.toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Calendar className="h-4 w-4 text-accent" />
                <span>Ingestion Timestamp</span>
              </div>
              <div className="text-xs font-semibold text-text-primary">
                {formatDate(doc.created_at)}
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>Document Processing Architecture</span>
            </h3>
            <div className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
              <p>
                • Structured text extraction completed preserving page boundaries and chunk indices.
              </p>
              <p>
                • Full document text safely stored in backend isolated storage for deterministic context recovery.
              </p>
              <p>
                • Vector embeddings generated via Gemini (`models/gemini-embedding-001`) and indexed in FAISS vector store.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
