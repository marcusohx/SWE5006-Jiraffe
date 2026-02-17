import { beforeEach, describe, expect, it, vi } from "vitest";
import { listTeams } from "@/modules/team/team.repository";

const {
  connectMongo,
  userTeamFind,
  teamFind,
} = vi.hoisted(() => ({
  connectMongo: vi.fn(),
  userTeamFind: vi.fn(),
  teamFind: vi.fn(),
}));

vi.mock("@/lib/db/mongodb", () => ({
  connectMongo,
}));

vi.mock("@/modules/user/user.model", () => ({}));

vi.mock("@/modules/team/team.model", () => ({
  UserTeamModel: {
    find: userTeamFind,
  },
  TeamModel: {
    find: teamFind,
  },
  CounterModel: {},
}));

const FAKE_USER_ID = "67dc66fd6f57fd4fce4d8548";
const FAKE_TEAM_OBJECT_ID = "67dc66fd6f57fd4fce4d9999";

function makeTeamDoc(overrides = {}) {
  return {
    _id: { toString: () => FAKE_TEAM_OBJECT_ID },
    team_id: 1,
    team_name: "Engineering",
    description: null,
    is_active: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

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

  it("returns only teams the user belongs to", async () => {
    const teamDoc = makeTeamDoc();

    // First call: find user's team memberships
    userTeamFind
      .mockReturnValueOnce({
        lean: () => Promise.resolve([{ team_id: 1, user_id: FAKE_USER_ID }]),
      })
      // Second call: listTeamMembers internals (find members for those teams)
      .mockReturnValueOnce({
        populate: () => Promise.resolve([]),
      });

    // TeamModel.find chain: .sort().lean()
    teamFind.mockReturnValue({
      sort: () => ({ lean: () => Promise.resolve([teamDoc]) }),
    });

    const result = await listTeams(FAKE_USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].teamId).toBe(1);
    expect(result[0].name).toBe("Engineering");
  });
});
