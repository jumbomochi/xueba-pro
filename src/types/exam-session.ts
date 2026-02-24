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

export interface PracticeCheckpoint {
  certificationId: string;
  questionIds: string[];
  answers: UserAnswer[];
  currentIndex: number;
  selectedDomains: string[];
  startedAt: number;
  savedAt: number;
}

export interface WrongAnswerSet {
  certificationId: string;
  wrongQuestionIds: string[];
  wrongAnswers: UserAnswer[];
  savedAt: number;
}
