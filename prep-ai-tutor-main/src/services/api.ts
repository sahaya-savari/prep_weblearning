// Centralized API service — all backend calls go through here.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── MCQ ──────────────────────────────────────────────
export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GenerateMCQPayload {
  exam: string;
  topic?: string;
  difficulty?: string;
  count?: number;
}

export const generateMCQs = async (payload: GenerateMCQPayload): Promise<{ questions: MCQQuestion[] }> => {
  return request<{ questions: MCQQuestion[] }>("/api/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// ── Evaluate ─────────────────────────────────────────
export interface EvaluatePayload {
  questionId: string;
  selectedIndex: number;
}

export const evaluateAnswer = async (payload: EvaluatePayload): Promise<{ correct: boolean; explanation: string }> => {
  return request<{ correct: boolean; explanation: string }>("/api/evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// ── Chat ─────────────────────────────────────────────
export interface ChatPayload {
  message: string;
  exam?: string;
  chatHistory?: { role: string; content: string }[];
  notebookMode?: boolean;
}

export const sendChatMessage = async (payload: ChatPayload): Promise<{ response: string; sources?: { content: string; documentName: string }[] }> => {
  return request<{ response: string; sources?: { content: string; documentName: string }[] }>("/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// ── Teach ────────────────────────────────────────────
export interface TeachPayload {
  topic: string;
  exam?: string;
}

export interface TeachResponse {
  explanation: string;
  keyPoints: string[];
  examples: string[];
  formulas?: string[];
}

export const teachTopic = async (payload: TeachPayload): Promise<TeachResponse> => {
  return request<TeachResponse>("/api/teach", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// ── Knowledge Base (RAG) ─────────────────────────────
export const uploadDocument = async (file: File): Promise<{ documentId: string; name: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
};

export const askFromDocs = async (payload: { question: string; documentIds?: string[] }): Promise<{ answer: string; sources: { content: string; documentName: string }[] }> => {
  return request<{ answer: string; sources: { content: string; documentName: string }[] }>(
    "/api/ask-docs",
    { method: "POST", body: JSON.stringify(payload) }
  );
};
