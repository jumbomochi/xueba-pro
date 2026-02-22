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
