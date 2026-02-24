import type { PracticeCheckpoint, WrongAnswerSet } from "@/types/exam-session";

const KEYS = {
  API_KEY: "xueba-api-key",
  HISTORY: "xueba-history",
  PREFERENCES: "xueba-preferences",
  CACHED_QUESTIONS: "xueba-cached-questions",
} as const;

const CHECKPOINT_PREFIX = "xueba-practice-checkpoint:";
const WRONG_ANSWERS_PREFIX = "xueba-wrong-answers:";

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

  getCheckpoint: (certId: string): PracticeCheckpoint | null =>
    getItem<PracticeCheckpoint | null>(`${CHECKPOINT_PREFIX}${certId}`, null),

  saveCheckpoint: (checkpoint: PracticeCheckpoint) => {
    setItem(`${CHECKPOINT_PREFIX}${checkpoint.certificationId}`, checkpoint);
  },

  clearCheckpoint: (certId: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${CHECKPOINT_PREFIX}${certId}`);
  },

  getWrongAnswers: (certId: string): WrongAnswerSet | null =>
    getItem<WrongAnswerSet | null>(`${WRONG_ANSWERS_PREFIX}${certId}`, null),

  saveWrongAnswers: (wrongSet: WrongAnswerSet) => {
    setItem(`${WRONG_ANSWERS_PREFIX}${wrongSet.certificationId}`, wrongSet);
  },

  clearWrongAnswers: (certId: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${WRONG_ANSWERS_PREFIX}${certId}`);
  },

  clearAll: () => {
    if (typeof window === "undefined") return;
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    // Clear dynamic-prefix keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(CHECKPOINT_PREFIX) || key.startsWith(WRONG_ANSWERS_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  },
};
