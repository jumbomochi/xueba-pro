import { z } from "zod/v4";

export const QuestionOptionSchema = z.object({
  key: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  certificationId: z.string(),
  domain: z.string(),
  difficulty: z.enum(["associate", "professional"]),
  type: z.enum(["single", "multiple"]),
  stem: z.string(),
  options: z.array(QuestionOptionSchema).min(2),
  correctAnswers: z.array(z.string()).min(1),
  explanation: z.string(),
  tags: z.array(z.string()),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
