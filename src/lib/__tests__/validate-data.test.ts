import { describe, it, expect } from "vitest";
import { CertificationSchema } from "@/types/certification";
import certifications from "../../../data/certifications.json";

describe("certifications.json", () => {
  it("contains at least one certification", () => {
    expect(certifications.length).toBeGreaterThan(0);
  });

  it("each certification has valid schema", () => {
    for (const cert of certifications) {
      expect(() => CertificationSchema.parse(cert)).not.toThrow();
    }
  });

  it("domain weights sum to 100 for each certification", () => {
    for (const cert of certifications) {
      const totalWeight = cert.domains.reduce((sum, d) => sum + d.weight, 0);
      expect(totalWeight).toBe(100);
    }
  });
});
