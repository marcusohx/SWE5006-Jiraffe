import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateWithPassword } from "@/modules/auth/auth.service";
import { findUserByEmail } from "@/modules/user/user.repository";
import type { UserAuthRecord } from "@/modules/user/user.model";

vi.mock("@/modules/user/user.repository", () => ({
  findUserByEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

function makeUserRecord(overrides: Partial<UserAuthRecord> = {}): UserAuthRecord {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    role: "user",
    passwordHash: "hashed-password",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("auth.service — authenticateWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when user is not found", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const result = await authenticateWithPassword("unknown@example.com", "password123");

    expect(result).toBeNull();
  });

  it("returns null when password is invalid", async () => {
    const user = makeUserRecord();
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);

    const result = await authenticateWithPassword("user@example.com", "wrongpassword");

    expect(result).toBeNull();
  });

  it("returns user record when credentials are valid", async () => {
    const user = makeUserRecord();
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);

    const result = await authenticateWithPassword("user@example.com", "correctpassword");

    expect(result).toEqual(user);
  });

  it("lowercases email before lookup", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    await authenticateWithPassword("USER@EXAMPLE.COM", "password123");

    expect(findUserByEmail).toHaveBeenCalledWith("user@example.com");
  });
});
