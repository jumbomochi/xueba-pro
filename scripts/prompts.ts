import type { Certification } from "../src/types/certification";

export function buildSystemPrompt(cert: Certification): string {
  return `You are an expert AWS certification exam question writer for the ${cert.name} (${cert.code}) exam.

You create high-quality, scenario-based practice questions that accurately reflect the difficulty and style of the real exam. Each question should:
- Present a realistic scenario with specific requirements
- Have 4 options (A, B, C, D) where distractors are plausible but clearly wrong for specific reasons
- Include a detailed explanation referencing relevant AWS services and best practices
- Be tagged with relevant AWS service/topic tags`;
}

export function buildGeneratePrompt(
  domainName: string,
  count: number,
  difficulty: "associate" | "professional",
  questionType: "single" | "multiple"
): string {
  return `Generate ${count} ${difficulty}-level ${questionType === "multiple" ? "multiple-select" : "single-answer"} exam questions for the domain: "${domainName}".

Each question must be a JSON object with these exact fields:
- "domain": "${domainName}"
- "difficulty": "${difficulty}"
- "type": "${questionType}"
- "stem": The question text (include a realistic scenario for professional-level)
- "options": Array of {"key": "A"|"B"|"C"|"D", "text": "option text"}
- "correctAnswers": Array of correct option keys (e.g., ["B"] or ["A","C"])
- "explanation": Detailed explanation of why the correct answer is right and others are wrong
- "tags": Array of relevant AWS service/topic tags (e.g., ["VPC", "networking"])

Return ONLY a JSON array of question objects. No markdown, no code fences, just the JSON array.`;
}
