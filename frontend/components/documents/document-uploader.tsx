"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  File,
  Cpu,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { IngestedDocumentSummary } from "@/types";

interface DocumentUploaderProps {
  onUploadSuccess?: (doc: IngestedDocumentSummary) => void;
  compact?: boolean;
}

const ALLOWED_EXTENSIONS = ["pdf", "txt", "docx"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function DocumentUploader({
  onUploadSuccess,
  compact = false,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] =
    useState<IngestedDocumentSummary | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexSuccess, setIndexSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type '.${ext || "unknown"}'. Please upload PDF, TXT, or DOCX files.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 10MB.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccessDoc(null);
    setIndexSuccess(null);
    const valErr = validateFile(file);
    if (valErr) {
      setError(valErr);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const executeUpload = async (fileToUpload: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await apiClient.uploadDocument(fileToUpload);
      setSuccessDoc(result.document);
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(result.document);
      }
    } catch (err: unknown) {
      let message =
        err instanceof Error
          ? err.message
          : "Upload failed. Please check your backend connection.";
      if (message.includes("contains no extractable text")) {
        message = `${fileToUpload.name} contains no extractable text. Please ensure the document is not empty or image-only.`;
      }
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const triggerUpload = () => {
    if (selectedFile) {
      executeUpload(selectedFile);
    }
  };

  const handleQuickIndex = async (docId: string) => {
    setIndexing(true);
    try {
      const res = await apiClient.indexDocument(docId);
      setIndexSuccess(
        `Indexed into FAISS: ${res.chunks_created} chunks and ${res.embeddings_created} Gemini embeddings created!`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to index document.";
      setError(msg);
    } finally {
      setIndexing(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setError(null);
    setSuccessDoc(null);
    setIndexSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          compact ? "py-6 px-4" : "py-10 px-6"
        } ${
          isDragging
            ? "border-accent bg-accent/10 shadow-lg shadow-accent/10"
            : selectedFile
            ? "border-border bg-surface-elevated"
            : "border-border bg-surface-muted hover:border-accent/50 hover:bg-surface-elevated/70 cursor-pointer"
        }`}
      >
        {!selectedFile && !uploading && (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Drag and drop your file here, or{" "}
                <span className="text-accent underline underline-offset-4 hover:opacity-80">
                  browse files
                </span>
              </p>
              <p className="mt-1 text-xs text-text-tertiary font-mono">
                PDF • TXT • DOCX (Max 10MB)
              </p>
            </div>
          </div>
        )}

        {selectedFile && !uploading && (
          <div className="flex w-full flex-col items-center space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-left w-full max-w-md">
              <File className="h-7 w-7 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-text-tertiary font-mono">
                  {formatBytes(selectedFile.size)} • {selectedFile.name.split(".").pop()?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                className="rounded-lg p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerUpload();
                }}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-accent-hover transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Document</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-text-primary">
                Ingesting Document to Knowledge Base...
              </p>
              <p className="text-xs text-text-secondary">
                Extracting structured text, page indices, and document metadata
              </p>
            </div>

            {/* Ingestion Pipeline Stages Progress */}
            <div className="flex items-center gap-2 text-[10px] font-mono border border-border bg-surface-elevated px-4 py-2 rounded-xl text-text-tertiary">
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Uploading
              </span>
              <span className="text-text-muted">→</span>
              <span className="text-accent font-bold animate-pulse">
                ● Extracting
              </span>
              <span className="text-text-muted">→</span>
              <span className="text-text-muted">Chunking</span>
              <span className="text-text-muted">→</span>
              <span className="text-text-muted">Indexing</span>
              <span className="text-text-muted">→</span>
              <span className="text-text-muted">Ready</span>
            </div>
          </div>
        )}
      </div>

      {/* Success Feedback Card */}
      {successDoc && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-200">
                  Document Ingested Successfully!
                </p>
                <p className="mt-0.5 text-zinc-400">
                  <span className="font-medium text-white">
                    {successDoc.filename}
                  </span>{" "}
                  ({formatBytes(successDoc.file_size)}) • {successDoc.page_count}{" "}
                  {successDoc.page_count === 1 ? "page" : "pages"} •{" "}
                  {successDoc.character_count.toLocaleString()} characters
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessDoc(null)}
              className="rounded p-1 text-emerald-400 hover:bg-emerald-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-emerald-500/20 pt-2 text-xs">
            <span className="text-zinc-400 text-[11px]">Generate vector embeddings to enable RAG similarity search.</span>
            <button
              onClick={() => handleQuickIndex(successDoc.document_id)}
              disabled={indexing || Boolean(indexSuccess)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all self-start sm:self-auto"
            >
              {indexing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Cpu className="h-3.5 w-3.5" />
              )}
              <span>{indexSuccess ? "Indexed" : "Index Vector Now"}</span>
            </button>
          </div>

          {indexSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 p-2.5 text-xs text-purple-300 border border-purple-500/20">
              <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
              <span>{indexSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message Card */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-rose-200">Upload Error</p>
            <p className="mt-0.5 text-rose-300/80 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
