import { describe, it, expect } from "vitest";
import { examReducer, initialExamState } from "@/lib/exam-reducer";
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

  it("ANSWER_QUESTION records answer and marks correctness", () => {
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
