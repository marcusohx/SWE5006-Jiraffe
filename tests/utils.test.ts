import { describe, expect, it } from "vitest";
import { capitalizeName, formatDisplayDate, formatIncidentCode, includesIgnoreCase } from "@/lib/utils";

describe("capitalizeName", () => {
  it("capitalizes a single word", () => {
    expect(capitalizeName("alice")).toBe("Alice");
  });

  it("capitalizes multiple words", () => {
    expect(capitalizeName("john doe smith")).toBe("John Doe Smith");
  });

  it("lowercases the rest of each word", () => {
    expect(capitalizeName("ALICE BOB")).toBe("Alice Bob");
  });

  it("returns empty string for blank input", () => {
    expect(capitalizeName("")).toBe("");
    expect(capitalizeName("   ")).toBe("");
  });

  it("trims leading and trailing whitespace", () => {
    expect(capitalizeName("  alice  ")).toBe("Alice");
  });

  it("collapses internal whitespace between words", () => {
    expect(capitalizeName("alice   bob")).toBe("Alice Bob");
  });
});

describe("formatDisplayDate", () => {
  it("formats a Date object in DD/MM/YYYY", () => {
    const date = new Date("2026-03-15T00:00:00.000Z");
    expect(formatDisplayDate(date)).toBe("15/03/2026");
  });

  it("formats an ISO string in DD/MM/YYYY", () => {
    expect(formatDisplayDate("2026-01-05T00:00:00.000Z")).toBe("05/01/2026");
  });

  it("handles end-of-year dates correctly", () => {
    expect(formatDisplayDate("2025-12-31T00:00:00.000Z")).toBe("31/12/2025");
  });
});

describe("formatIncidentCode", () => {
  it("pads single-digit ids to JIR-001", () => {
    expect(formatIncidentCode(1)).toBe("JIR-001");
  });

  it("pads double-digit ids to JIR-042", () => {
    expect(formatIncidentCode(42)).toBe("JIR-042");
  });

  it("formats three-digit ids without extra padding", () => {
    expect(formatIncidentCode(123)).toBe("JIR-123");
  });

  it("formats large ids without truncation", () => {
    expect(formatIncidentCode(1000)).toBe("JIR-1000");
  });

  it("truncates fractional part", () => {
    expect(formatIncidentCode(7.9)).toBe("JIR-007");
  });

  it("treats NaN as zero", () => {
    expect(formatIncidentCode(Number.NaN)).toBe("JIR-000");
  });

  it("treats Infinity as zero", () => {
    expect(formatIncidentCode(Number.POSITIVE_INFINITY)).toBe("JIR-000");
  });

  it("clamps negative numbers to zero", () => {
    expect(formatIncidentCode(-5)).toBe("JIR-000");
  });
});

describe("includesIgnoreCase", () => {
  it("returns true when value contains query (same case)", () => {
    expect(includesIgnoreCase("hello world", "world")).toBe(true);
  });

  it("returns true when value contains query (different case)", () => {
    expect(includesIgnoreCase("Hello World", "world")).toBe(true);
  });

  it("returns false when value does not contain query", () => {
    expect(includesIgnoreCase("hello world", "xyz")).toBe(false);
  });

  it("returns true for empty query string", () => {
    expect(includesIgnoreCase("hello", "")).toBe(true);
  });
});
