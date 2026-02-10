import { describe, expect, it } from "vitest";
import { computeBoardOrderForInsert } from "@/lib/board-order";

describe("computeBoardOrderForInsert", () => {
  it("returns fallback order for empty columns", () => {
    expect(computeBoardOrderForInsert([], 0, 12345)).toBe(12345);
  });

  it("returns order above the first item when inserted at top", () => {
    expect(computeBoardOrderForInsert([2000, 3000], 0, 9999)).toBe(976);
  });

  it("returns order below the last item when inserted at bottom", () => {
    expect(computeBoardOrderForInsert([2000, 3000], 2, 9999)).toBe(4024);
  });

  it("returns midpoint order when inserted in the middle", () => {
    expect(computeBoardOrderForInsert([1000, 3000], 1, 9999)).toBe(2000);
  });
});
