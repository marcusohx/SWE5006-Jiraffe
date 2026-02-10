import { describe, expect, it } from "vitest";
import { updateIncidentSchema } from "@/modules/incident/incident.dto";

describe("updateIncidentSchema", () => {
  it("accepts finite boardOrder values", () => {
    const result = updateIncidentSchema.safeParse({ boardOrder: 123.45 });
    expect(result.success).toBe(true);
  });

  it("rejects NaN boardOrder", () => {
    const result = updateIncidentSchema.safeParse({ boardOrder: Number.NaN });
    expect(result.success).toBe(false);
  });

  it("rejects Infinity boardOrder", () => {
    const result = updateIncidentSchema.safeParse({ boardOrder: Number.POSITIVE_INFINITY });
    expect(result.success).toBe(false);
  });

  it("rejects string boardOrder", () => {
    const result = updateIncidentSchema.safeParse({ boardOrder: "100" });
    expect(result.success).toBe(false);
  });
});
