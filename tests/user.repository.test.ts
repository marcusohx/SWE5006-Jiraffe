import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserById,
} from "@/modules/user/user.repository";

const {
  connectMongo,
  isValidObjectId,
  userCreate,
  userFindById,
  userFindOne,
  userFind,
  userFindByIdAndUpdate,
  userDeleteOne,
} = vi.hoisted(() => ({
  connectMongo: vi.fn(),
  isValidObjectId: vi.fn(),
  userCreate: vi.fn(),
  userFindById: vi.fn(),
  userFindOne: vi.fn(),
  userFind: vi.fn(),
  userFindByIdAndUpdate: vi.fn(),
  userDeleteOne: vi.fn(),
}));

vi.mock("@/lib/db/mongodb", () => ({ connectMongo }));

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongoose")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      Types: {
        ObjectId: {
          isValid: isValidObjectId,
        },
      },
    },
  };
});

vi.mock("@/modules/user/user.model", () => ({
  UserModel: {
    create: userCreate,
    findById: userFindById,
    findOne: userFindOne,
    find: userFind,
    findByIdAndUpdate: userFindByIdAndUpdate,
    deleteOne: userDeleteOne,
  },
}));

const FAKE_ID = "67dc66fd6f57fd4fce4d8548";

function makeUserDoc(overrides = {}) {
  return {
    _id: { toString: () => FAKE_ID },
    email: "user@example.com",
    name: "Test User",
    role: "user" as const,
    passwordHash: "hashed-pw",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("user.repository — createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("creates a user and returns mapped record", async () => {
    userCreate.mockResolvedValue(makeUserDoc());

    const result = await createUser({
      email: "user@example.com",
      name: "Test User",
      role: "user",
      passwordHash: "hashed-pw",
    });

    expect(result.id).toBe(FAKE_ID);
    expect(result.email).toBe("user@example.com");
    expect(result.passwordHash).toBe("hashed-pw");
  });

  it("passes correct fields to UserModel.create", async () => {
    userCreate.mockResolvedValue(makeUserDoc());

    await createUser({
      email: "user@example.com",
      name: "Test User",
      role: "admin",
      passwordHash: "hashed-pw",
    });

    expect(userCreate).toHaveBeenCalledWith({
      email: "user@example.com",
      name: "Test User",
      role: "admin",
      passwordHash: "hashed-pw",
    });
  });
});

describe("user.repository — findUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns null for invalid ObjectId", async () => {
    isValidObjectId.mockReturnValue(false);

    const result = await findUserById("not-an-id");

    expect(result).toBeNull();
    expect(userFindById).not.toHaveBeenCalled();
  });

  it("returns mapped user when found", async () => {
    isValidObjectId.mockReturnValue(true);
    userFindById.mockResolvedValue(makeUserDoc());

    const result = await findUserById(FAKE_ID);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(FAKE_ID);
    expect(result?.email).toBe("user@example.com");
  });

  it("returns null when user does not exist", async () => {
    isValidObjectId.mockReturnValue(true);
    userFindById.mockResolvedValue(null);

    const result = await findUserById(FAKE_ID);

    expect(result).toBeNull();
  });
});

describe("user.repository — findUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns mapped user when found", async () => {
    userFindOne.mockResolvedValue(makeUserDoc());

    const result = await findUserByEmail("user@example.com");

    expect(result?.email).toBe("user@example.com");
    expect(result?.passwordHash).toBe("hashed-pw");
  });

  it("returns null when email not found", async () => {
    userFindOne.mockResolvedValue(null);

    const result = await findUserByEmail("nobody@example.com");

    expect(result).toBeNull();
  });

  it("queries by email field", async () => {
    userFindOne.mockResolvedValue(null);

    await findUserByEmail("test@example.com");

    expect(userFindOne).toHaveBeenCalledWith({ email: "test@example.com" });
  });
});

describe("user.repository — listUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns array of public users", async () => {
    userFind.mockReturnValue({
      sort: () =>
        Promise.resolve([makeUserDoc(), makeUserDoc({ email: "other@example.com" })]),
    });

    const result = await listUsers();

    expect(result).toHaveLength(2);
    expect((result[0] as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("returns empty array when no users exist", async () => {
    userFind.mockReturnValue({ sort: () => Promise.resolve([]) });

    const result = await listUsers();

    expect(result).toEqual([]);
  });
});

describe("user.repository — updateUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns null for invalid ObjectId", async () => {
    isValidObjectId.mockReturnValue(false);

    const result = await updateUserById("bad-id", { name: "New Name" });

    expect(result).toBeNull();
    expect(userFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns updated mapped user", async () => {
    isValidObjectId.mockReturnValue(true);
    userFindByIdAndUpdate.mockResolvedValue(makeUserDoc({ name: "New Name" }));

    const result = await updateUserById(FAKE_ID, { name: "New Name" });

    expect(result?.name).toBe("New Name");
  });

  it("returns null when user not found", async () => {
    isValidObjectId.mockReturnValue(true);
    userFindByIdAndUpdate.mockResolvedValue(null);

    const result = await updateUserById(FAKE_ID, { name: "New Name" });

    expect(result).toBeNull();
  });

  it("uses $set and new:true", async () => {
    isValidObjectId.mockReturnValue(true);
    userFindByIdAndUpdate.mockResolvedValue(makeUserDoc());

    await updateUserById(FAKE_ID, { name: "New Name" });

    expect(userFindByIdAndUpdate).toHaveBeenCalledWith(
      FAKE_ID,
      { $set: { name: "New Name" } },
      { new: true }
    );
  });
});

describe("user.repository — deleteUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns false for invalid ObjectId", async () => {
    isValidObjectId.mockReturnValue(false);

    const result = await deleteUserById("bad-id");

    expect(result).toBe(false);
    expect(userDeleteOne).not.toHaveBeenCalled();
  });

  it("returns true when user is deleted", async () => {
    isValidObjectId.mockReturnValue(true);
    userDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await deleteUserById(FAKE_ID);

    expect(result).toBe(true);
  });

  it("returns false when user not found", async () => {
    isValidObjectId.mockReturnValue(true);
    userDeleteOne.mockResolvedValue({ deletedCount: 0 });

    const result = await deleteUserById(FAKE_ID);

    expect(result).toBe(false);
  });
});
