import { describe, it, expect } from "vitest";
import { getCertLevel, getQuestionDifficulty } from "@/lib/cert-level";

describe("getCertLevel", () => {
  it("classifies professional codes", () => {
    expect(getCertLevel("SAP-C02")).toBe("professional");
    expect(getCertLevel("DOP-C02")).toBe("professional");
    expect(getCertLevel("AIP-C01")).toBe("professional");
  });

  it("classifies specialty codes", () => {
    expect(getCertLevel("ANS-C01")).toBe("specialty");
  });

  it("defaults to associate", () => {
    expect(getCertLevel("SAA-C03")).toBe("associate");
    expect(getCertLevel("DVA-C02")).toBe("associate");
  });
});

describe("getQuestionDifficulty", () => {
  it("maps professional and specialty to professional difficulty", () => {
    expect(getQuestionDifficulty("SAP-C02")).toBe("professional");
    expect(getQuestionDifficulty("ANS-C01")).toBe("professional");
  });

  it("maps associate to associate difficulty", () => {
    expect(getQuestionDifficulty("SAA-C03")).toBe("associate");
  });
});
