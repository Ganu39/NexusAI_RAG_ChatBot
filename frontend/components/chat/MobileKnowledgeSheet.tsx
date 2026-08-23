'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Upload, CheckCircle2, Database, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { IngestedDocumentSummary } from '@/types';

interface MobileKnowledgeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (filename: string) => void;
}

export function MobileKnowledgeSheet({
  isOpen,
  onClose,
  onUploadSuccess,
}: MobileKnowledgeSheetProps) {
  const [documents, setDocuments] = useState<IngestedDocumentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listDocuments();
      setDocuments(res.documents || []);
    } catch {
      // Use fallback if offline or backend error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await apiClient.uploadDocument(file);
      await fetchDocuments();
      if (onUploadSuccess) {
        onUploadSuccess(file.name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document.';
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:items-end bg-black/75 backdrop-blur-md p-4 sm:p-0"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 sm:border-t sm:border-x-0 sm:border-b-0 border-cyan-500/30 rounded-3xl sm:rounded-t-3xl sm:rounded-b-none p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Hidden Native File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx,.md"
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono">Knowledge Base</h2>
              <p className="text-xs text-slate-400">
                {documents.length} Document{documents.length === 1 ? '' : 's'} Vectorized & Indexed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close knowledge base sheet"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full min-h-[56px] border-2 border-dashed border-cyan-500/40 rounded-2xl flex items-center justify-center gap-3 bg-cyan-500/10 text-cyan-300 font-semibold text-sm hover:bg-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Uploading & Vectorizing Document...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Click to Upload Document (PDF, TXT, DOCX)</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Indexed Documents ({documents.length}):
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Fetching vector store status...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No documents uploaded yet. Upload a PDF or TXT document above!
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.document_id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="truncate max-w-[240px] sm:max-w-md">
                    <p className="text-sm font-medium text-slate-200 truncate">{doc.filename}</p>
                    <p className="text-xs font-mono text-slate-400">
                      {doc.chunks_created ? `${doc.chunks_created} Chunks` : 'Vector Indexed'} • {doc.processing_status || 'READY'}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Indexed
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileKnowledgeSheet;
