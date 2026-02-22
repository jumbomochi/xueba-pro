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
