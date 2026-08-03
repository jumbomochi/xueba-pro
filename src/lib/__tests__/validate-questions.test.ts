import { describe, it, expect } from "vitest";
import { QuestionSchema } from "@/types/question";
import awsSap from "../../../data/questions/aws-sap.json";
import awsSaa from "../../../data/questions/aws-saa.json";
import awsDevops from "../../../data/questions/aws-devops.json";
import awsAip from "../../../data/questions/aws-aip.json";
import awsAns from "../../../data/questions/aws-ans.json";

const banks = [
  { name: "aws-sap", questions: awsSap },
  { name: "aws-saa", questions: awsSaa },
  { name: "aws-devops", questions: awsDevops },
  { name: "aws-aip", questions: awsAip },
  { name: "aws-ans", questions: awsAns },
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
