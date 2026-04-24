import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTeam,
  findTeamById,
  listTeams,
  softDeleteTeamById,
  updateTeamById,
} from "@/modules/team/team.repository";

const {
  connectMongo,
  isValidObjectId,
  userTeamFind,
  userTeamInsertMany,
  userTeamDeleteMany,
  teamFind,
  teamCreate,
  teamFindById,
  teamFindByIdAndUpdate,
  counterFindOneAndUpdate,
} = vi.hoisted(() => ({
  connectMongo: vi.fn(),
  isValidObjectId: vi.fn(),
  userTeamFind: vi.fn(),
  userTeamInsertMany: vi.fn(),
  userTeamDeleteMany: vi.fn(),
  teamFind: vi.fn(),
  teamCreate: vi.fn(),
  teamFindById: vi.fn(),
  teamFindByIdAndUpdate: vi.fn(),
  counterFindOneAndUpdate: vi.fn(),
}));

vi.mock("@/lib/db/mongodb", () => ({ connectMongo }));

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongoose")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      Types: {
        ObjectId: class {
          private val: string;
          constructor(v: string) { this.val = v; }
          toString() { return this.val; }
          static isValid = isValidObjectId;
        },
      },
    },
  };
});

vi.mock("@/modules/user/user.model", () => ({}));

vi.mock("@/modules/team/team.model", () => ({
  UserTeamModel: {
    find: userTeamFind,
    insertMany: userTeamInsertMany,
    deleteMany: userTeamDeleteMany,
  },
  TeamModel: {
    find: teamFind,
    create: teamCreate,
    findById: teamFindById,
    findByIdAndUpdate: teamFindByIdAndUpdate,
    findOne: vi.fn().mockReturnValue({ sort: () => ({ select: () => Promise.resolve(null) }) }),
  },
  CounterModel: {
    findOneAndUpdate: counterFindOneAndUpdate,
  },
}));

const FAKE_USER_ID = "67dc66fd6f57fd4fce4d8548";
const FAKE_TEAM_OBJECT_ID = "67dc66fd6f57fd4fce4d9999";

function makeTeamDoc(overrides = {}) {
  return {
    _id: { toString: () => FAKE_TEAM_OBJECT_ID },
    team_id: 1,
    team_code: "ABCDEF",
    team_name: "Engineering",
    description: null,
    is_active: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

// ---- listTeams ----

describe("team.repository — listTeams(userId)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns empty array when user belongs to no teams", async () => {
    userTeamFind.mockReturnValue({ lean: () => Promise.resolve([]) });

    const result = await listTeams(FAKE_USER_ID);

    expect(result).toEqual([]);
    expect(teamFind).not.toHaveBeenCalled();
  });

  it("returns teams the user belongs to", async () => {
    const teamDoc = makeTeamDoc();

    userTeamFind
      .mockReturnValueOnce({
        lean: () => Promise.resolve([{ team_id: 1, user_id: FAKE_USER_ID }]),
      })
      .mockReturnValueOnce({
        populate: () => Promise.resolve([]),
      });

    teamFind.mockReturnValue({
      sort: () => ({ lean: () => Promise.resolve([teamDoc]) }),
    });

    const result = await listTeams(FAKE_USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].teamId).toBe(1);
    expect(result[0].name).toBe("Engineering");
  });
});

// ---- findTeamById ----

describe("team.repository — findTeamById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns null for invalid ObjectId", async () => {
    isValidObjectId.mockReturnValue(false);

    const result = await findTeamById("bad-id");

    expect(result).toBeNull();
    expect(teamFindById).not.toHaveBeenCalled();
  });

  it("returns null when team does not exist", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindById.mockResolvedValue(null);

    const result = await findTeamById(FAKE_TEAM_OBJECT_ID);

    expect(result).toBeNull();
  });

  it("returns mapped team with members when found", async () => {
    isValidObjectId.mockReturnValue(true);
    const teamDoc = makeTeamDoc();
    teamFindById.mockResolvedValue(teamDoc);

    userTeamFind.mockReturnValue({
      populate: () =>
        Promise.resolve([
          {
            team_id: 1,
            user_id: { _id: FAKE_USER_ID, name: "alice", email: "alice@example.com" },
            role: "member",
          },
        ]),
    });

    const result = await findTeamById(FAKE_TEAM_OBJECT_ID);

    expect(result).not.toBeNull();
    expect(result?.teamId).toBe(1);
    expect(result?.name).toBe("Engineering");
    expect(result?.members).toHaveLength(1);
    expect(result?.members[0].email).toBe("alice@example.com");
  });
});

// ---- updateTeamById ----

describe("team.repository — updateTeamById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns null for invalid ObjectId", async () => {
    isValidObjectId.mockReturnValue(false);

    const result = await updateTeamById("bad-id", { name: "New Name" });

    expect(result).toBeNull();
    expect(teamFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns null when team not found", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindByIdAndUpdate.mockResolvedValue(null);

    const result = await updateTeamById(FAKE_TEAM_OBJECT_ID, { name: "New Name" });

    expect(result).toBeNull();
  });

  it("returns updated team with mapped fields", async () => {
    isValidObjectId.mockReturnValue(true);
    const updated = makeTeamDoc({ team_name: "New Name" });
    teamFindByIdAndUpdate.mockResolvedValue(updated);

    userTeamFind.mockReturnValue({ populate: () => Promise.resolve([]) });

    const result = await updateTeamById(FAKE_TEAM_OBJECT_ID, { name: "New Name" });

    expect(result?.name).toBe("New Name");
  });

  it("maps name to team_name in mongo update", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindByIdAndUpdate.mockResolvedValue(makeTeamDoc());
    userTeamFind.mockReturnValue({ populate: () => Promise.resolve([]) });

    await updateTeamById(FAKE_TEAM_OBJECT_ID, { name: "Ops Team" });

    expect(teamFindByIdAndUpdate).toHaveBeenCalledWith(
      FAKE_TEAM_OBJECT_ID,
      { $set: expect.objectContaining({ team_name: "Ops Team" }) },
      { new: true }
    );
  });

  it("maps isActive to is_active in mongo update", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindByIdAndUpdate.mockResolvedValue(makeTeamDoc({ is_active: false }));
    userTeamFind.mockReturnValue({ populate: () => Promise.resolve([]) });

    await updateTeamById(FAKE_TEAM_OBJECT_ID, { isActive: false });

    expect(teamFindByIdAndUpdate).toHaveBeenCalledWith(
      FAKE_TEAM_OBJECT_ID,
      { $set: expect.objectContaining({ is_active: false }) },
      { new: true }
    );
  });
});

// ---- softDeleteTeamById ----

describe("team.repository — softDeleteTeamById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns false for invalid ObjectId", async () => {
    isValidObjectId.mockReturnValue(false);

    const result = await softDeleteTeamById("bad-id");

    expect(result).toBe(false);
    expect(teamFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns true when team is soft deleted", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindByIdAndUpdate.mockResolvedValue(makeTeamDoc({ is_active: false }));

    const result = await softDeleteTeamById(FAKE_TEAM_OBJECT_ID);

    expect(result).toBe(true);
  });

  it("returns false when team not found", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindByIdAndUpdate.mockResolvedValue(null);

    const result = await softDeleteTeamById(FAKE_TEAM_OBJECT_ID);

    expect(result).toBe(false);
  });

  it("sets is_active to false", async () => {
    isValidObjectId.mockReturnValue(true);
    teamFindByIdAndUpdate.mockResolvedValue(makeTeamDoc());

    await softDeleteTeamById(FAKE_TEAM_OBJECT_ID);

    expect(teamFindByIdAndUpdate).toHaveBeenCalledWith(
      FAKE_TEAM_OBJECT_ID,
      { $set: { is_active: false } },
      { new: true }
    );
  });
});

// ---- createTeam ----

describe("team.repository — createTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
    counterFindOneAndUpdate.mockResolvedValue({ seq: 2 });
    userTeamInsertMany.mockResolvedValue([]);
  });

  it("creates a team and returns it with members", async () => {
    const teamDoc = makeTeamDoc();
    teamCreate.mockResolvedValue(teamDoc);

    userTeamFind.mockReturnValue({ populate: () => Promise.resolve([]) });

    const result = await createTeam({
      name: "Engineering",
      description: null,
      isActive: true,
      memberIds: [],
    });

    expect(result.name).toBe("Engineering");
    expect(result.teamId).toBe(1);
  });

  it("propagates non-duplicate errors immediately", async () => {
    teamCreate.mockRejectedValue(new Error("DB connection failed"));

    await expect(
      createTeam({ name: "Team", description: null, isActive: true, memberIds: [] })
    ).rejects.toThrow("DB connection failed");
  });
});
