import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/StatusComponents";
import { useAppContext, type UploadedDocument } from "@/contexts/AppContext";
import { uploadDocument, askFromDocs } from "@/services/api";
import { FolderOpen, Upload, FileText, Send, Trash2, Bot, Sparkles, CloudUpload } from "lucide-react";
import { motion } from "framer-motion";

interface QAEntry {
  question: string;
  answer: string;
  sources?: { content: string; documentName: string }[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatTime(date: Date): string {
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function KnowledgeBasePage() {
  const { documents, addDocument, removeDocument } = useAppContext();
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    const allowed = [".pdf", ".txt", ".md"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError("Only PDF, TXT, and MD files are supported.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      // Real upload — sends file to backend, processes, stores in Supabase
      const result = await uploadDocument(file);
      const doc: UploadedDocument = {
        id: result.documentId,      // real Supabase document ID
        name: result.name,
        size: file.size,
        uploadedAt: new Date(),
        type: ext,
      };
      addDocument(doc);
    } catch (err: any) {
      console.error("[KnowledgeBase] Upload failed:", err.message);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [addDocument]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    const q = question.trim();
    setQuestion("");
    setAsking(true);
    setError("");
    try {
      const data = await askFromDocs({
        question: q,
        documentIds: documents.map((d) => d.id),
      });
      setQaHistory((prev) => [...prev, { question: q, answer: data.answer, sources: data.sources }]);
    } catch {
      setError("Backend not connected yet. Feature coming soon.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload documents and ask questions from your own notes.</p>
      </div>

      {/* Upload Section */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" /> Your Documents
          </h2>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl btn-glow"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/40 hover:border-primary/40 hover:bg-muted/10"
          }`}
        >
          <CloudUpload className={`h-10 w-10 mx-auto mb-3 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium">{dragOver ? "Drop file here" : "Drag & drop a file here"}</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse • PDF, TXT, MD</p>
        </div>

        {uploading && <LoadingSpinner text="Processing document..." />}

        {documents.length === 0 && !uploading ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 border border-border/30 group hover:border-primary/20 transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{doc.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 mt-0.5">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{formatTime(doc.uploadedAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-2">⚠️ {error}</p>
        )}
      </Card>

      {/* Q&A Section */}
      <Card className="p-5 sm:p-6 glass rounded-2xl space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Ask from your notes
        </h2>

        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about your uploaded documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            disabled={asking || documents.length === 0}
            className="bg-muted/30 border-border/40 rounded-xl"
          />
          <Button
            size="icon"
            onClick={handleAsk}
            disabled={!question.trim() || asking || documents.length === 0}
            className="rounded-xl btn-glow flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {documents.length === 0 && (
          <p className="text-xs text-muted-foreground/60">Upload a document first to start asking questions.</p>
        )}

        {asking && <LoadingSpinner text="Searching your documents..." />}

        {qaHistory.length > 0 && (
          <div className="space-y-4 pt-2">
            {qaHistory.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">Q:</span> {entry.question}
                </p>
                <div className="rounded-xl glass p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{entry.answer}</p>
                  </div>
                  {entry.sources && entry.sources.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Source Chunks
                      </p>
                      <div className="space-y-2">
                        {entry.sources.map((s, j) => (
                          <div key={j} className="rounded-lg bg-muted/20 border border-border/20 p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className="text-[10px] rounded-md">
                                📄 {s.documentName}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground/70 line-clamp-3">{s.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
