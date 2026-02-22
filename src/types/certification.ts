import { z } from "zod/v4";

export const DomainSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(100),
});

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  domains: z.array(DomainSchema).min(1),
  totalQuestions: z.number().positive(),
  timeMinutes: z.number().positive(),
  passingScore: z.number().positive(),
});

export type Certification = z.infer<typeof CertificationSchema>;
export type Domain = z.infer<typeof DomainSchema>;
