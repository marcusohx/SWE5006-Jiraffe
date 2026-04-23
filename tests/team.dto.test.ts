import { describe, expect, it } from "vitest";
import {
  createTeamSchema,
  updateTeamSchema,
  parseCreateTeam,
  parseUpdateTeam,
  parseTeamId,
} from "@/modules/team/team.dto";

describe("createTeamSchema", () => {
  it("accepts valid name", () => {
    const result = createTeamSchema.safeParse({ name: "Engineering" });
    expect(result.success).toBe(true);
  });

  it("accepts name with optional fields", () => {
    const result = createTeamSchema.safeParse({
      name: "Engineering",
      description: "Core engineering team",
      memberIds: ["user-1", "user-2"],
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createTeamSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createTeamSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("defaults memberIds to empty array when not provided", () => {
    const result = createTeamSchema.safeParse({ name: "Engineering" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.memberIds).toEqual([]);
    }
  });

  it("accepts null description", () => {
    const result = createTeamSchema.safeParse({ name: "Engineering", description: null });
    expect(result.success).toBe(true);
  });

  it("rejects memberIds with empty string entries", () => {
    const result = createTeamSchema.safeParse({ name: "Engineering", memberIds: [""] });
    expect(result.success).toBe(false);
  });

  it("accepts isActive as boolean", () => {
    const result = createTeamSchema.safeParse({ name: "Engineering", isActive: false });
    expect(result.success).toBe(true);
  });
});

describe("updateTeamSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateTeamSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts only name", () => {
    const result = updateTeamSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts only description", () => {
    const result = updateTeamSchema.safeParse({ description: "Updated description" });
    expect(result.success).toBe(true);
  });

  it("accepts only memberIds", () => {
    const result = updateTeamSchema.safeParse({ memberIds: ["user-1"] });
    expect(result.success).toBe(true);
  });

  it("accepts only isActive", () => {
    const result = updateTeamSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = updateTeamSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts null description", () => {
    const result = updateTeamSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });
});

describe("parseCreateTeam", () => {
  it("returns parsed input for valid data", () => {
    const result = parseCreateTeam({ name: "Engineering" });
    expect(result.name).toBe("Engineering");
    expect(result.memberIds).toEqual([]);
  });

  it("throws for missing name", () => {
    expect(() => parseCreateTeam({})).toThrow();
  });

  it("throws for empty name", () => {
    expect(() => parseCreateTeam({ name: "" })).toThrow();
  });
});

describe("parseUpdateTeam", () => {
  it("returns parsed input for valid data", () => {
    const result = parseUpdateTeam({ name: "New Name", isActive: false });
    expect(result.name).toBe("New Name");
  });

  it("returns empty object for empty input (all fields optional)", () => {
    const result = parseUpdateTeam({});
    expect(result).toEqual({});
  });

  it("throws for invalid data", () => {
    expect(() => parseUpdateTeam({ name: "" })).toThrow();
  });
});

describe("parseTeamId", () => {
  it("returns the id string for valid input", () => {
    expect(parseTeamId("team-123")).toBe("team-123");
  });

  it("throws for empty string", () => {
    expect(() => parseTeamId("")).toThrow();
  });

  it("throws for non-string", () => {
    expect(() => parseTeamId(null)).toThrow();
  });
});
