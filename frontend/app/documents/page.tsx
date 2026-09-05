"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { apiClient } from "@/lib/api";
import { IngestedDocumentSummary } from "@/types";
import { RefreshCw, MessageSquare, Plus, Library } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<IngestedDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

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
          : "Failed to load documents from NexusAI backend.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AppShell
      title="Knowledge Library"
      description="Upload, index, inspect and manage your knowledge."
      action={
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={scrollToUpload}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-accent-hover transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Upload Document</span>
          </button>
          <Link
            href="/chat"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-elevated transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open RAG Chat</span>
          </Link>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Upload Experience Section */}
        <section ref={uploadSectionRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Document Ingestion
              </h2>
            </div>
            <span className="text-[11px] text-text-tertiary font-mono">
              PDF • TXT • DOCX (Max 10MB)
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <DocumentUploader onUploadSuccess={() => fetchDocuments()} />
          </div>
        </section>

        {/* Knowledge Repository Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Indexed Documents
              </h2>
            </div>
            <span className="rounded-full bg-surface-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-accent font-mono">
              {documents.length}
            </span>
          </div>

          <DocumentList
            documents={documents}
            loading={loading}
            error={error}
            onRefresh={fetchDocuments}
          />
        </section>
      </div>
    </AppShell>
  );
}

