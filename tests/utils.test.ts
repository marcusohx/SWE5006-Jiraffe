import { describe, expect, it, vi } from "vitest";
import {
  cn,
  capitalizeName,
  formatDisplayDate,
  formatDisplayDateTime,
  formatDurationFromNow,
  formatIncidentCode,
  includesIgnoreCase,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names into a string", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

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

describe("formatDisplayDateTime", () => {
  it("formats a Date object in Singapore time", () => {
    const date = new Date("2026-04-18T17:30:00.000Z");
    expect(formatDisplayDateTime(date)).toBe("19/04/2026, 01:30");
  });

  it("formats an ISO string in Singapore time", () => {
    expect(formatDisplayDateTime("2026-04-18T16:05:00.000Z")).toBe("19/04/2026, 00:05");
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

describe("formatDurationFromNow", () => {
  it("returns future duration with 'in' prefix", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T00:00:00.000Z"));
    expect(formatDurationFromNow("2026-04-24T01:30:00.000Z")).toBe("in 1h 30m");
    vi.useRealTimers();
  });

  it("returns past duration without 'in' prefix", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T02:00:00.000Z"));
    expect(formatDurationFromNow("2026-04-24T00:30:00.000Z")).toBe("1h 30m");
    vi.useRealTimers();
  });

  it("includes day component when duration spans multiple days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T00:00:00.000Z"));
    expect(formatDurationFromNow("2026-04-26T02:30:00.000Z")).toBe("in 2d 2h 30m");
    vi.useRealTimers();
  });

  it("accepts a Date instance as input", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T00:00:00.000Z"));
    expect(formatDurationFromNow(new Date("2026-04-24T00:45:00.000Z"))).toBe("in 45m");
    vi.useRealTimers();
  });

  it("returns '0m' when target equals now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-24T00:00:00.000Z"));
    expect(formatDurationFromNow("2026-04-24T00:00:00.000Z")).toBe("in 0m");
    vi.useRealTimers();
  });
});
