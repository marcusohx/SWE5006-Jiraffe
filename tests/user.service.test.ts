import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http-error";
import type { UserAuthRecord } from "@/modules/user/user.model";
import {
  createUser,
  deleteUserById,
  getUserById,
  registerUser,
  updateUserById,
} from "@/modules/user/user.service";
import {
  createUser as createUserRepo,
  deleteUserById as deleteUserByIdRepo,
  findUserByEmail,
  findUserById,
  updateUserById as updateUserByIdRepo,
} from "@/modules/user/user.repository";

vi.mock("@/modules/user/user.repository", () => ({
  listUsers: vi.fn(),
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  deleteUserById: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
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

describe("user.service - getUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public user when found", async () => {
    const user = makeUserRecord();
    vi.mocked(findUserById).mockResolvedValue(user);

    const result = await getUserById("user-1");

    expect(result.id).toBe("user-1");
    expect(result.email).toBe("user@example.com");
    expect((result as UserAuthRecord).passwordHash).toBeUndefined();
  });

  it("throws when user not found", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(getUserById("nonexistent-id")).rejects.toThrow("User not found");
  });
});

describe("user.service - createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when user already exists", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(makeUserRecord());

    await expect(
      createUser({ email: "user@example.com", name: "Test User", password: "password123" })
    ).rejects.toThrow("User already exists");
  });

  it("hashes password before creating user", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.hash).mockResolvedValue("hashed-password" as never);

    const created = makeUserRecord();
    vi.mocked(createUserRepo).mockResolvedValue(created);

    await createUser({ email: "new@example.com", name: "New User", password: "password123" });

    expect(bcrypt.default.hash).toHaveBeenCalledWith("password123", 10);
  });
});

describe("user.service - registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forces role to user regardless of input", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.hash).mockResolvedValue("hashed-password" as never);

    const created = makeUserRecord({ role: "user" });
    vi.mocked(createUserRepo).mockResolvedValue(created);

    await registerUser({ email: "admin@example.com", name: "Admin", password: "password123", role: "admin" });

    expect(createUserRepo).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user" })
    );
  });
});

describe("user.service - updateUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when no updates provided", async () => {
    await expect(updateUserById("user-1", {}, { id: "user-1", role: "user" })).rejects.toThrow("No updates provided");
  });

  it("blocks non-admin role changes", async () => {
    await expect(updateUserById("user-1", { role: "admin" }, { id: "user-1", role: "user" })).rejects.toBeInstanceOf(HttpError);
    await expect(updateUserById("user-1", { role: "admin" }, { id: "user-1", role: "user" })).rejects.toThrow("Forbidden");
  });

  it("allows admin role changes", async () => {
    const updated = makeUserRecord({ role: "admin" });
    vi.mocked(updateUserByIdRepo).mockResolvedValue(updated);

    const result = await updateUserById("user-1", { role: "admin" }, { id: "admin-1", role: "admin" });

    expect(updateUserByIdRepo).toHaveBeenCalledWith("user-1", expect.objectContaining({ role: "admin" }));
    expect(result.role).toBe("admin");
  });

  it("returns updated public user", async () => {
    const updated = makeUserRecord({ name: "New Name" });
    vi.mocked(updateUserByIdRepo).mockResolvedValue(updated);

    const result = await updateUserById("user-1", { name: "New Name" }, { id: "user-1", role: "user" });

    expect(result.name).toBe("New Name");
    expect((result as UserAuthRecord).passwordHash).toBeUndefined();
  });

  it("hashes new password when updating password", async () => {
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.hash).mockResolvedValue("new-hashed-password" as never);

    const updated = makeUserRecord();
    vi.mocked(updateUserByIdRepo).mockResolvedValue(updated);

    await updateUserById("user-1", { password: "newpassword123" }, { id: "user-1", role: "user" });

    expect(bcrypt.default.hash).toHaveBeenCalledWith("newpassword123", 10);
    expect(updateUserByIdRepo).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ passwordHash: "new-hashed-password" })
    );
  });
});

describe("user.service - deleteUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when user is deleted", async () => {
    vi.mocked(deleteUserByIdRepo).mockResolvedValue(true);

    await expect(deleteUserById("user-1")).resolves.toBeUndefined();
  });

  it("throws when user not found", async () => {
    vi.mocked(deleteUserByIdRepo).mockResolvedValue(false);

    await expect(deleteUserById("nonexistent-id")).rejects.toThrow("User not found");
  });
});
