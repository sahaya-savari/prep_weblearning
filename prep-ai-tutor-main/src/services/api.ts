// Centralized API service — all backend calls go through here.

const API_BASE =
  (import.meta.env.VITE_API_URL as string) ||
  "https://prepmind-backend-bfkw.onrender.com";

const getModel = () => localStorage.getItem("prepmind_model") || "gemini";

// ── Core request helper ───────────────────────────────
async function request<T>(endpoint: string, options?: RequestInit, timeoutMs = 55000): Promise<T> {
  // Abort controller for timeout (handles Render cold starts up to 50s)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Inject selected AI model into POST JSON payloads automatically
  if (options?.body && typeof options.body === "string" && options.method === "POST") {
    try {
      const parsed = JSON.parse(options.body);
      if (!parsed.model) parsed.model = getModel();
      options.body = JSON.stringify(parsed);
    } catch {
      // Not JSON — leave body as-is
    }
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timer);

    if (!res.ok) {
      // Parse error body — backend uses "error" key, some use "message"
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error || errBody.message || `Server error ${res.status}`;
      throw new Error(errMsg);
    }

    return res.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The server may be starting up — please try again in a moment.");
    }
    throw err;
  }
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

export interface GenerateMCQResponse {
  success: boolean;
  fallback?: boolean;
  questions: MCQQuestion[];
}

export const generateMCQs = async (payload: GenerateMCQPayload): Promise<GenerateMCQResponse> => {
  return request<GenerateMCQResponse>("/api/generate", {
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

export interface ChatResponse {
  success: boolean;
  fallback?: boolean;
  response: string;
  sources?: { content: string; documentName: string }[];
}

export const sendChatMessage = async (payload: ChatPayload): Promise<ChatResponse> => {
  return request<ChatResponse>("/api/chat", {
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
  success: boolean;
  fallback?: boolean;
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Upload timed out. Please try a smaller file.");
    throw err;
  }
};

export const askFromDocs = async (
  payload: { question: string; documentIds?: string[] }
): Promise<{ answer: string; sources: { content: string; documentName: string }[] }> => {
  return request<{ answer: string; sources: { content: string; documentName: string }[] }>(
    "/api/ask-docs",
    { method: "POST", body: JSON.stringify(payload) }
  );
};
