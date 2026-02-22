const KEYS = {
  API_KEY: "xueba-api-key",
  HISTORY: "xueba-history",
  PREFERENCES: "xueba-preferences",
  CACHED_QUESTIONS: "xueba-cached-questions",
} as const;

export interface HistoryEntry {
  certificationId: string;
  date: number;
  score: number;
  mode: "practice" | "mock";
  totalQuestions: number;
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getApiKey: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEYS.API_KEY);
  },
  setApiKey: (key: string) => {
    localStorage.setItem(KEYS.API_KEY, key);
  },
  clearApiKey: () => {
    localStorage.removeItem(KEYS.API_KEY);
  },

  getHistory: (): HistoryEntry[] => getItem(KEYS.HISTORY, []),
  addHistoryEntry: (entry: HistoryEntry) => {
    const history = getItem<HistoryEntry[]>(KEYS.HISTORY, []);
    history.push(entry);
    setItem(KEYS.HISTORY, history);
  },

  clearAll: () => {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
