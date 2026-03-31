import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sendChatMessage } from "@/services/api";
import { Send, Bot, User, Trash2, Sparkles, BookOpen, FileText, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatPage() {
  const { selectedExam, documents, chatHistory, saveChatHistory, selectedAiModel } = useAppContext();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"general" | "notebook">("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    
    // Optimistic UI update
    const userMsg = { role: "user" as const, content: text };
    const optimisticHistory = [...chatHistory, userMsg];
    saveChatHistory(optimisticHistory);
    setLoading(true);

    try {
      const data = await sendChatMessage({
        message: text,
        exam: selectedExam || undefined,
        chatHistory: optimisticHistory.map((m) => ({ role: m.role, content: m.content })),
        notebookMode: mode === "notebook",
      });
      
      saveChatHistory([...optimisticHistory, {
        role: "assistant" as const,
        content: data.response,
        // @ts-ignore - sources is extended in UI but not strict context
        sources: data.sources,
      }]);
    } catch {
      saveChatHistory([...optimisticHistory, { 
        role: "assistant" as const, 
        content: "⚠️ Backend connection failed. Please ensure your backend is actively running." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => saveChatHistory([]);

  return (
    <div className="mx-auto max-w-3xl flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Study Assistant
            <Badge variant="outline" className="text-[10px] ml-2 font-mono bg-accent/10 border-accent/20 text-accent">
              {selectedAiModel.toUpperCase()}
            </Badge>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            {selectedExam && (
              <Badge variant="secondary" className="rounded-lg">{selectedExam}</Badge>
            )}
            {mode === "notebook" && documents.length > 0 && (
              <Badge variant="outline" className="rounded-lg text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Using: {documents.length} doc{documents.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="rounded-lg hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-3 p-1 rounded-xl bg-muted/30 border border-border/30 w-fit">
        <button
          onClick={() => setMode("general")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === "general"
              ? "bg-primary text-primary-foreground shadow-sm glow-primary/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
          General Chat
        </button>
        <button
          onClick={() => setMode("notebook")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === "notebook"
              ? "bg-primary text-primary-foreground shadow-sm glow-primary/50"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 inline mr-1.5" />
          Notebook Mode
        </button>
      </div>

      <Card className="flex-1 flex flex-col glass rounded-2xl overflow-hidden shadow-xl border-t-0 p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {chatHistory.length === 0 && mode === "general" && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10 opacity-70">
              <div className="rounded-2xl bg-muted/30 p-5 border-gradient">
                <Sparkles className="h-10 w-10 text-primary/70" />
              </div>
              <div>
                <p className="font-medium text-lg">Start a conversation</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Ask anything about your exam topics, request study tips, or solve complex problems.
                </p>
              </div>
            </div>
          )}

          {chatHistory.length === 0 && mode === "notebook" && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10 opacity-70">
              <div className="rounded-2xl bg-muted/30 p-5 border-gradient">
                <FolderOpen className="h-10 w-10 text-primary/70" />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {documents.length > 0
                    ? "Ask questions from your notes"
                    : "Upload notes to start learning"
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {documents.length > 0
                    ? `${documents.length} document${documents.length > 1 ? "s" : ""} loaded. Ask anything, and I'll cite my sources!`
                    : "Upload documents in your Knowledge Base first so I can retrieve answers from them."
                  }
                </p>
              </div>
              {documents.length === 0 && (
                <Button
                  variant="secondary"
                  className="rounded-xl mt-2 glow-secondary/20"
                  onClick={() => navigate("/knowledge")}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Go to Knowledge Base
                </Button>
              )}
            </div>
          )}

          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center glow-primary shadow-sm border border-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm border border-primary/50"
                      : "glass rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* @ts-ignore */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="rounded-xl bg-muted/20 border border-border/30 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 font-bold">
                      <FileText className="h-3 w-3" /> Sources cited
                    </p>
                    {/* @ts-ignore */}
                    {msg.sources.map((src, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5">📄</span>
                        <div>
                          <span className="font-medium text-foreground/80">{src.documentName}</span>
                          <p className="text-muted-foreground/60 mt-0.5 line-clamp-2">{src.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shadow-sm border border-border/50">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center glow-primary border border-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Sparkles className="h-3 w-3 animate-pulse text-primary" />
                {selectedAiModel} is thinking...
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t border-border/30 p-3 flex gap-2 glass-strong relative z-10">
          <Input
            placeholder={mode === "notebook" ? "Ask from your notes..." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            className="bg-muted/30 border-border/40 rounded-xl shadow-inner font-medium text-sm h-11"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded-xl btn-glow flex-shrink-0 h-11 w-11 shadow-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
