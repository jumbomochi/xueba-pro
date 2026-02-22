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
  timeRemainingMs: number | null;
  isComplete: boolean;
}
