import { describe, expect, it } from "vitest";
import { createIncidentSchema, updateIncidentSchema } from "@/modules/incident/incident.dto";

describe("createIncidentSchema", () => {
  it("requires numeric teamId", () => {
    const result = createIncidentSchema.safeParse({
      teamId: 2,
      title: "Test",
      description: "Description",
      severity: "Low",
      assignedBy: "u1",
      assignedTo: "u2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing teamId", () => {
    const result = createIncidentSchema.safeParse({
      title: "Test",
      description: "Description",
      severity: "Low",
      assignedBy: "u1",
      assignedTo: "u2",
    });
    expect(result.success).toBe(false);
  });
});

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
