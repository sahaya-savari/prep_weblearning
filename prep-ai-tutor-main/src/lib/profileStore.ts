export interface TopicStat {
  correct: number;
  wrong: number;
  lastScore: number;
  lastAttempt: string;
}

export interface HistoryEntry {
  topic: string;
  score: number;
  total: number;
  difficulty: "easy" | "medium" | "hard";
  date: string;
}

export interface UserProfile {
  topics: Record<string, TopicStat>;
  history: HistoryEntry[];
  difficulty: "easy" | "medium" | "hard";
}

const MAX_HISTORY = 50;

export function safeParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function getUserProfile(): UserProfile {
  const profileRaw = localStorage.getItem("userProfile");
  
  if (!profileRaw) {
    // Legacy mapping fallback ensuring old stats are safely merged, never overwritten blindingly.
    const rawScores = safeParse<HistoryEntry[]>("scores", []);
    const oldScores = Array.isArray(rawScores) ? rawScores.slice(-MAX_HISTORY) : [];
    const oldStats = safeParse<Record<string, TopicStat>>("topicStats", {});
    const lastDiff = localStorage.getItem("lastDifficulty") || "medium";

    const defaultProfile: UserProfile = {
      topics: oldStats,
      history: oldScores,
      difficulty: lastDiff as "easy" | "medium" | "hard"
    };
    
    localStorage.setItem("userProfile", JSON.stringify(defaultProfile));
    return defaultProfile;
  }
  
  return safeParse("userProfile", { topics: {}, history: [], difficulty: "medium" } as UserProfile);
}

export function updateUserProfile(updateFn: (profile: UserProfile) => void): UserProfile {
  const profile = getUserProfile();
  
  // Safely execute the mutation callback directly onto the clone
  updateFn(profile);
  
  // Mandatory Limits Guarantee
  if (profile.history && profile.history.length > MAX_HISTORY) {
     profile.history = profile.history.slice(-MAX_HISTORY);
  }

  localStorage.setItem("userProfile", JSON.stringify(profile));
  
  // Return for react state sync
  return profile;
}

// ── Shared Analytics Helpers ──────────────────
export function getStrengthTopics(profile: UserProfile): string[] {
  return Object.keys(profile.topics || {}).filter(t => profile.topics[t].correct >= profile.topics[t].wrong);
}

export function getWeakTopics(profile: UserProfile): string[] {
  return Object.keys(profile.topics || {}).filter(t => profile.topics[t].wrong > profile.topics[t].correct);
}
