import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http-error";
import type { TeamWithMembers } from "@/modules/team/team.model";
import {
  createTeam,
  deleteTeamById,
  getTeamById,
  listTeams,
  updateTeamById,
} from "@/modules/team/team.service";
import {
  createTeam as createTeamRepo,
  findTeamById,
  listTeams as listTeamsRepo,
  softDeleteTeamById,
  updateTeamById as updateTeamByIdRepo,
} from "@/modules/team/team.repository";
import { UserModel } from "@/modules/user/user.model";
import { connectMongo } from "@/lib/db/mongodb";

vi.mock("@/modules/team/team.repository", () => ({
  listTeams: vi.fn(),
  findTeamById: vi.fn(),
  createTeam: vi.fn(),
  updateTeamById: vi.fn(),
  softDeleteTeamById: vi.fn(),
}));

vi.mock("@/modules/user/user.model", () => ({
  UserModel: {
    countDocuments: vi.fn(),
  },
}));

vi.mock("@/lib/db/mongodb", () => ({
  connectMongo: vi.fn(),
}));

function makeTeam(overrides: Partial<TeamWithMembers> = {}): TeamWithMembers {
  return {
    id: "team-doc-id",
    teamId: 1,
    teamCode: "ABCDEF",
    name: "Engineering",
    description: null,
    isActive: true,
    members: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("team.service - listTeams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls listTeamsRepo with the provided userId", async () => {
    const teams = [makeTeam()];
    vi.mocked(listTeamsRepo).mockResolvedValue(teams);

    const result = await listTeams("67dc66fd6f57fd4fce4d8548");

    expect(listTeamsRepo).toHaveBeenCalledWith("67dc66fd6f57fd4fce4d8548");
    expect(result).toEqual(teams);
  });
});

describe("team.service - getTeamById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns team for admin", async () => {
    const team = makeTeam();
    vi.mocked(findTeamById).mockResolvedValue(team);

    const result = await getTeamById("team-doc-id", "user-1", "admin");

    expect(result).toEqual(team);
  });

  it("returns team for member", async () => {
    const team = makeTeam({ members: [{ userId: "user-1", name: "Alice", email: "alice@example.com", role: "member" }] });
    vi.mocked(findTeamById).mockResolvedValue(team);

    const result = await getTeamById("team-doc-id", "user-1", "user");

    expect(result).toEqual(team);
  });

  it("throws forbidden for non-member non-admin", async () => {
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());

    await expect(getTeamById("team-doc-id", "user-1", "user")).rejects.toBeInstanceOf(HttpError);
    await expect(getTeamById("team-doc-id", "user-1", "user")).rejects.toThrow("Forbidden");
  });

  it("throws when team not found", async () => {
    vi.mocked(findTeamById).mockResolvedValue(null);

    await expect(getTeamById("nonexistent-id", "user-1", "user")).rejects.toThrow("Team not found");
  });
});

describe("team.service - createTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(connectMongo).mockResolvedValue(undefined as never);
  });

  it("creates team with creator added to members", async () => {
    const team = makeTeam();
    vi.mocked(createTeamRepo).mockResolvedValue(team);
    vi.mocked(UserModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await createTeam({ name: "Engineering", memberIds: [] }, "67dc66fd6f57fd4fce4d8548");

    expect(createTeamRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Engineering",
        memberIds: ["67dc66fd6f57fd4fce4d8548"],
      })
    );
    expect(result).toEqual(team);
  });

  it("throws when name is blank", async () => {
    await expect(createTeam({ name: "   ", memberIds: [] }, "67dc66fd6f57fd4fce4d8548")).rejects.toThrow(
      "Team name is required"
    );
  });

  it("throws when memberIds contain invalid ObjectId", async () => {
    await expect(
      createTeam({ name: "Engineering", memberIds: ["not-valid-id"] }, "67dc66fd6f57fd4fce4d8548")
    ).rejects.toThrow("Invalid user id");
  });

  it("throws when one or more users do not exist", async () => {
    vi.mocked(UserModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await expect(
      createTeam({ name: "Engineering", memberIds: ["67dc66fd6f57fd4fce4d8548"] }, "67dc66fd6f57fd4fce4d8548")
    ).rejects.toThrow("One or more users not found");
  });

  it("deduplicates memberIds including creator", async () => {
    vi.mocked(UserModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const team = makeTeam();
    vi.mocked(createTeamRepo).mockResolvedValue(team);

    await createTeam(
      {
        name: "Engineering",
        memberIds: ["67dc66fd6f57fd4fce4d8548", "67dc66fd6f57fd4fce4d8548"],
      },
      "67dc66fd6f57fd4fce4d8548"
    );

    expect(createTeamRepo).toHaveBeenCalledWith(
      expect.objectContaining({ memberIds: ["67dc66fd6f57fd4fce4d8548"] })
    );
  });
});

describe("team.service - updateTeamById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(connectMongo).mockResolvedValue(undefined as never);
  });

  it("allows a current member to update all team fields", async () => {
    const memberId = "67dc66fd6f57fd4fce4d8548";
    const updated = makeTeam({ name: "New Name", isActive: false });
    vi.mocked(findTeamById).mockResolvedValue(
      makeTeam({
        members: [{ userId: memberId, name: "Alice", email: "alice@example.com", role: "member" }],
      })
    );
    vi.mocked(UserModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    vi.mocked(updateTeamByIdRepo).mockResolvedValue(updated);

    const result = await updateTeamById(
      "team-doc-id",
      {
        name: "New Name",
        description: "Updated",
        memberIds: [memberId],
        isActive: false,
      },
      memberId,
      "user"
    );

    expect(result).toEqual(updated);
    expect(updateTeamByIdRepo).toHaveBeenCalledWith(
      "team-doc-id",
      expect.objectContaining({
        name: "New Name",
        description: "Updated",
        memberIds: [memberId],
        isActive: false,
      })
    );
  });

  it("throws forbidden for non-admin non-member", async () => {
    vi.mocked(findTeamById).mockResolvedValue(
      makeTeam({
        members: [{ userId: "67dc66fd6f57fd4fce4d8548", name: "Alice", email: "alice@example.com", role: "member" }],
      })
    );

    await expect(
      updateTeamById("team-doc-id", { name: "New Name" }, "67dc66fd6f57fd4fce4d9999", "user")
    ).rejects.toThrow("Forbidden");
    expect(updateTeamByIdRepo).not.toHaveBeenCalled();
  });

  it("throws when no updates provided", async () => {
    await expect(updateTeamById("team-doc-id", {}, "admin-user", "admin")).rejects.toThrow("No updates provided");
  });

  it("throws when team not found", async () => {
    vi.mocked(findTeamById).mockResolvedValue(null);

    await expect(updateTeamById("team-doc-id", { name: "New Name" }, "admin-user", "admin")).rejects.toThrow("Team not found");
    expect(updateTeamByIdRepo).not.toHaveBeenCalled();
  });

  it("returns updated team for admin", async () => {
    const updated = makeTeam({ name: "New Name" });
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());
    vi.mocked(updateTeamByIdRepo).mockResolvedValue(updated);

    const result = await updateTeamById("team-doc-id", { name: "New Name" }, "admin-user", "admin");

    expect(result).toEqual(updated);
  });

  it("throws when name update is blank", async () => {
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());

    await expect(updateTeamById("team-doc-id", { name: "   " }, "admin-user", "admin")).rejects.toThrow(
      "Team name is required"
    );
  });

  it("trims description and persists trimmed value", async () => {
    const updated = makeTeam({ description: "trimmed" });
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());
    vi.mocked(updateTeamByIdRepo).mockResolvedValue(updated);

    await updateTeamById("team-doc-id", { description: "  trimmed  " }, "admin-user", "admin");

    expect(updateTeamByIdRepo).toHaveBeenCalledWith(
      "team-doc-id",
      expect.objectContaining({ description: "trimmed" })
    );
  });

  it("normalizes whitespace-only description to null", async () => {
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());
    vi.mocked(updateTeamByIdRepo).mockResolvedValue(makeTeam());

    await updateTeamById("team-doc-id", { description: "   " }, "admin-user", "admin");

    expect(updateTeamByIdRepo).toHaveBeenCalledWith(
      "team-doc-id",
      expect.objectContaining({ description: null })
    );
  });

  it("validates and persists memberIds when provided", async () => {
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());
    vi.mocked(UserModel.countDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    vi.mocked(updateTeamByIdRepo).mockResolvedValue(makeTeam());

    await updateTeamById(
      "team-doc-id",
      { memberIds: ["67dc66fd6f57fd4fce4d8548", "67dc66fd6f57fd4fce4d8548"] },
      "admin-user",
      "admin"
    );

    expect(updateTeamByIdRepo).toHaveBeenCalledWith(
      "team-doc-id",
      expect.objectContaining({ memberIds: ["67dc66fd6f57fd4fce4d8548"] })
    );
  });

  it("persists isActive flag updates", async () => {
    vi.mocked(findTeamById).mockResolvedValue(makeTeam());
    vi.mocked(updateTeamByIdRepo).mockResolvedValue(makeTeam({ isActive: false }));

    await updateTeamById("team-doc-id", { isActive: false }, "admin-user", "admin");

    expect(updateTeamByIdRepo).toHaveBeenCalledWith(
      "team-doc-id",
      expect.objectContaining({ isActive: false })
    );
  });
});

describe("team.service - deleteTeamById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when team is deleted", async () => {
    vi.mocked(softDeleteTeamById).mockResolvedValue(true);

    await expect(deleteTeamById("team-doc-id")).resolves.toBeUndefined();
  });

  it("throws when team not found", async () => {
    vi.mocked(softDeleteTeamById).mockResolvedValue(false);

    await expect(deleteTeamById("nonexistent-id")).rejects.toThrow("Team not found");
  });
});
