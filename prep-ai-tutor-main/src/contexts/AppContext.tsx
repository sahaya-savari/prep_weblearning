import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  type: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AppState {
  selectedExam: string;
  setSelectedExam: (exam: string) => void;
  examHistory: string[];
  documents: UploadedDocument[];
  addDocument: (doc: UploadedDocument) => void;
  removeDocument: (id: string) => void;
  completedTopics: Set<string>;
  toggleTopicComplete: (topic: string) => void;
  practiceStats: { correct: number; total: number; sessions: number };
  updatePracticeStats: (correct: number, total: number) => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  saveChatHistory: (history: ChatMessage[]) => void;
  selectedAiModel: "gemini" | "ollama";
  setSelectedAiModel: (model: "gemini" | "ollama") => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [selectedExam, setSelectedExamRaw] = useState<string>(() => localStorage.getItem("prepmind_exam") || "");
  const [examHistory, setExamHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("prepmind_history") || "[]"); } catch { return []; }
  });
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("prepmind_completed") || "[]")); } catch { return new Set(); }
  });
  const [practiceStats, setPracticeStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("prepmind_stats") || '{"correct":0,"total":0,"sessions":0}'); } catch { return { correct: 0, total: 0, sessions: 0 }; }
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem("prepmind_chat") || "[]"); } catch { return []; }
  });
  const [selectedAiModel, setSelectedAiModelRaw] = useState<"gemini" | "ollama">(() => {
    return (localStorage.getItem("prepmind_model") as "gemini" | "ollama") || "gemini";
  });

  const setSelectedAiModel = useCallback((model: "gemini" | "ollama") => {
    setSelectedAiModelRaw(model);
    localStorage.setItem("prepmind_model", model);
  }, []);

  // Documents remain local-only for now
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    try {
      const stored = localStorage.getItem("prepmind_documents");
      if (!stored) return [];
      return JSON.parse(stored).map((d: any) => ({ ...d, uploadedAt: new Date(d.uploadedAt) }));
    } catch {
      return [];
    }
  });

  // Load from Supabase on login
  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // .maybeSingle() returns null (not an error) when no row exists yet
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
      if (error) {
        console.error('[Supabase] loadProfile error:', error.message);
        return;
      }
      if (!data) return; // new user — profile not yet created (trigger will handle it)

      if (data.selected_exam) {
        setSelectedExamRaw(data.selected_exam);
        localStorage.setItem("prepmind_exam", data.selected_exam);
      }
      if (data.exam_history) {
        setExamHistory(data.exam_history);
        localStorage.setItem("prepmind_history", JSON.stringify(data.exam_history));
      }
      if (data.completed_topics) {
        setCompletedTopics(new Set(data.completed_topics));
        localStorage.setItem("prepmind_completed", JSON.stringify(data.completed_topics));
      }
      if (data.practice_stats) {
        setPracticeStats(data.practice_stats);
        localStorage.setItem("prepmind_stats", JSON.stringify(data.practice_stats));
      }
      if (data.chat_history) {
        setChatHistory(data.chat_history);
        localStorage.setItem("prepmind_chat", JSON.stringify(data.chat_history));
      }
    }

    // Ensure users + profiles rows exist for this user (idempotent upsert)
    async function ensureProfile() {
      const { error: uErr } = await supabase
        .from('users')
        .upsert({ id: user!.id, email: user!.email }, { onConflict: 'id', ignoreDuplicates: true });
      if (uErr) console.error('[Supabase] ensureProfile users upsert:', uErr.message);

      const { error: pErr } = await supabase
        .from('profiles')
        .upsert({ id: user!.id }, { onConflict: 'id', ignoreDuplicates: true });
      if (pErr) console.error('[Supabase] ensureProfile profiles upsert:', pErr.message);
    }

    ensureProfile().then(loadProfile);

    // FIX: Prevent UI showing files from another account by clearing cached documents on user change
    setDocuments([]);
    localStorage.removeItem("prepmind_documents");
  }, [user]);

  const setSelectedExam = useCallback((exam: string) => {
    setSelectedExamRaw(exam);
    localStorage.setItem("prepmind_exam", exam);

    setExamHistory(prev => {
      const next = [exam, ...prev.filter(e => e !== exam)].slice(0, 10);
      localStorage.setItem("prepmind_history", JSON.stringify(next));
      if (user) {
        supabase.from('profiles')
          .update({ selected_exam: exam, exam_history: next })
          .eq('id', user.id)
          .then(({ error }) => { if (error) console.error('[Supabase] setSelectedExam:', error.message); });
      }
      return next;
    });
  }, [user]);

  const toggleTopicComplete = useCallback((topic: string) => {
    setCompletedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);

      const arr = [...next];
      localStorage.setItem("prepmind_completed", JSON.stringify(arr));
      if (user) {
        supabase.from('profiles')
          .update({ completed_topics: arr })
          .eq('id', user.id)
          .then(({ error }) => { if (error) console.error('[Supabase] toggleTopicComplete:', error.message); });
      }
      return next;
    });
  }, [user]);

  const updatePracticeStats = useCallback((correct: number, total: number) => {
    setPracticeStats((prev: any) => {
      const next = { correct: prev.correct + correct, total: prev.total + total, sessions: prev.sessions + 1 };
      localStorage.setItem("prepmind_stats", JSON.stringify(next));
      if (user) {
        supabase.from('profiles')
          .update({ practice_stats: next })
          .eq('id', user.id)
          .then(({ error }) => { if (error) console.error('[Supabase] updatePracticeStats:', error.message); });
      }
      return next;
    });
  }, [user]);

  const saveChatHistory = useCallback((history: ChatMessage[]) => {
    setChatHistory(history);
    localStorage.setItem("prepmind_chat", JSON.stringify(history));
    if (user) {
      supabase.from('profiles')
        .update({ chat_history: history })
        .eq('id', user.id)
        .then(({ error }) => { if (error) console.error('[Supabase] saveChatHistory:', error.message); });
    }
  }, [user]);

  const addDocument = useCallback((doc: UploadedDocument) => {
    setDocuments(prev => {
      const next = [...prev, doc];
      localStorage.setItem("prepmind_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const next = prev.filter(d => d.id !== id);
      localStorage.setItem("prepmind_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      selectedExam, setSelectedExam, examHistory,
      documents, addDocument, removeDocument,
      completedTopics, toggleTopicComplete,
      practiceStats, updatePracticeStats,
      chatHistory, setChatHistory, saveChatHistory,
      selectedAiModel, setSelectedAiModel
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
