import certifications from "../../data/certifications.json";
import type { Certification } from "@/types/certification";
import type { Question } from "@/types/question";

export function getCertifications(): Certification[] {
  return certifications as Certification[];
}

export function getCertification(id: string): Certification | undefined {
  return getCertifications().find((c) => c.id === id);
}

const questionImports: Record<string, () => Promise<{ default: Question[] }>> = {
  "aws-sap": () => import("../../data/questions/aws-sap.json") as Promise<{ default: Question[] }>,
  "aws-saa": () => import("../../data/questions/aws-saa.json") as Promise<{ default: Question[] }>,
  "aws-devops": () => import("../../data/questions/aws-devops.json") as Promise<{ default: Question[] }>,
  "aws-aip": () => import("../../data/questions/aws-aip.json") as Promise<{ default: Question[] }>,
};

export async function getQuestions(certificationId: string): Promise<Question[]> {
  const importer = questionImports[certificationId];
  if (!importer) return [];
  const data = await importer();
  return data.default;
}
