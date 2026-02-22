import Anthropic from "@anthropic-ai/sdk";
import type { Question } from "@/types/question";
import type { Certification } from "@/types/certification";
import { storage } from "./storage";

export class QuestionGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionGenerationError";
  }
}

export async function generateQuestionsOnDemand(
  cert: Certification,
  domainName: string,
  count: number = 5
): Promise<Question[]> {
  const apiKey = storage.getApiKey();
  if (!apiKey) {
    throw new QuestionGenerationError(
      "No API key configured. Add your Claude API key in Settings."
    );
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const difficulty =
    cert.code.startsWith("SAP") || cert.code.startsWith("DOP")
      ? "professional"
      : "associate";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: `You are an expert AWS certification exam question writer for the ${cert.name} (${cert.code}) exam.`,
    messages: [
      {
        role: "user",
        content: `Generate ${count} ${difficulty}-level single-answer exam questions for the domain: "${domainName}".

Return ONLY a JSON array where each object has: domain, difficulty, type ("single"), stem, options (array of {key, text}), correctAnswers (array), explanation, tags (array).`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed: unknown[];
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new QuestionGenerationError("Failed to parse AI response as JSON.");
  }

  const questions: Question[] = [];

  for (const raw of parsed) {
    const r = raw as Record<string, unknown>;
    const q: Question = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      certificationId: cert.id,
      domain: r.domain as string,
      difficulty: r.difficulty as "associate" | "professional",
      type: r.type as "single" | "multiple",
      stem: r.stem as string,
      options: r.options as { key: string; text: string }[],
      correctAnswers: r.correctAnswers as string[],
      explanation: r.explanation as string,
      tags: (r.tags as string[]) || [],
    };
    questions.push(q);
  }

  return questions;
}
