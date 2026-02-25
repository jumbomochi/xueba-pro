import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { resolve } from "path";
import { buildSystemPrompt, buildGeneratePrompt } from "./prompts";

// Import types - these scripts run via tsx so we can import from src
import type { Question } from "../src/types/question";
import type { Certification } from "../src/types/certification";

const client = new Anthropic();

const QUESTIONS_PER_DOMAIN = 15;
const DATA_DIR = resolve(__dirname, "../data/questions");

function generateId(certId: string, stem: string): string {
  return createHash("sha256")
    .update(`${certId}:${stem}`)
    .digest("hex")
    .slice(0, 12);
}

async function generateForDomain(
  cert: Certification,
  domainName: string,
  count: number
): Promise<Question[]> {
  const difficulty =
    cert.code.startsWith("SAP") || cert.code.startsWith("DOP") || cert.code.startsWith("AIP")
      ? ("professional" as const)
      : ("associate" as const);

  const systemPrompt = buildSystemPrompt(cert);
  const userPrompt = buildGeneratePrompt(
    domainName,
    count,
    difficulty,
    "single"
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed: unknown[];
  try {
    parsed = JSON.parse(text);
  } catch {
    console.warn(`Failed to parse response for ${domainName}. Skipping.`);
    return [];
  }

  const questions: Question[] = [];

  for (const raw of parsed) {
    const r = raw as Record<string, unknown>;
    const q: Question = {
      id: generateId(cert.id, r.stem as string),
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

async function main() {
  const certifications: Certification[] = JSON.parse(
    readFileSync(resolve(__dirname, "../data/certifications.json"), "utf-8")
  );

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const cert of certifications) {
    console.log(`\nGenerating questions for ${cert.name}...`);
    const filePath = resolve(DATA_DIR, `${cert.id}.json`);

    let existing: Question[] = [];
    if (existsSync(filePath)) {
      existing = JSON.parse(readFileSync(filePath, "utf-8"));
    }
    const existingIds = new Set(existing.map((q) => q.id));

    const newQuestions: Question[] = [];

    for (const domain of cert.domains) {
      const count = Math.max(
        1,
        Math.round(
          (domain.weight / 100) * QUESTIONS_PER_DOMAIN * cert.domains.length
        )
      );
      console.log(`  ${domain.name}: generating ${count} questions...`);

      const generated = await generateForDomain(cert, domain.name, count);
      const unique = generated.filter((q) => !existingIds.has(q.id));
      newQuestions.push(...unique);
      unique.forEach((q) => existingIds.add(q.id));
    }

    const allQuestions = [...existing, ...newQuestions];
    writeFileSync(filePath, JSON.stringify(allQuestions, null, 2));
    console.log(
      `  Wrote ${allQuestions.length} total questions (${newQuestions.length} new)`
    );
  }
}

main().catch(console.error);
