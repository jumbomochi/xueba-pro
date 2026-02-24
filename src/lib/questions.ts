import type { Question } from "@/types/question";
import type { Domain } from "@/types/certification";

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectQuestionsByDomain(
  questions: Question[],
  domains: Domain[],
  totalCount: number
): Question[] {
  const selected: Question[] = [];
  const byDomain = new Map<string, Question[]>();

  for (const q of questions) {
    const existing = byDomain.get(q.domain) || [];
    existing.push(q);
    byDomain.set(q.domain, existing);
  }

  let remaining = totalCount;
  const domainCounts: { name: string; count: number }[] = [];

  for (const domain of domains) {
    const count = Math.round((domain.weight / 100) * totalCount);
    domainCounts.push({ name: domain.name, count });
    remaining -= count;
  }

  // Distribute rounding remainder to the largest domain
  if (remaining !== 0) {
    const largest = domainCounts.reduce((max, d) => d.count > max.count ? d : max);
    largest.count += remaining;
  }

  for (const { name, count } of domainCounts) {
    const pool = byDomain.get(name);
    if (!pool || pool.length === 0) {
      throw new Error(`No questions found for domain "${name}"`);
    }
    if (pool.length < count) {
      throw new Error(
        `Domain "${name}" needs ${count} questions but only ${pool.length} are available`
      );
    }
    selected.push(...shuffleArray(pool).slice(0, count));
  }

  return shuffleArray(selected);
}

export function filterByDomains(questions: Question[], domainNames: string[]): Question[] {
  if (domainNames.length === 0) return questions;
  const domainSet = new Set(domainNames);
  return questions.filter((q) => domainSet.has(q.domain));
}

export function countByDomain(questions: Question[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questions) {
    counts[q.domain] = (counts[q.domain] || 0) + 1;
  }
  return counts;
}

export function checkAnswer(
  correctAnswers: string[],
  selectedAnswers: string[]
): boolean {
  if (correctAnswers.length !== selectedAnswers.length) return false;
  const sorted1 = [...correctAnswers].sort();
  const sorted2 = [...selectedAnswers].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}
