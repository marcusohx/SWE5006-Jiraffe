import { describe, expect, it } from "vitest";
import { credentialsSchema, parseCredentials } from "@/modules/auth/auth.dto";

describe("credentialsSchema", () => {
  it("accepts valid email and password", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "securepassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = credentialsSchema.safeParse({
      password: "securepassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts password of exactly 8 characters", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "exactly8",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = credentialsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("parseCredentials", () => {
  it("returns parsed credentials for valid input", () => {
    const result = parseCredentials({ email: "user@example.com", password: "password123" });
    expect(result.email).toBe("user@example.com");
    expect(result.password).toBe("password123");
  });

  it("throws for invalid email", () => {
    expect(() => parseCredentials({ email: "bad-email", password: "password123" })).toThrow();
  });

  it("throws for short password", () => {
    expect(() => parseCredentials({ email: "user@example.com", password: "short" })).toThrow();
  });

  it("throws for missing fields", () => {
    expect(() => parseCredentials({})).toThrow();
  });
});
