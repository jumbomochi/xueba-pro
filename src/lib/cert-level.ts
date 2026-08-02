export type CertLevel = "associate" | "professional" | "specialty";

const PROFESSIONAL_PREFIXES = ["SAP", "DOP", "AIP"];
const SPECIALTY_PREFIXES = ["ANS"];

export function getCertLevel(code: string): CertLevel {
  if (PROFESSIONAL_PREFIXES.some((p) => code.startsWith(p))) return "professional";
  if (SPECIALTY_PREFIXES.some((p) => code.startsWith(p))) return "specialty";
  return "associate";
}

export function getQuestionDifficulty(code: string): "associate" | "professional" {
  return getCertLevel(code) === "associate" ? "associate" : "professional";
}
