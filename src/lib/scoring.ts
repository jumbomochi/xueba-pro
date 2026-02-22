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
