import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createIncident,
  deleteIncidentById,
  findIncidentById,
  findIncidentByIdForUser,
  listIncidentInboxForUser,
  listIncidents,
  listIncidentsForUser,
  updateIncidentById,
} from "@/modules/incident/incident.repository";

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
  incidentDeleteOne,
  incidentFind,
  userTeamFind,
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
  incidentDeleteOne: vi.fn(),
  incidentFind: vi.fn(),
  userTeamFind: vi.fn(),
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
    find: userTeamFind,
  },
}));

vi.mock("@/modules/incident/incident.model", () => ({
  IncidentModel: {
    findOne: incidentFindOne,
    create: incidentCreate,
    find: incidentFind,
    findById: incidentFindById,
    findByIdAndUpdate: incidentFindByIdAndUpdate,
    deleteOne: incidentDeleteOne,
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
      sla_started_at: new Date("2026-01-01T00:00:00.000Z"),
      response_due_at: new Date("2026-01-01T00:15:00.000Z"),
      resolution_due_at: new Date("2026-01-01T04:00:00.000Z"),
      acknowledged_at: null,
      sla_state: "Running",
      sla_stopped_at: null,
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
      sla_started_at: new Date("2026-01-01T00:00:00.000Z"),
      response_due_at: new Date("2026-01-01T00:15:00.000Z"),
      resolution_due_at: new Date("2026-01-01T04:00:00.000Z"),
      acknowledged_at: null,
      sla_state: "Running",
      sla_stopped_at: null,
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
    userTeamFind.mockResolvedValue([]);
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

    expect(incidentCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        incident_id: 7,
        team_id: 2,
      }),
    ]);
    expect(created.teamId).toBe(2);
    expect(created.incidentId).toBe(7);
    expect(startSession).not.toHaveBeenCalled();
    expect(withTransaction).not.toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
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
    expect(startSession).not.toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
  });

  it("propagates incident creation failures after allocating an incident id", async () => {
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
    expect(startSession).not.toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
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
      { new: true, upsert: true }
    );
    expect(counterFindOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { name: "incident_id" },
      { $set: { seq: 13 } },
      { new: true }
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

  it("returns null for invalid ObjectId in updateIncidentById", async () => {
    const result = await updateIncidentById("not-a-valid-id", { title: "New Title" });
    expect(result).toBeNull();
    expect(incidentFindById).not.toHaveBeenCalled();
  });

  it("returns null when incident does not exist in updateIncidentById", async () => {
    incidentFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    const result = await updateIncidentById("67dc66fd6f57fd4fce4d8548", { title: "New Title" });
    expect(result).toBeNull();
  });

  it("maps SLA-related update fields into mongo update payload", async () => {
    incidentFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ team_id: 2 }),
    });
    incidentFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockResolvedValue(makeUpdatedDoc()),
    });

    await updateIncidentById("67dc66fd6f57fd4fce4d8548", {
      acknowledgedAt: new Date("2026-01-01T00:10:00.000Z"),
      slaState: "Stopped",
      slaStoppedAt: new Date("2026-01-01T01:00:00.000Z"),
      responseDueAt: new Date("2026-01-01T00:30:00.000Z"),
      resolutionDueAt: new Date("2026-01-01T08:00:00.000Z"),
    });

    expect(incidentFindByIdAndUpdate).toHaveBeenCalledWith(
      "67dc66fd6f57fd4fce4d8548",
      {
        $set: expect.objectContaining({
          acknowledged_at: new Date("2026-01-01T00:10:00.000Z"),
          sla_state: "Stopped",
          sla_stopped_at: new Date("2026-01-01T01:00:00.000Z"),
          response_due_at: new Date("2026-01-01T00:30:00.000Z"),
          resolution_due_at: new Date("2026-01-01T08:00:00.000Z"),
        }),
      },
      { new: true }
    );
  });
});

describe("incident.repository — findIncidentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
  });

  it("returns null for invalid ObjectId", async () => {
    const result = await findIncidentById("not-a-valid-id");
    expect(result).toBeNull();
    expect(incidentFindById).not.toHaveBeenCalled();
  });

  it("returns null when incident does not exist", async () => {
    incidentFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });

    const result = await findIncidentById("67dc66fd6f57fd4fce4d8548");
    expect(result).toBeNull();
  });

  it("returns mapped incident with names when found", async () => {
    incidentFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(makeUpdatedDoc()),
    });

    const result = await findIncidentById("67dc66fd6f57fd4fce4d8548");
    expect(result).not.toBeNull();
    expect(result?.teamId).toBe(2);
    expect(result?.createdByName).toBe("Creator");
  });
});

describe("incident.repository — deleteIncidentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
  });

  it("returns false for invalid ObjectId", async () => {
    const result = await deleteIncidentById("not-a-valid-id");
    expect(result).toBe(false);
    expect(incidentDeleteOne).not.toHaveBeenCalled();
  });

  it("returns false when incident does not exist", async () => {
    incidentDeleteOne.mockResolvedValue({ deletedCount: 0 });

    const result = await deleteIncidentById("67dc66fd6f57fd4fce4d8548");
    expect(result).toBe(false);
  });

  it("returns true when incident is deleted", async () => {
    incidentDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await deleteIncidentById("67dc66fd6f57fd4fce4d8548");
    expect(result).toBe(true);
  });
});

describe("incident.repository — listIncidents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
  });

  it("returns all mapped incidents", async () => {
    incidentFind.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([makeUpdatedDoc(), makeUpdatedDoc()]),
      }),
    });

    const result = await listIncidents();
    expect(result).toHaveLength(2);
    expect(result[0]?.teamId).toBe(2);
  });
});

describe("incident.repository — listIncidentsForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
  });

  it("returns empty array when user has no team memberships", async () => {
    userTeamFind.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

    const result = await listIncidentsForUser("67dc66fd6f57fd4fce4d8548");

    expect(result).toEqual([]);
    expect(incidentFind).not.toHaveBeenCalled();
  });

  it("returns incidents scoped to user's teams when memberships exist", async () => {
    userTeamFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ team_id: 2 }, { team_id: 5 }]),
    });
    incidentFind.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([makeUpdatedDoc()]),
      }),
    });

    const result = await listIncidentsForUser("67dc66fd6f57fd4fce4d8548");

    expect(result).toHaveLength(1);
    expect(incidentFind).toHaveBeenCalledWith({ team_id: { $in: [2, 5] } });
  });
});

describe("incident.repository — findIncidentByIdForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
  });

  it("returns null when underlying incident is not found", async () => {
    incidentFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });

    const result = await findIncidentByIdForUser("67dc66fd6f57fd4fce4d8548", "67dc66fd6f57fd4fce4d8548");
    expect(result).toBeNull();
  });

  it("returns null when user is not a member of the incident's team", async () => {
    incidentFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(makeUpdatedDoc()),
    });
    userTeamCountDocuments.mockResolvedValue(0);

    const result = await findIncidentByIdForUser("67dc66fd6f57fd4fce4d8548", "67dc66fd6f57fd4fce4d8548");
    expect(result).toBeNull();
  });

  it("returns the incident when user is a member of its team", async () => {
    incidentFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(makeUpdatedDoc()),
    });
    userTeamCountDocuments.mockResolvedValue(1);

    const result = await findIncidentByIdForUser("67dc66fd6f57fd4fce4d8548", "67dc66fd6f57fd4fce4d8548");
    expect(result).not.toBeNull();
    expect(result?.teamId).toBe(2);
  });
});

describe("incident.repository — createIncident standalone MongoDB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
    startSession.mockResolvedValue({ withTransaction, endSession });
    endSession.mockResolvedValue(undefined);
  });

  it("creates incidents without requiring MongoDB transactions", async () => {
    userTeamCountDocuments.mockResolvedValue(1);
    incidentCreate.mockResolvedValue([makeCreateDoc()]);
    withTransaction.mockRejectedValue(
      new Error("Transaction numbers are only allowed on a replica set member or mongos")
    );

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

    expect(created.incidentId).toBe(7);
    expect(startSession).not.toHaveBeenCalled();
    expect(withTransaction).not.toHaveBeenCalled();
  });
});

describe("incident.repository — listIncidentInboxForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue({ startSession });
  });

  it("returns inbox incidents with available assignees", async () => {
    incidentFind.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([makeUpdatedDoc()]),
      }),
    });
    userTeamFind.mockReturnValue({
      populate: vi.fn().mockResolvedValue([
        {
          user_id: {
            _id: makeObjectIdLike("u-assignee"),
            name: "Assignee",
            email: "a@example.com",
          },
        },
      ]),
    });

    const result = await listIncidentInboxForUser("67dc66fd6f57fd4fce4d8548");

    expect(result).toHaveLength(1);
    expect(result[0]?.availableAssignees).toEqual([
      { id: "u-assignee", name: "Assignee", email: "a@example.com" },
    ]);
    expect(result[0]?.assignedToName).toBe("Assignee");
  });

  it("returns an empty array when no inbox incidents exist", async () => {
    incidentFind.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await listIncidentInboxForUser("67dc66fd6f57fd4fce4d8548");

    expect(result).toEqual([]);
    expect(userTeamFind).not.toHaveBeenCalled();
  });
});
