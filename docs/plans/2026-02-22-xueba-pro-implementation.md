# xueba-pro Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered practice exam generator for AWS certifications with practice mode and timed mock exams.

**Architecture:** Next.js 14+ App Router static site. Pre-generated question bank in JSON files + on-demand Claude API generation from the browser. React Context + useReducer for session state, localStorage for persistence. No backend server.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Vitest, React Testing Library, Playwright, Anthropic JS SDK

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Expected: Project scaffolded with App Router, TypeScript, Tailwind

**Step 2: Install additional dependencies**

Run:
```bash
npm install @anthropic-ai/sdk zod lucide-react recharts
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

**Step 3: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```
Expected: `components.json` created, shadcn/ui configured

**Step 4: Add commonly used shadcn components**

Run:
```bash
npx shadcn@latest add button card badge progress radio-group checkbox label tabs dialog input textarea separator
```

**Step 5: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 6: Configure Playwright**

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

**Step 7: Add scripts to package.json**

Add to `package.json` scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "generate": "npx tsx scripts/generate-questions.ts"
}
```

**Step 8: Update next.config.ts for static export**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, shadcn/ui, Vitest, Playwright"
```

---

### Task 2: TypeScript Types and Certification Data

**Files:**
- Create: `src/types/question.ts`, `src/types/certification.ts`, `src/types/exam-session.ts`, `data/certifications.json`
- Test: `src/lib/__tests__/validate-data.test.ts`

**Step 1: Write the failing test for data validation**

Create `src/lib/__tests__/validate-data.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { QuestionSchema, CertificationSchema } from "@/types/question";
import certifications from "../../../data/certifications.json";

describe("certifications.json", () => {
  it("contains at least one certification", () => {
    expect(certifications.length).toBeGreaterThan(0);
  });

  it("each certification has valid schema", () => {
    for (const cert of certifications) {
      expect(() => CertificationSchema.parse(cert)).not.toThrow();
    }
  });

  it("domain weights sum to 100 for each certification", () => {
    for (const cert of certifications) {
      const totalWeight = cert.domains.reduce((sum, d) => sum + d.weight, 0);
      expect(totalWeight).toBe(100);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/validate-data.test.ts`
Expected: FAIL — modules don't exist yet

**Step 3: Create type definitions with Zod schemas**

Create `src/types/question.ts`:
```typescript
import { z } from "zod";

export const QuestionOptionSchema = z.object({
  key: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  certificationId: z.string(),
  domain: z.string(),
  difficulty: z.enum(["associate", "professional"]),
  type: z.enum(["single", "multiple"]),
  stem: z.string(),
  options: z.array(QuestionOptionSchema).min(2),
  correctAnswers: z.array(z.string()).min(1),
  explanation: z.string(),
  tags: z.array(z.string()),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
```

Create `src/types/certification.ts`:
```typescript
import { z } from "zod";

export const DomainSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(100),
});

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  domains: z.array(DomainSchema).min(1),
  totalQuestions: z.number().positive(),
  timeMinutes: z.number().positive(),
  passingScore: z.number().positive(),
});

export type Certification = z.infer<typeof CertificationSchema>;
export type Domain = z.infer<typeof DomainSchema>;
```

Create `src/types/exam-session.ts`:
```typescript
import type { Question } from "./question";

export type ExamMode = "practice" | "mock";

export interface UserAnswer {
  questionId: string;
  selectedAnswers: string[];
  isCorrect: boolean;
  timeSpentMs: number;
}

export interface ExamSession {
  certificationId: string;
  mode: ExamMode;
  questions: Question[];
  currentIndex: number;
  answers: UserAnswer[];
  startedAt: number;
  timeRemainingMs: number | null; // null for practice mode
  isComplete: boolean;
}
```

**Step 4: Create certification data**

Create `data/certifications.json`:
```json
[
  {
    "id": "aws-sap",
    "name": "AWS Certified Solutions Architect - Professional",
    "code": "SAP-C02",
    "domains": [
      { "name": "Design Solutions for Organizational Complexity", "weight": 26 },
      { "name": "Design for New Solutions", "weight": 29 },
      { "name": "Continuous Improvement for Existing Solutions", "weight": 25 },
      { "name": "Accelerate Workload Migration and Modernization", "weight": 20 }
    ],
    "totalQuestions": 75,
    "timeMinutes": 180,
    "passingScore": 750
  },
  {
    "id": "aws-saa",
    "name": "AWS Certified Solutions Architect - Associate",
    "code": "SAA-C03",
    "domains": [
      { "name": "Design Secure Architectures", "weight": 30 },
      { "name": "Design Resilient Architectures", "weight": 26 },
      { "name": "Design High-Performing Architectures", "weight": 24 },
      { "name": "Design Cost-Optimized Architectures", "weight": 20 }
    ],
    "totalQuestions": 65,
    "timeMinutes": 130,
    "passingScore": 720
  },
  {
    "id": "aws-devops",
    "name": "AWS Certified DevOps Engineer - Professional",
    "code": "DOP-C02",
    "domains": [
      { "name": "SDLC Automation", "weight": 22 },
      { "name": "Configuration Management and IaC", "weight": 17 },
      { "name": "Resilient Cloud Solutions", "weight": 15 },
      { "name": "Monitoring and Logging", "weight": 15 },
      { "name": "Incident and Event Response", "weight": 14 },
      { "name": "Security and Compliance", "weight": 17 }
    ],
    "totalQuestions": 75,
    "timeMinutes": 180,
    "passingScore": 750
  }
]
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/validate-data.test.ts`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add src/types/ data/certifications.json src/lib/__tests__/validate-data.test.ts
git commit -m "feat: add TypeScript types, Zod schemas, and certification data"
```

---

### Task 3: Core Business Logic — Scoring and Question Selection

**Files:**
- Create: `src/lib/scoring.ts`, `src/lib/questions.ts`
- Test: `src/lib/__tests__/scoring.test.ts`, `src/lib/__tests__/questions.test.ts`

**Step 1: Write failing tests for scoring**

Create `src/lib/__tests__/scoring.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { calculateScore, calculateDomainScores, isPassing } from "@/lib/scoring";
import type { UserAnswer } from "@/types/exam-session";
import type { Question } from "@/types/question";

const makeAnswer = (id: string, correct: boolean): UserAnswer => ({
  questionId: id,
  selectedAnswers: [],
  isCorrect: correct,
  timeSpentMs: 5000,
});

const makeQuestion = (id: string, domain: string): Question => ({
  id,
  certificationId: "aws-sap",
  domain,
  difficulty: "professional",
  type: "single",
  stem: "Test?",
  options: [{ key: "A", text: "Yes" }, { key: "B", text: "No" }],
  correctAnswers: ["A"],
  explanation: "Because.",
  tags: [],
});

describe("calculateScore", () => {
  it("returns 0 for no answers", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("returns percentage of correct answers", () => {
    const answers = [
      makeAnswer("1", true),
      makeAnswer("2", true),
      makeAnswer("3", false),
      makeAnswer("4", true),
    ];
    expect(calculateScore(answers)).toBe(75);
  });
});

describe("calculateDomainScores", () => {
  it("groups scores by domain", () => {
    const questions = [
      makeQuestion("1", "Domain A"),
      makeQuestion("2", "Domain A"),
      makeQuestion("3", "Domain B"),
    ];
    const answers = [
      makeAnswer("1", true),
      makeAnswer("2", false),
      makeAnswer("3", true),
    ];
    const result = calculateDomainScores(questions, answers);
    expect(result).toEqual({
      "Domain A": { correct: 1, total: 2, percentage: 50 },
      "Domain B": { correct: 1, total: 1, percentage: 100 },
    });
  });
});

describe("isPassing", () => {
  it("returns true when score meets passing threshold", () => {
    expect(isPassing(80, 750)).toBe(true);
  });

  it("returns false when score is below threshold", () => {
    expect(isPassing(60, 750)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/scoring.test.ts`
Expected: FAIL

**Step 3: Implement scoring logic**

Create `src/lib/scoring.ts`:
```typescript
import type { UserAnswer } from "@/types/exam-session";
import type { Question } from "@/types/question";

export function calculateScore(answers: UserAnswer[]): number {
  if (answers.length === 0) return 0;
  const correct = answers.filter((a) => a.isCorrect).length;
  return Math.round((correct / answers.length) * 100);
}

export interface DomainScore {
  correct: number;
  total: number;
  percentage: number;
}

export function calculateDomainScores(
  questions: Question[],
  answers: UserAnswer[]
): Record<string, DomainScore> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const domains: Record<string, DomainScore> = {};

  for (const q of questions) {
    if (!domains[q.domain]) {
      domains[q.domain] = { correct: 0, total: 0, percentage: 0 };
    }
    domains[q.domain].total++;
    const answer = answerMap.get(q.id);
    if (answer?.isCorrect) {
      domains[q.domain].correct++;
    }
  }

  for (const domain of Object.values(domains)) {
    domain.percentage = domain.total > 0
      ? Math.round((domain.correct / domain.total) * 100)
      : 0;
  }

  return domains;
}

// AWS uses a scaled score of 100-1000. We approximate:
// passingScore 750 ≈ ~72% correct on a 1000-point scale
export function isPassing(percentCorrect: number, passingScore: number): boolean {
  const scaledScore = 100 + (percentCorrect / 100) * 900;
  return scaledScore >= passingScore;
}
```

**Step 4: Run scoring tests**

Run: `npx vitest run src/lib/__tests__/scoring.test.ts`
Expected: PASS

**Step 5: Write failing tests for question selection**

Create `src/lib/__tests__/questions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { shuffleArray, selectQuestionsByDomain, checkAnswer } from "@/lib/questions";
import type { Question } from "@/types/question";
import type { Domain } from "@/types/certification";

const makeQ = (id: string, domain: string): Question => ({
  id,
  certificationId: "aws-sap",
  domain,
  difficulty: "professional",
  type: "single",
  stem: `Q${id}`,
  options: [{ key: "A", text: "Yes" }, { key: "B", text: "No" }],
  correctAnswers: ["A"],
  explanation: "Because.",
  tags: [],
});

describe("shuffleArray", () => {
  it("returns array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it("contains same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate original array", () => {
    const arr = [1, 2, 3];
    shuffleArray(arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe("selectQuestionsByDomain", () => {
  it("selects questions proportional to domain weights", () => {
    const questions = [
      ...Array.from({ length: 20 }, (_, i) => makeQ(`a${i}`, "Domain A")),
      ...Array.from({ length: 20 }, (_, i) => makeQ(`b${i}`, "Domain B")),
    ];
    const domains: Domain[] = [
      { name: "Domain A", weight: 60 },
      { name: "Domain B", weight: 40 },
    ];
    const selected = selectQuestionsByDomain(questions, domains, 10);
    const domainACounts = selected.filter((q) => q.domain === "Domain A").length;
    const domainBCounts = selected.filter((q) => q.domain === "Domain B").length;
    expect(selected).toHaveLength(10);
    expect(domainACounts).toBe(6);
    expect(domainBCounts).toBe(4);
  });
});

describe("checkAnswer", () => {
  it("returns true for correct single answer", () => {
    expect(checkAnswer(["A"], ["A"])).toBe(true);
  });

  it("returns false for wrong single answer", () => {
    expect(checkAnswer(["A"], ["B"])).toBe(false);
  });

  it("returns true for correct multi-select (order independent)", () => {
    expect(checkAnswer(["A", "C"], ["C", "A"])).toBe(true);
  });

  it("returns false for partial multi-select", () => {
    expect(checkAnswer(["A", "C"], ["A"])).toBe(false);
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/questions.test.ts`
Expected: FAIL

**Step 7: Implement question utilities**

Create `src/lib/questions.ts`:
```typescript
import type { Question } from "@/types/question";
import type { Domain } from "@/types/certification";

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectQuestionsByDomain(
  questions: Question[],
  domains: Domain[],
  totalCount: number
): Question[] {
  const selected: Question[] = [];
  const byDomain = new Map<string, Question[]>();

  for (const q of questions) {
    const existing = byDomain.get(q.domain) || [];
    existing.push(q);
    byDomain.set(q.domain, existing);
  }

  let remaining = totalCount;
  const domainCounts: { name: string; count: number }[] = [];

  for (const domain of domains) {
    const count = Math.round((domain.weight / 100) * totalCount);
    domainCounts.push({ name: domain.name, count });
    remaining -= count;
  }

  // Distribute rounding remainder to the largest domain
  if (remaining !== 0) {
    domainCounts.sort((a, b) => b.count - a.count);
    domainCounts[0].count += remaining;
  }

  for (const { name, count } of domainCounts) {
    const pool = shuffleArray(byDomain.get(name) || []);
    selected.push(...pool.slice(0, count));
  }

  return shuffleArray(selected);
}

export function checkAnswer(
  correctAnswers: string[],
  selectedAnswers: string[]
): boolean {
  if (correctAnswers.length !== selectedAnswers.length) return false;
  const sorted1 = [...correctAnswers].sort();
  const sorted2 = [...selectedAnswers].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}
```

**Step 8: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add src/lib/ src/test/
git commit -m "feat: add scoring logic, question selection, and answer checking with tests"
```

---

### Task 4: localStorage Persistence Layer

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/__tests__/storage.test.ts`

**Step 1: Write failing tests**

Create `src/lib/__tests__/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "@/lib/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  it("stores and retrieves API key", () => {
    storage.setApiKey("sk-test-123");
    expect(storage.getApiKey()).toBe("sk-test-123");
  });

  it("returns null for missing API key", () => {
    expect(storage.getApiKey()).toBeNull();
  });

  it("clears API key", () => {
    storage.setApiKey("sk-test-123");
    storage.clearApiKey();
    expect(storage.getApiKey()).toBeNull();
  });

  it("stores and retrieves exam history", () => {
    const entry = {
      certificationId: "aws-sap",
      date: Date.now(),
      score: 80,
      mode: "mock" as const,
      totalQuestions: 75,
    };
    storage.addHistoryEntry(entry);
    const history = storage.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(entry);
  });

  it("clears all data", () => {
    storage.setApiKey("sk-test");
    storage.addHistoryEntry({
      certificationId: "aws-sap",
      date: Date.now(),
      score: 80,
      mode: "mock",
      totalQuestions: 75,
    });
    storage.clearAll();
    expect(storage.getApiKey()).toBeNull();
    expect(storage.getHistory()).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/storage.test.ts`
Expected: FAIL

**Step 3: Implement storage module**

Create `src/lib/storage.ts`:
```typescript
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
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/storage.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/__tests__/storage.test.ts
git commit -m "feat: add localStorage persistence layer with tests"
```

---

### Task 5: Exam Session Context and Reducer

**Files:**
- Create: `src/contexts/exam-context.tsx`, `src/lib/exam-reducer.ts`
- Test: `src/lib/__tests__/exam-reducer.test.ts`

**Step 1: Write failing tests for the reducer**

Create `src/lib/__tests__/exam-reducer.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { examReducer, initialExamState, ExamAction } from "@/lib/exam-reducer";
import type { Question } from "@/types/question";

const sampleQuestions: Question[] = [
  {
    id: "q1",
    certificationId: "aws-sap",
    domain: "Domain A",
    difficulty: "professional",
    type: "single",
    stem: "What is the best approach?",
    options: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
    ],
    correctAnswers: ["A"],
    explanation: "A is correct because...",
    tags: ["vpc"],
  },
  {
    id: "q2",
    certificationId: "aws-sap",
    domain: "Domain B",
    difficulty: "professional",
    type: "multiple",
    stem: "Select two answers.",
    options: [
      { key: "A", text: "A" },
      { key: "B", text: "B" },
      { key: "C", text: "C" },
    ],
    correctAnswers: ["A", "C"],
    explanation: "A and C are correct.",
    tags: [],
  },
];

describe("examReducer", () => {
  it("START_EXAM sets up session", () => {
    const state = examReducer(initialExamState, {
      type: "START_EXAM",
      payload: {
        certificationId: "aws-sap",
        mode: "mock",
        questions: sampleQuestions,
        timeLimitMs: 180 * 60 * 1000,
      },
    });
    expect(state.certificationId).toBe("aws-sap");
    expect(state.mode).toBe("mock");
    expect(state.questions).toHaveLength(2);
    expect(state.currentIndex).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.timeRemainingMs).toBe(180 * 60 * 1000);
  });

  it("ANSWER_QUESTION records answer and advances in practice mode", () => {
    let state = examReducer(initialExamState, {
      type: "START_EXAM",
      payload: {
        certificationId: "aws-sap",
        mode: "practice",
        questions: sampleQuestions,
        timeLimitMs: null,
      },
    });
    state = examReducer(state, {
      type: "ANSWER_QUESTION",
      payload: { selectedAnswers: ["A"] },
    });
    expect(state.answers).toHaveLength(1);
    expect(state.answers[0].isCorrect).toBe(true);
  });

  it("NEXT_QUESTION advances index", () => {
    let state = examReducer(initialExamState, {
      type: "START_EXAM",
      payload: {
        certificationId: "aws-sap",
        mode: "practice",
        questions: sampleQuestions,
        timeLimitMs: null,
      },
    });
    state = examReducer(state, {
      type: "ANSWER_QUESTION",
      payload: { selectedAnswers: ["A"] },
    });
    state = examReducer(state, { type: "NEXT_QUESTION" });
    expect(state.currentIndex).toBe(1);
  });

  it("FINISH_EXAM marks session complete", () => {
    let state = examReducer(initialExamState, {
      type: "START_EXAM",
      payload: {
        certificationId: "aws-sap",
        mode: "mock",
        questions: sampleQuestions,
        timeLimitMs: 180 * 60 * 1000,
      },
    });
    state = examReducer(state, { type: "FINISH_EXAM" });
    expect(state.isComplete).toBe(true);
  });

  it("TICK_TIMER decrements time remaining", () => {
    let state = examReducer(initialExamState, {
      type: "START_EXAM",
      payload: {
        certificationId: "aws-sap",
        mode: "mock",
        questions: sampleQuestions,
        timeLimitMs: 60000,
      },
    });
    state = examReducer(state, { type: "TICK_TIMER", payload: { deltaMs: 1000 } });
    expect(state.timeRemainingMs).toBe(59000);
  });

  it("TICK_TIMER auto-finishes when time runs out", () => {
    let state = examReducer(initialExamState, {
      type: "START_EXAM",
      payload: {
        certificationId: "aws-sap",
        mode: "mock",
        questions: sampleQuestions,
        timeLimitMs: 500,
      },
    });
    state = examReducer(state, { type: "TICK_TIMER", payload: { deltaMs: 1000 } });
    expect(state.timeRemainingMs).toBe(0);
    expect(state.isComplete).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/exam-reducer.test.ts`
Expected: FAIL

**Step 3: Implement the reducer**

Create `src/lib/exam-reducer.ts`:
```typescript
import type { ExamSession, UserAnswer, ExamMode } from "@/types/exam-session";
import type { Question } from "@/types/question";
import { checkAnswer } from "./questions";

export type ExamAction =
  | {
      type: "START_EXAM";
      payload: {
        certificationId: string;
        mode: ExamMode;
        questions: Question[];
        timeLimitMs: number | null;
      };
    }
  | { type: "ANSWER_QUESTION"; payload: { selectedAnswers: string[] } }
  | { type: "NEXT_QUESTION" }
  | { type: "GO_TO_QUESTION"; payload: { index: number } }
  | { type: "FINISH_EXAM" }
  | { type: "TICK_TIMER"; payload: { deltaMs: number } }
  | { type: "RESET" };

export const initialExamState: ExamSession = {
  certificationId: "",
  mode: "practice",
  questions: [],
  currentIndex: 0,
  answers: [],
  startedAt: 0,
  timeRemainingMs: null,
  isComplete: false,
};

export function examReducer(state: ExamSession, action: ExamAction): ExamSession {
  switch (action.type) {
    case "START_EXAM":
      return {
        certificationId: action.payload.certificationId,
        mode: action.payload.mode,
        questions: action.payload.questions,
        currentIndex: 0,
        answers: [],
        startedAt: Date.now(),
        timeRemainingMs: action.payload.timeLimitMs,
        isComplete: false,
      };

    case "ANSWER_QUESTION": {
      const currentQuestion = state.questions[state.currentIndex];
      if (!currentQuestion) return state;
      const isCorrect = checkAnswer(
        currentQuestion.correctAnswers,
        action.payload.selectedAnswers
      );
      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        selectedAnswers: action.payload.selectedAnswers,
        isCorrect,
        timeSpentMs: 0,
      };
      return {
        ...state,
        answers: [...state.answers, answer],
      };
    }

    case "NEXT_QUESTION":
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      };

    case "GO_TO_QUESTION":
      return {
        ...state,
        currentIndex: Math.max(
          0,
          Math.min(action.payload.index, state.questions.length - 1)
        ),
      };

    case "FINISH_EXAM":
      return { ...state, isComplete: true };

    case "TICK_TIMER": {
      if (state.timeRemainingMs === null) return state;
      const newTime = Math.max(0, state.timeRemainingMs - action.payload.deltaMs);
      return {
        ...state,
        timeRemainingMs: newTime,
        isComplete: newTime === 0 ? true : state.isComplete,
      };
    }

    case "RESET":
      return initialExamState;

    default:
      return state;
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/exam-reducer.test.ts`
Expected: PASS

**Step 5: Create the React Context provider**

Create `src/contexts/exam-context.tsx`:
```typescript
"use client";

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { ExamSession, ExamMode } from "@/types/exam-session";
import type { Question } from "@/types/question";
import { examReducer, initialExamState } from "@/lib/exam-reducer";

interface ExamContextValue {
  state: ExamSession;
  startExam: (
    certificationId: string,
    mode: ExamMode,
    questions: Question[],
    timeLimitMs: number | null
  ) => void;
  answerQuestion: (selectedAnswers: string[]) => void;
  nextQuestion: () => void;
  goToQuestion: (index: number) => void;
  finishExam: () => void;
  reset: () => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(examReducer, initialExamState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer for mock exams
  useEffect(() => {
    if (state.mode === "mock" && !state.isComplete && state.timeRemainingMs !== null && state.startedAt > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK_TIMER", payload: { deltaMs: 1000 } });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.mode, state.isComplete, state.timeRemainingMs, state.startedAt]);

  const startExam = useCallback(
    (certificationId: string, mode: ExamMode, questions: Question[], timeLimitMs: number | null) => {
      dispatch({ type: "START_EXAM", payload: { certificationId, mode, questions, timeLimitMs } });
    },
    []
  );

  const answerQuestion = useCallback((selectedAnswers: string[]) => {
    dispatch({ type: "ANSWER_QUESTION", payload: { selectedAnswers } });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: "NEXT_QUESTION" });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    dispatch({ type: "GO_TO_QUESTION", payload: { index } });
  }, []);

  const finishExam = useCallback(() => {
    dispatch({ type: "FINISH_EXAM" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <ExamContext.Provider
      value={{ state, startExam, answerQuestion, nextQuestion, goToQuestion, finishExam, reset }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
}
```

**Step 6: Commit**

```bash
git add src/lib/exam-reducer.ts src/lib/__tests__/exam-reducer.test.ts src/contexts/
git commit -m "feat: add exam session reducer, context provider, and reducer tests"
```

---

### Task 6: Sample Question Data

**Files:**
- Create: `data/questions/aws-sap.json`, `data/questions/aws-saa.json`, `data/questions/aws-devops.json`
- Test: `src/lib/__tests__/validate-questions.test.ts`

**Step 1: Write failing test for question bank validation**

Create `src/lib/__tests__/validate-questions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { QuestionSchema } from "@/types/question";
import awsSap from "../../../data/questions/aws-sap.json";
import awsSaa from "../../../data/questions/aws-saa.json";
import awsDevops from "../../../data/questions/aws-devops.json";

const banks = [
  { name: "aws-sap", questions: awsSap },
  { name: "aws-saa", questions: awsSaa },
  { name: "aws-devops", questions: awsDevops },
];

describe("question banks", () => {
  for (const bank of banks) {
    describe(bank.name, () => {
      it("has at least 5 questions", () => {
        expect(bank.questions.length).toBeGreaterThanOrEqual(5);
      });

      it("all questions pass schema validation", () => {
        for (const q of bank.questions) {
          expect(() => QuestionSchema.parse(q)).not.toThrow();
        }
      });

      it("has no duplicate IDs", () => {
        const ids = bank.questions.map((q: { id: string }) => q.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it("correct answers reference valid option keys", () => {
        for (const q of bank.questions) {
          const optionKeys = q.options.map((o: { key: string }) => o.key);
          for (const ans of q.correctAnswers) {
            expect(optionKeys).toContain(ans);
          }
        }
      });
    });
  }
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts`
Expected: FAIL — JSON files don't exist

**Step 3: Create seed question files**

Create `data/questions/aws-sap.json` with 5 sample questions covering each domain. Each question must follow the Question schema with realistic SAP-C02 style scenario-based questions.

Create `data/questions/aws-saa.json` with 5 sample questions covering SAA-C03 domains.

Create `data/questions/aws-devops.json` with 5 sample questions covering DOP-C02 domains.

**Note to implementer:** These are seed questions. Use the `npm run generate` script later to expand the bank with AI-generated questions. Each question must have: `id` (unique string), `certificationId`, `domain` (matching a domain name from `data/certifications.json`), `difficulty`, `type`, `stem` (scenario text), `options` (4 options A-D), `correctAnswers`, `explanation`, and `tags`.

**Step 4: Run tests**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add data/questions/ src/lib/__tests__/validate-questions.test.ts
git commit -m "feat: add seed question banks for AWS SAP, SAA, and DevOps certs"
```

---

### Task 7: UI Components — QuestionCard and ExplanationPanel

**Files:**
- Create: `src/components/question-card.tsx`, `src/components/explanation-panel.tsx`
- Test: `src/components/__tests__/question-card.test.tsx`

**Step 1: Write failing component test**

Create `src/components/__tests__/question-card.test.tsx`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard } from "@/components/question-card";
import type { Question } from "@/types/question";

const singleQuestion: Question = {
  id: "q1",
  certificationId: "aws-sap",
  domain: "Domain A",
  difficulty: "professional",
  type: "single",
  stem: "Which service provides managed Kubernetes?",
  options: [
    { key: "A", text: "Amazon ECS" },
    { key: "B", text: "Amazon EKS" },
    { key: "C", text: "AWS Lambda" },
    { key: "D", text: "Amazon EC2" },
  ],
  correctAnswers: ["B"],
  explanation: "EKS is the managed Kubernetes service.",
  tags: ["containers"],
};

describe("QuestionCard", () => {
  it("renders question stem and all options", () => {
    render(
      <QuestionCard
        question={singleQuestion}
        onAnswer={vi.fn()}
        showResult={false}
      />
    );
    expect(screen.getByText(/managed Kubernetes/)).toBeInTheDocument();
    expect(screen.getByText("Amazon ECS")).toBeInTheDocument();
    expect(screen.getByText("Amazon EKS")).toBeInTheDocument();
    expect(screen.getByText("AWS Lambda")).toBeInTheDocument();
    expect(screen.getByText("Amazon EC2")).toBeInTheDocument();
  });

  it("calls onAnswer with selected option for single-select", async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(
      <QuestionCard
        question={singleQuestion}
        onAnswer={onAnswer}
        showResult={false}
      />
    );
    await user.click(screen.getByText("Amazon EKS"));
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(onAnswer).toHaveBeenCalledWith(["B"]);
  });

  it("disables options when showResult is true", () => {
    render(
      <QuestionCard
        question={singleQuestion}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswers={["B"]}
      />
    );
    // Submit button should not be visible when showing result
    expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/question-card.test.tsx`
Expected: FAIL

**Step 3: Implement QuestionCard**

Create `src/components/question-card.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/question";

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedAnswers: string[]) => void;
  showResult: boolean;
  selectedAnswers?: string[];
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({
  question,
  onAnswer,
  showResult,
  selectedAnswers: externalSelected,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>(externalSelected || []);
  const isMultiple = question.type === "multiple";

  const toggleOption = (key: string) => {
    if (showResult) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    } else {
      setSelected([key]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onAnswer(selected);
  };

  const displaySelected = showResult ? (externalSelected || []) : selected;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          {questionNumber && totalQuestions && (
            <Badge variant="outline">
              {questionNumber} / {totalQuestions}
            </Badge>
          )}
          <Badge variant="secondary">{question.domain}</Badge>
          {isMultiple && <Badge>Select multiple</Badge>}
        </div>
        <p className="text-lg font-medium leading-relaxed">{question.stem}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option) => {
          const isSelected = displaySelected.includes(option.key);
          const isCorrect = showResult && question.correctAnswers.includes(option.key);
          const isWrong = showResult && isSelected && !isCorrect;

          return (
            <button
              key={option.key}
              onClick={() => toggleOption(option.key)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-colors",
                "hover:border-primary/50",
                isSelected && !showResult && "border-primary bg-primary/5",
                isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                isWrong && "border-red-500 bg-red-50 dark:bg-red-950",
                !isSelected && !isCorrect && !isWrong && "border-border",
                showResult && "cursor-default"
              )}
            >
              <span className="font-semibold mr-2">{option.key}.</span>
              {option.text}
            </button>
          );
        })}

        {!showResult && (
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full mt-4"
          >
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Implement ExplanationPanel**

Create `src/components/explanation-panel.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface ExplanationPanelProps {
  isCorrect: boolean;
  explanation: string;
  correctAnswers: string[];
}

export function ExplanationPanel({
  isCorrect,
  explanation,
  correctAnswers,
}: ExplanationPanelProps) {
  return (
    <Card className={isCorrect ? "border-green-500" : "border-red-500"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isCorrect ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              Incorrect — correct answer: {correctAnswers.join(", ")}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{explanation}</p>
      </CardContent>
    </Card>
  );
}
```

**Step 5: Run tests**

Run: `npx vitest run src/components/__tests__/question-card.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add QuestionCard and ExplanationPanel components with tests"
```

---

### Task 8: UI Components — ExamTimer and ProgressBar

**Files:**
- Create: `src/components/exam-timer.tsx`, `src/components/progress-bar.tsx`

**Step 1: Implement ExamTimer**

Create `src/components/exam-timer.tsx`:
```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  timeRemainingMs: number;
}

export function ExamTimer({ timeRemainingMs }: ExamTimerProps) {
  const totalSeconds = Math.ceil(timeRemainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isLow = totalSeconds < 300; // under 5 minutes

  const formatted = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-base font-mono px-3 py-1",
        isLow && "border-red-500 text-red-500 animate-pulse"
      )}
    >
      <Clock className="h-4 w-4 mr-1" />
      {formatted}
    </Badge>
  );
}
```

**Step 2: Implement ProgressBar**

Create `src/components/progress-bar.tsx`:
```typescript
import { Progress } from "@/components/ui/progress";

interface ExamProgressBarProps {
  current: number;
  total: number;
}

export function ExamProgressBar({ current, total }: ExamProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <Progress value={percentage} className="flex-1" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/exam-timer.tsx src/components/progress-bar.tsx
git commit -m "feat: add ExamTimer and ProgressBar components"
```

---

### Task 9: UI Component — CertificationCard and DomainChart

**Files:**
- Create: `src/components/certification-card.tsx`, `src/components/domain-chart.tsx`

**Step 1: Implement CertificationCard**

Create `src/components/certification-card.tsx`:
```typescript
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Certification } from "@/types/certification";

interface CertificationCardProps {
  certification: Certification;
}

export function CertificationCard({ certification }: CertificationCardProps) {
  const isProfessional = certification.id.includes("professional") ||
    certification.code.startsWith("SAP") ||
    certification.code.startsWith("DOP");

  return (
    <Link href={`/exam/${certification.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={isProfessional ? "default" : "secondary"}>
              {isProfessional ? "Professional" : "Associate"}
            </Badge>
            <Badge variant="outline">{certification.code}</Badge>
          </div>
          <CardTitle className="text-lg mt-2">{certification.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{certification.totalQuestions} questions &middot; {certification.timeMinutes} min</p>
            <p>{certification.domains.length} domains</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Implement DomainChart**

Create `src/components/domain-chart.tsx`:
```typescript
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DomainScore } from "@/lib/scoring";

interface DomainChartProps {
  domainScores: Record<string, DomainScore>;
}

export function DomainChart({ domainScores }: DomainChartProps) {
  const data = Object.entries(domainScores).map(([name, score]) => ({
    name: name.length > 30 ? name.slice(0, 30) + "..." : name,
    fullName: name,
    score: score.percentage,
    correct: score.correct,
    total: score.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={data.length * 60 + 40}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, _name: string, props) => [
            `${props.payload.correct}/${props.payload.total} (${value}%)`,
            props.payload.fullName,
          ]}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.score >= 70 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/certification-card.tsx src/components/domain-chart.tsx
git commit -m "feat: add CertificationCard and DomainChart components"
```

---

### Task 10: Data Loading Utilities

**Files:**
- Create: `src/lib/data.ts`

**Step 1: Create data loading module**

Create `src/lib/data.ts`:
```typescript
import certifications from "../../data/certifications.json";
import type { Certification } from "@/types/certification";
import type { Question } from "@/types/question";

export function getCertifications(): Certification[] {
  return certifications as Certification[];
}

export function getCertification(id: string): Certification | undefined {
  return getCertifications().find((c) => c.id === id);
}

// Dynamic import for question banks to enable code splitting
const questionImports: Record<string, () => Promise<{ default: Question[] }>> = {
  "aws-sap": () => import("../../data/questions/aws-sap.json") as Promise<{ default: Question[] }>,
  "aws-saa": () => import("../../data/questions/aws-saa.json") as Promise<{ default: Question[] }>,
  "aws-devops": () => import("../../data/questions/aws-devops.json") as Promise<{ default: Question[] }>,
};

export async function getQuestions(certificationId: string): Promise<Question[]> {
  const importer = questionImports[certificationId];
  if (!importer) return [];
  const module = await importer();
  return module.default;
}
```

**Step 2: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: add data loading utilities with code splitting"
```

---

### Task 11: Pages — Home and Layout

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/app/globals.css` (if not already created by shadcn)

**Step 1: Update root layout**

Modify `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ExamProvider } from "@/contexts/exam-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "xueba-pro — AWS Certification Practice Exams",
  description: "AI-powered practice exam generator for AWS professional certifications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ExamProvider>
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" className="text-xl font-bold">xueba-pro</a>
                <a href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
                  Settings
                </a>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </ExamProvider>
      </body>
    </html>
  );
}
```

**Step 2: Implement home page**

Modify `src/app/page.tsx`:
```typescript
import { getCertifications } from "@/lib/data";
import { CertificationCard } from "@/components/certification-card";

export default function HomePage() {
  const certifications = getCertifications();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Practice Exams</h1>
        <p className="text-muted-foreground mt-2">
          Choose a certification to start practicing
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certifications.map((cert) => (
          <CertificationCard key={cert.id} certification={cert} />
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Verify dev server runs**

Run: `npm run dev`
Expected: Home page renders at localhost:3000 with certification cards

**Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: implement home page with certification grid"
```

---

### Task 12: Pages — Exam Dashboard

**Files:**
- Create: `src/app/exam/[certId]/page.tsx`

**Step 1: Implement exam dashboard page**

Create `src/app/exam/[certId]/page.tsx`:
```typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCertification, getCertifications } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default function ExamDashboard({ params }: { params: { certId: string } }) {
  const cert = getCertification(params.certId);
  if (!cert) notFound();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <Badge variant="outline" className="mb-2">{cert.code}</Badge>
        <h1 className="text-2xl font-bold">{cert.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/exam/${cert.id}/practice`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Practice Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Answer questions one at a time with immediate explanations.
                Choose specific domains or practice all.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/exam/${cert.id}/mock`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Mock Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {cert.totalQuestions} questions &middot; {cert.timeMinutes} minutes.
                Simulates the real exam with timer and scoring.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exam Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cert.domains.map((domain) => (
              <div key={domain.name} className="flex justify-between items-center">
                <span className="text-sm">{domain.name}</span>
                <Badge variant="secondary">{domain.weight}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/exam/
git commit -m "feat: add exam dashboard page with mode selection and domain list"
```

---

### Task 13: Pages — Practice Mode

**Files:**
- Create: `src/app/exam/[certId]/practice/page.tsx`

**Step 1: Implement practice page**

Create `src/app/exam/[certId]/practice/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { getQuestions } from "@/lib/data";
import { shuffleArray } from "@/lib/questions";
import { QuestionCard } from "@/components/question-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { ExamProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { checkAnswer } from "@/lib/questions";

export default function PracticePage({ params }: { params: { certId: string } }) {
  const router = useRouter();
  const { state, startExam, answerQuestion, nextQuestion } = useExam();
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [lastSelected, setLastSelected] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const cert = getCertification(params.certId);
      if (!cert) {
        router.push("/");
        return;
      }
      const questions = await getQuestions(params.certId);
      const shuffled = shuffleArray(questions);
      startExam(params.certId, "practice", shuffled, null);
      setLoading(false);
    }
    init();
  }, [params.certId, router, startExam]);

  if (loading || state.questions.length === 0) {
    return <p className="text-center text-muted-foreground">Loading questions...</p>;
  }

  const currentQuestion = state.questions[state.currentIndex];

  const handleAnswer = (selectedAnswers: string[]) => {
    const isCorrect = checkAnswer(currentQuestion.correctAnswers, selectedAnswers);
    setLastAnswerCorrect(isCorrect);
    setLastSelected(selectedAnswers);
    answerQuestion(selectedAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setLastSelected([]);
    if (state.currentIndex < state.questions.length - 1) {
      nextQuestion();
    } else {
      router.push(`/exam/${params.certId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ExamProgressBar
        current={state.currentIndex + 1}
        total={state.questions.length}
      />

      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        showResult={showExplanation}
        selectedAnswers={showExplanation ? lastSelected : undefined}
        questionNumber={state.currentIndex + 1}
        totalQuestions={state.questions.length}
      />

      {showExplanation && (
        <>
          <ExplanationPanel
            isCorrect={lastAnswerCorrect}
            explanation={currentQuestion.explanation}
            correctAnswers={currentQuestion.correctAnswers}
          />
          <Button onClick={handleNext} className="w-full">
            {state.currentIndex < state.questions.length - 1
              ? "Next Question"
              : "Finish Practice"}
          </Button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/exam/
git commit -m "feat: implement practice mode page with question flow and explanations"
```

---

### Task 14: Pages — Mock Exam

**Files:**
- Create: `src/app/exam/[certId]/mock/page.tsx`

**Step 1: Implement mock exam page**

Create `src/app/exam/[certId]/mock/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { getQuestions } from "@/lib/data";
import { selectQuestionsByDomain } from "@/lib/questions";
import { QuestionCard } from "@/components/question-card";
import { ExamTimer } from "@/components/exam-timer";
import { ExamProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";

export default function MockExamPage({ params }: { params: { certId: string } }) {
  const router = useRouter();
  const { state, startExam, answerQuestion, nextQuestion, goToQuestion, finishExam } =
    useExam();
  const [loading, setLoading] = useState(true);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    async function init() {
      const cert = getCertification(params.certId);
      if (!cert) {
        router.push("/");
        return;
      }
      const allQuestions = await getQuestions(params.certId);
      const selected = selectQuestionsByDomain(
        allQuestions,
        cert.domains,
        Math.min(cert.totalQuestions, allQuestions.length)
      );
      startExam(params.certId, "mock", selected, cert.timeMinutes * 60 * 1000);
      setLoading(false);
    }
    init();
  }, [params.certId, router, startExam]);

  // Redirect to results when exam is complete
  useEffect(() => {
    if (state.isComplete && !loading) {
      router.push(`/exam/${params.certId}/mock/results`);
    }
  }, [state.isComplete, loading, params.certId, router]);

  if (loading || state.questions.length === 0) {
    return <p className="text-center text-muted-foreground">Loading exam...</p>;
  }

  const currentQuestion = state.questions[state.currentIndex];
  const isAnswered = state.answers.some(
    (a) => a.questionId === currentQuestion.id
  );

  const handleAnswer = (selectedAnswers: string[]) => {
    answerQuestion(selectedAnswers);
    setHasAnswered(true);
  };

  const handleNext = () => {
    setHasAnswered(false);
    if (state.currentIndex < state.questions.length - 1) {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    setHasAnswered(false);
    if (state.currentIndex > 0) {
      goToQuestion(state.currentIndex - 1);
    }
  };

  const handleFinish = () => {
    finishExam();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <ExamProgressBar
          current={state.answers.length}
          total={state.questions.length}
        />
        {state.timeRemainingMs !== null && (
          <ExamTimer timeRemainingMs={state.timeRemainingMs} />
        )}
      </div>

      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        showResult={false}
        questionNumber={state.currentIndex + 1}
        totalQuestions={state.questions.length}
      />

      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={state.currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {(hasAnswered || isAnswered) &&
            state.currentIndex < state.questions.length - 1 && (
              <Button onClick={handleNext}>Next</Button>
            )}
          {state.answers.length === state.questions.length && (
            <Button variant="default" onClick={handleFinish}>
              Finish Exam
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/exam/
git commit -m "feat: implement mock exam page with timer and question navigation"
```

---

### Task 15: Pages — Mock Exam Results

**Files:**
- Create: `src/app/exam/[certId]/mock/results/page.tsx`

**Step 1: Implement results page**

Create `src/app/exam/[certId]/mock/results/page.tsx`:
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { calculateScore, calculateDomainScores, isPassing } from "@/lib/scoring";
import { DomainChart } from "@/components/domain-chart";
import { QuestionCard } from "@/components/question-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";

export default function MockResultsPage({ params }: { params: { certId: string } }) {
  const router = useRouter();
  const { state, reset } = useExam();

  const cert = getCertification(params.certId);
  const score = calculateScore(state.answers);
  const domainScores = calculateDomainScores(state.questions, state.answers);
  const passing = cert ? isPassing(score, cert.passingScore) : false;

  // Save to history
  useEffect(() => {
    if (state.isComplete && state.answers.length > 0) {
      storage.addHistoryEntry({
        certificationId: params.certId,
        date: Date.now(),
        score,
        mode: "mock",
        totalQuestions: state.questions.length,
      });
    }
  }, [state.isComplete, state.answers.length, params.certId, score, state.questions.length]);

  if (!state.isComplete || state.questions.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">No exam results to display.</p>
        <Button onClick={() => router.push(`/exam/${params.certId}`)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const incorrectQuestions = state.questions.filter((q) => {
    const answer = state.answers.find((a) => a.questionId === q.id);
    return answer && !answer.isCorrect;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Exam Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">{score}%</span>
            <Badge
              variant={passing ? "default" : "destructive"}
              className="text-lg px-3 py-1"
            >
              {passing ? "PASS" : "FAIL"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {state.answers.filter((a) => a.isCorrect).length} correct out of{" "}
            {state.questions.length} questions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <DomainChart domainScores={domainScores} />
        </CardContent>
      </Card>

      {incorrectQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            Review Incorrect Answers ({incorrectQuestions.length})
          </h2>
          {incorrectQuestions.map((q) => {
            const answer = state.answers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className="space-y-3">
                <QuestionCard
                  question={q}
                  onAnswer={() => {}}
                  showResult={true}
                  selectedAnswers={answer?.selectedAnswers}
                />
                <ExplanationPanel
                  isCorrect={false}
                  explanation={q.explanation}
                  correctAnswers={q.correctAnswers}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => { reset(); router.push(`/exam/${params.certId}`); }}>
          Back to Dashboard
        </Button>
        <Button onClick={() => { reset(); router.push(`/exam/${params.certId}/mock`); }}>
          Retake Exam
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/exam/
git commit -m "feat: implement mock exam results page with domain chart and review"
```

---

### Task 16: Pages — Settings

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: Implement settings page**

Create `src/app/settings/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = storage.getApiKey();
    if (key) setApiKey(key);
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      storage.setApiKey(apiKey.trim());
    } else {
      storage.clearApiKey();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAll = () => {
    if (window.confirm("This will clear all your progress, history, and settings. Continue?")) {
      storage.clearAll();
      setApiKey("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Claude API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your Anthropic API key to generate new practice questions on demand.
            Your key is stored locally and only sent directly to Anthropic&apos;s API.
          </p>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </div>
          <Button onClick={handleSaveKey}>
            {saved ? "Saved!" : "Save API Key"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clear all locally stored data including exam history, cached questions, and settings.
          </p>
          <Button variant="destructive" onClick={handleClearAll}>
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/settings/
git commit -m "feat: implement settings page with API key management and data clear"
```

---

### Task 17: Question Generation Script

**Files:**
- Create: `scripts/generate-questions.ts`, `scripts/prompts.ts`

**Step 1: Create prompt templates**

Create `scripts/prompts.ts`:
```typescript
import type { Certification } from "../src/types/certification";

export function buildSystemPrompt(cert: Certification): string {
  return `You are an expert AWS certification exam question writer for the ${cert.name} (${cert.code}) exam.

You create high-quality, scenario-based practice questions that accurately reflect the difficulty and style of the real exam. Each question should:
- Present a realistic scenario with specific requirements
- Have 4 options (A, B, C, D) where distractors are plausible but clearly wrong for specific reasons
- Include a detailed explanation referencing relevant AWS services and best practices
- Be tagged with relevant AWS service/topic tags`;
}

export function buildGeneratePrompt(
  domainName: string,
  count: number,
  difficulty: "associate" | "professional",
  questionType: "single" | "multiple"
): string {
  return `Generate ${count} ${difficulty}-level ${questionType === "multiple" ? "multiple-select" : "single-answer"} exam questions for the domain: "${domainName}".

Each question must be a JSON object with these exact fields:
- "domain": "${domainName}"
- "difficulty": "${difficulty}"
- "type": "${questionType}"
- "stem": The question text (include a realistic scenario for professional-level)
- "options": Array of {"key": "A"|"B"|"C"|"D", "text": "option text"}
- "correctAnswers": Array of correct option keys (e.g., ["B"] or ["A","C"])
- "explanation": Detailed explanation of why the correct answer is right and others are wrong
- "tags": Array of relevant AWS service/topic tags (e.g., ["VPC", "networking"])

Return ONLY a JSON array of question objects. No markdown, no code fences, just the JSON array.`;
}
```

**Step 2: Create generation script**

Create `scripts/generate-questions.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { resolve } from "path";
import { QuestionSchema } from "../src/types/question";
import type { Question } from "../src/types/question";
import type { Certification } from "../src/types/certification";
import { buildSystemPrompt, buildGeneratePrompt } from "./prompts";

const client = new Anthropic();

const QUESTIONS_PER_DOMAIN = 15;
const DATA_DIR = resolve(__dirname, "../data/questions");

function generateId(certId: string, stem: string): string {
  return createHash("sha256")
    .update(`${certId}:${stem}`)
    .digest("hex")
    .slice(0, 12);
}

async function generateForDomain(
  cert: Certification,
  domainName: string,
  count: number
): Promise<Question[]> {
  const difficulty = cert.code.startsWith("SAP") || cert.code.startsWith("DOP")
    ? "professional" as const
    : "associate" as const;

  const systemPrompt = buildSystemPrompt(cert);
  const userPrompt = buildGeneratePrompt(domainName, count, difficulty, "single");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = JSON.parse(text);
  const questions: Question[] = [];

  for (const raw of parsed) {
    const q: Question = {
      id: generateId(cert.id, raw.stem),
      certificationId: cert.id,
      domain: raw.domain,
      difficulty: raw.difficulty,
      type: raw.type,
      stem: raw.stem,
      options: raw.options,
      correctAnswers: raw.correctAnswers,
      explanation: raw.explanation,
      tags: raw.tags,
    };

    // Validate
    const result = QuestionSchema.safeParse(q);
    if (result.success) {
      questions.push(q);
    } else {
      console.warn(`Skipping invalid question: ${result.error.message}`);
    }
  }

  return questions;
}

async function main() {
  const certifications: Certification[] = JSON.parse(
    readFileSync(resolve(__dirname, "../data/certifications.json"), "utf-8")
  );

  for (const cert of certifications) {
    console.log(`\nGenerating questions for ${cert.name}...`);
    const filePath = resolve(DATA_DIR, `${cert.id}.json`);

    let existing: Question[] = [];
    if (existsSync(filePath)) {
      existing = JSON.parse(readFileSync(filePath, "utf-8"));
    }
    const existingIds = new Set(existing.map((q) => q.id));

    const newQuestions: Question[] = [];

    for (const domain of cert.domains) {
      const count = Math.max(
        1,
        Math.round((domain.weight / 100) * QUESTIONS_PER_DOMAIN * cert.domains.length)
      );
      console.log(`  ${domain.name}: generating ${count} questions...`);

      const generated = await generateForDomain(cert, domain.name, count);
      const unique = generated.filter((q) => !existingIds.has(q.id));
      newQuestions.push(...unique);
      unique.forEach((q) => existingIds.add(q.id));
    }

    const allQuestions = [...existing, ...newQuestions];
    writeFileSync(filePath, JSON.stringify(allQuestions, null, 2));
    console.log(
      `  Wrote ${allQuestions.length} total questions (${newQuestions.length} new)`
    );
  }
}

main().catch(console.error);
```

**Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: add question generation script with Claude API and prompt templates"
```

---

### Task 18: On-Demand Client-Side Question Generation

**Files:**
- Create: `src/lib/generate-client.ts`

**Step 1: Implement client-side generation**

Create `src/lib/generate-client.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { QuestionSchema } from "@/types/question";
import type { Question } from "@/types/question";
import type { Certification } from "@/types/certification";
import { storage } from "./storage";

export class QuestionGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionGenerationError";
  }
}

export async function generateQuestionsOnDemand(
  cert: Certification,
  domainName: string,
  count: number = 5
): Promise<Question[]> {
  const apiKey = storage.getApiKey();
  if (!apiKey) {
    throw new QuestionGenerationError(
      "No API key configured. Add your Claude API key in Settings."
    );
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const difficulty =
    cert.code.startsWith("SAP") || cert.code.startsWith("DOP")
      ? "professional"
      : "associate";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: `You are an expert AWS certification exam question writer for the ${cert.name} (${cert.code}) exam.`,
    messages: [
      {
        role: "user",
        content: `Generate ${count} ${difficulty}-level single-answer exam questions for the domain: "${domainName}".

Return ONLY a JSON array where each object has: domain, difficulty, type ("single"), stem, options (array of {key, text}), correctAnswers (array), explanation, tags (array).`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = JSON.parse(text);
  const questions: Question[] = [];

  for (const raw of parsed) {
    const q: Question = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      certificationId: cert.id,
      domain: raw.domain,
      difficulty: raw.difficulty,
      type: raw.type,
      stem: raw.stem,
      options: raw.options,
      correctAnswers: raw.correctAnswers,
      explanation: raw.explanation,
      tags: raw.tags || [],
    };

    const result = QuestionSchema.safeParse(q);
    if (result.success) {
      questions.push(q);
    }
  }

  return questions;
}
```

**Step 2: Commit**

```bash
git add src/lib/generate-client.ts
git commit -m "feat: add client-side on-demand question generation via Claude API"
```

---

### Task 19: E2E Tests

**Files:**
- Create: `e2e/home.spec.ts`, `e2e/practice.spec.ts`

**Step 1: Write E2E test for home page**

Create `e2e/home.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("displays certification cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Practice Exams")).toBeVisible();
    await expect(page.getByText("AWS Certified Solutions Architect - Professional")).toBeVisible();
    await expect(page.getByText("AWS Certified Solutions Architect - Associate")).toBeVisible();
  });

  test("navigates to exam dashboard on card click", async ({ page }) => {
    await page.goto("/");
    await page.getByText("AWS Certified Solutions Architect - Professional").click();
    await expect(page).toHaveURL(/\/exam\/aws-sap/);
    await expect(page.getByText("Practice Mode")).toBeVisible();
    await expect(page.getByText("Mock Exam")).toBeVisible();
  });
});
```

**Step 2: Write E2E test for practice flow**

Create `e2e/practice.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Practice mode", () => {
  test("can answer a question and see explanation", async ({ page }) => {
    await page.goto("/exam/aws-sap/practice");

    // Wait for question to load
    await expect(page.locator("[class*='card']").first()).toBeVisible({ timeout: 5000 });

    // Select first option
    const options = page.locator("button").filter({ hasText: /^[A-D]\./ });
    await options.first().click();

    // Submit answer
    await page.getByRole("button", { name: /submit/i }).click();

    // Should see explanation
    await expect(
      page.getByText(/correct|incorrect/i).first()
    ).toBeVisible();

    // Should see Next button
    await expect(
      page.getByRole("button", { name: /next/i })
    ).toBeVisible();
  });
});
```

**Step 3: Install Playwright browsers**

Run: `npx playwright install chromium`

**Step 4: Run E2E tests (ensure dev server is running)**

Run: `npx playwright test`
Expected: PASS

**Step 5: Commit**

```bash
git add e2e/ playwright.config.ts
git commit -m "feat: add E2E tests for home page and practice mode flow"
```

---

### Task 20: Final Integration and Build Verification

**Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Run build**

Run: `npm run build`
Expected: Static export succeeds, `out/` directory created

**Step 4: Run E2E tests**

Run: `npx playwright test`
Expected: ALL PASS

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification — all tests and build passing"
```
