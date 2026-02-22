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
