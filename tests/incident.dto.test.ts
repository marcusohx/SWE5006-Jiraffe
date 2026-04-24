import { describe, expect, it } from "vitest";
import {
  createIncidentSchema,
  updateIncidentSchema,
  parseCreateIncident,
  parseUpdateIncident,
  parseIncidentId,
  parseReassignIncident,
  reassignIncidentSchema,
} from "@/modules/incident/incident.dto";

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

const validCreateInput = {
  teamId: 1,
  title: "Test",
  description: "Desc",
  severity: "High" as const,
  assignedBy: "u1",
  assignedTo: "u2",
};

describe("parseCreateIncident", () => {
  it("returns parsed input for valid data", () => {
    const result = parseCreateIncident(validCreateInput);
    expect(result.title).toBe("Test");
    expect(result.status).toBe("Open");
  });

  it("throws for invalid data", () => {
    expect(() => parseCreateIncident({ teamId: "bad" })).toThrow();
  });
});

describe("parseUpdateIncident", () => {
  it("returns parsed input for valid data", () => {
    const result = parseUpdateIncident({ title: "Updated" });
    expect(result.title).toBe("Updated");
  });

  it("throws for invalid data", () => {
    expect(() => parseUpdateIncident({ severity: "Unknown" })).toThrow();
  });
});

describe("parseIncidentId", () => {
  it("returns the id string for valid input", () => {
    expect(parseIncidentId("abc-123")).toBe("abc-123");
  });

  it("throws for empty string", () => {
    expect(() => parseIncidentId("")).toThrow();
  });

  it("throws for non-string", () => {
    expect(() => parseIncidentId(123)).toThrow();
  });
});

describe("reassignIncidentSchema", () => {
  it("accepts valid assignedTo input", () => {
    const result = reassignIncidentSchema.safeParse({ assignedTo: "u2" });
    expect(result.success).toBe(true);
  });

  it("rejects empty assignedTo", () => {
    const result = reassignIncidentSchema.safeParse({ assignedTo: "" });
    expect(result.success).toBe(false);
  });
});

describe("parseReassignIncident", () => {
  it("returns parsed input for valid data", () => {
    expect(parseReassignIncident({ assignedTo: "u2" })).toEqual({ assignedTo: "u2" });
  });

  it("throws for invalid data", () => {
    expect(() => parseReassignIncident({ assignedTo: "" })).toThrow();
  });
});
