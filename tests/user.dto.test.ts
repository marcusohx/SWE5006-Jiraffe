import { describe, expect, it } from "vitest";
import { createUserSchema } from "@/modules/user/user.dto";

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
