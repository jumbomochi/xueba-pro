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
    expect(isPassing(60, 75, 750)).toBe(true); // 60/75 = 80% -> scaled 820
  });

  it("returns false when score is below threshold", () => {
    expect(isPassing(45, 75, 750)).toBe(false); // 45/75 = 60% -> scaled 640
  });

  it("returns false for zero total questions", () => {
    expect(isPassing(0, 0, 750)).toBe(false);
  });

  it("handles exact boundary correctly", () => {
    // 750 = 100 + (correct/total) * 900 => correct/total = 650/900 ≈ 0.7222
    // For 75 questions: 54/75 = 0.72 -> scaled 748 (fail), 55/75 = 0.7333 -> scaled 760 (pass)
    expect(isPassing(54, 75, 750)).toBe(false);
    expect(isPassing(55, 75, 750)).toBe(true);
  });
});
