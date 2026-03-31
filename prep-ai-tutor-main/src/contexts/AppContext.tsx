import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  type: string;
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
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY = "prepmind_exam";

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedExam, setSelectedExamRaw] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );
  const [examHistory, setExamHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("prepmind_history") || "[]");
    } catch {
      return [];
    }
  });

  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    try {
      const stored = localStorage.getItem("prepmind_documents");
      if (!stored) return [];
      return JSON.parse(stored).map((d: any) => ({ ...d, uploadedAt: new Date(d.uploadedAt) }));
    } catch {
      return [];
    }
  });

  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("prepmind_completed") || "[]"));
    } catch {
      return new Set();
    }
  });

  const [practiceStats, setPracticeStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("prepmind_stats") || '{"correct":0,"total":0,"sessions":0}');
    } catch {
      return { correct: 0, total: 0, sessions: 0 };
    }
  });

  const setSelectedExam = useCallback((exam: string) => {
    setSelectedExamRaw(exam);
    localStorage.setItem(STORAGE_KEY, exam);
    setExamHistory((prev) => {
      const next = [exam, ...prev.filter((e) => e !== exam)].slice(0, 10);
      localStorage.setItem("prepmind_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const addDocument = useCallback((doc: UploadedDocument) => {
    setDocuments((prev) => {
      const next = [...prev, doc];
      localStorage.setItem("prepmind_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem("prepmind_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleTopicComplete = useCallback((topic: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      localStorage.setItem("prepmind_completed", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const updatePracticeStats = useCallback((correct: number, total: number) => {
    setPracticeStats((prev: any) => {
      const next = { correct: prev.correct + correct, total: prev.total + total, sessions: prev.sessions + 1 };
      localStorage.setItem("prepmind_stats", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      selectedExam, setSelectedExam, examHistory,
      documents, addDocument, removeDocument,
      completedTopics, toggleTopicComplete,
      practiceStats, updatePracticeStats,
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
