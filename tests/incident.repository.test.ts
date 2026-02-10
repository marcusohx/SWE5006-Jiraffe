import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIncident, updateIncidentById } from "@/modules/incident/incident.repository";

const {
  connectMongo,
  startSession,
  withTransaction,
  endSession,
  counterFindOneAndUpdate,
  userTeamCountDocuments,
  incidentFindOne,
  incidentCreate,
  incidentFindById,
  incidentFindByIdAndUpdate,
} = vi.hoisted(() => ({
  connectMongo: vi.fn(),
  startSession: vi.fn(),
  withTransaction: vi.fn(),
  endSession: vi.fn(),
  counterFindOneAndUpdate: vi.fn(),
  userTeamCountDocuments: vi.fn(),
  incidentFindOne: vi.fn(),
  incidentCreate: vi.fn(),
  incidentFindById: vi.fn(),
  incidentFindByIdAndUpdate: vi.fn(),
}));

vi.mock("@/lib/db/mongodb", () => ({
  connectMongo,
}));

vi.mock("@/modules/team/team.model", () => ({
  CounterModel: {
    findOneAndUpdate: counterFindOneAndUpdate,
  },
  UserTeamModel: {
    countDocuments: userTeamCountDocuments,
  },
}));

vi.mock("@/modules/incident/incident.model", () => ({
  IncidentModel: {
    findOne: incidentFindOne,
    create: incidentCreate,
    findById: incidentFindById,
    findByIdAndUpdate: incidentFindByIdAndUpdate,
  },
}));

function makeObjectIdLike(value: string) {
  return {
    toString: () => value,
  };
}

function makeCreateDoc() {
  return {
    toObject: () => ({
      _id: makeObjectIdLike("incident-doc-id"),
      incident_id: 7,
      team_id: 2,
      title: "T1",
      description: "D1",
      severity: "Low",
      status: "Open",
      board_order: 1000,
      created_by: makeObjectIdLike("u-creator"),
      assigned_by: makeObjectIdLike("u-assigner"),
      assigned_to: makeObjectIdLike("u-assignee"),
      resolved_on: null,
      closed_on: null,
      comment: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }),
  };
}

function makeUpdatedDoc() {
  return {
    toObject: () => ({
      _id: makeObjectIdLike("incident-doc-id"),
      incident_id: 7,
      team_id: 2,
      title: "T1",
      description: "D1",
      severity: "Low",
      status: "Open",
      board_order: 1000,
      created_by: { ...makeObjectIdLike("u-creator"), name: "Creator" },
      assigned_by: { ...makeObjectIdLike("u-assigner"), name: "Assigner" },
      assigned_to: { ...makeObjectIdLike("u-assignee"), name: "Assignee" },
      resolved_on: null,
      closed_on: null,
      comment: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }),
  };
}

describe("incident.repository team scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
    startSession.mockResolvedValue({ withTransaction, endSession });
    withTransaction.mockImplementation(async (callback: () => Promise<unknown>) => callback());
    endSession.mockResolvedValue(undefined);

    counterFindOneAndUpdate.mockResolvedValue({ seq: 7 });
    incidentFindOne.mockResolvedValue(null);
  });

  it("creates incident when creator/assignedBy/assignee are members of selected team", async () => {
    userTeamCountDocuments.mockResolvedValue(1);
    incidentCreate.mockResolvedValue([makeCreateDoc()]);

    const created = await createIncident({
      teamId: 2,
      title: "T1",
      description: "D1",
      severity: "Low",
      status: "Open",
      boardOrder: 1000,
      createdBy: "67dc66fd6f57fd4fce4d8548",
      assignedBy: "67dc66fd6f57fd4fce4d8548",
      assignedTo: "67dc66fd6f57fd4fce4d8548",
      comment: null,
    });

    expect(incidentCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          incident_id: 7,
          team_id: 2,
        }),
      ],
      expect.objectContaining({
        session: expect.any(Object),
      })
    );
    expect(created.teamId).toBe(2);
    expect(created.incidentId).toBe(7);
    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("rejects create when assignee is not in selected team", async () => {
    userTeamCountDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    await expect(
      createIncident({
        teamId: 2,
        title: "T1",
        description: "D1",
        severity: "Low",
        status: "Open",
        boardOrder: 1000,
        createdBy: "67dc66fd6f57fd4fce4d8548",
        assignedBy: "67dc66fd6f57fd4fce4d8548",
        assignedTo: "67dc66fd6f57fd4fce4d8548",
        comment: null,
      })
    ).rejects.toThrow("Assignee is not a member of selected team");
    expect(counterFindOneAndUpdate).not.toHaveBeenCalled();
    expect(incidentCreate).not.toHaveBeenCalled();
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("does not commit counter increment when incident creation fails", async () => {
    userTeamCountDocuments.mockResolvedValue(1);
    incidentCreate.mockRejectedValue(new Error("insert failed"));

    await expect(
      createIncident({
        teamId: 2,
        title: "T1",
        description: "D1",
        severity: "Low",
        status: "Open",
        boardOrder: 1000,
        createdBy: "67dc66fd6f57fd4fce4d8548",
        assignedBy: "67dc66fd6f57fd4fce4d8548",
        assignedTo: "67dc66fd6f57fd4fce4d8548",
        comment: null,
      })
    ).rejects.toThrow("insert failed");
    expect(counterFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("bootstraps counter to max incident_id + 1 when counter is behind", async () => {
    userTeamCountDocuments.mockResolvedValue(1);
    counterFindOneAndUpdate
      .mockResolvedValueOnce({ seq: 1 })
      .mockResolvedValueOnce({ seq: 13 });
    incidentFindOne.mockResolvedValue({ incident_id: 12 });
    incidentCreate.mockResolvedValue([makeCreateDoc()]);

    await createIncident({
      teamId: 2,
      title: "T1",
      description: "D1",
      severity: "Low",
      status: "Open",
      boardOrder: 1000,
      createdBy: "67dc66fd6f57fd4fce4d8548",
      assignedBy: "67dc66fd6f57fd4fce4d8548",
      assignedTo: "67dc66fd6f57fd4fce4d8548",
      comment: null,
    });

    expect(counterFindOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      { name: "incident_id" },
      { $inc: { seq: 1 } },
      expect.objectContaining({ session: expect.any(Object) })
    );
    expect(counterFindOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { name: "incident_id" },
      { $set: { seq: 13 } },
      expect.objectContaining({ session: expect.any(Object) })
    );
  });

  it("rejects reassignment when target user is outside incident team", async () => {
    incidentFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ team_id: 2 }),
    });
    userTeamCountDocuments.mockResolvedValue(0);

    await expect(
      updateIncidentById("67dc66fd6f57fd4fce4d8548", {
        assignedTo: "67dc66fd6f57fd4fce4d8548",
      })
    ).rejects.toThrow("Cannot reassign incident to a user from a different team");
  });

  it("allows reassignment when target user is in incident team", async () => {
    incidentFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ team_id: 2 }),
    });
    userTeamCountDocuments.mockResolvedValue(1);
    incidentFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockResolvedValue(makeUpdatedDoc()),
    });

    const updated = await updateIncidentById("67dc66fd6f57fd4fce4d8548", {
      assignedTo: "67dc66fd6f57fd4fce4d8548",
    });

    expect(updated?.teamId).toBe(2);
    expect(updated?.assignedTo).toBe("u-assignee");
  });
});
