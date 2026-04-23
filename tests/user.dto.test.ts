import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  parseCreateUser,
  parseUpdateUser,
  parseUserId,
} from "@/modules/user/user.dto";

describe("createUserSchema", () => {
  it("accepts valid input", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({
      email: "invalid-email",
      name: "Test User",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });
});

describe("parseCreateUser", () => {
  it("returns parsed input for valid data", () => {
    const result = parseCreateUser({
      email: "user@example.com",
      name: "Test User",
      password: "password123",
    });
    expect(result.email).toBe("user@example.com");
    expect(result.name).toBe("Test User");
  });

  it("throws for invalid email", () => {
    expect(() =>
      parseCreateUser({ email: "bad", name: "User", password: "password123" })
    ).toThrow();
  });

  it("throws for password under 8 characters", () => {
    expect(() =>
      parseCreateUser({ email: "user@example.com", name: "User", password: "short" })
    ).toThrow();
  });

  it("throws for missing required fields", () => {
    expect(() => parseCreateUser({})).toThrow();
  });
});

describe("parseUpdateUser", () => {
  it("returns parsed input for valid data", () => {
    const result = parseUpdateUser({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("returns empty object for empty input (all optional)", () => {
    const result = parseUpdateUser({});
    expect(result).toEqual({});
  });

  it("throws for invalid role", () => {
    expect(() => parseUpdateUser({ role: "superuser" })).toThrow();
  });
});

describe("parseUserId", () => {
  it("returns the id string for valid input", () => {
    expect(parseUserId("user-abc")).toBe("user-abc");
  });

  it("throws for empty string", () => {
    expect(() => parseUserId("")).toThrow();
  });

  it("throws for non-string", () => {
    expect(() => parseUserId(undefined)).toThrow();
  });
});
