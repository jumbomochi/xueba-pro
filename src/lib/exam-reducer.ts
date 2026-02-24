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
  | {
      type: "RESUME_EXAM";
      payload: {
        certificationId: string;
        questions: Question[];
        answers: UserAnswer[];
        currentIndex: number;
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

    case "RESUME_EXAM":
      return {
        certificationId: action.payload.certificationId,
        mode: "practice",
        questions: action.payload.questions,
        currentIndex: action.payload.currentIndex,
        answers: action.payload.answers,
        startedAt: Date.now(),
        timeRemainingMs: null,
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
