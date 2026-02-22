import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "@/lib/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  it("stores and retrieves API key", () => {
    storage.setApiKey("sk-test-123");
    expect(storage.getApiKey()).toBe("sk-test-123");
  });

  it("returns null for missing API key", () => {
    expect(storage.getApiKey()).toBeNull();
  });

  it("clears API key", () => {
    storage.setApiKey("sk-test-123");
    storage.clearApiKey();
    expect(storage.getApiKey()).toBeNull();
  });

  it("stores and retrieves exam history", () => {
    const entry = {
      certificationId: "aws-sap",
      date: Date.now(),
      score: 80,
      mode: "mock" as const,
      totalQuestions: 75,
    };
    storage.addHistoryEntry(entry);
    const history = storage.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(entry);
  });

  it("clears all data", () => {
    storage.setApiKey("sk-test");
    storage.addHistoryEntry({
      certificationId: "aws-sap",
      date: Date.now(),
      score: 80,
      mode: "mock",
      totalQuestions: 75,
    });
    storage.clearAll();
    expect(storage.getApiKey()).toBeNull();
    expect(storage.getHistory()).toEqual([]);
  });
});
