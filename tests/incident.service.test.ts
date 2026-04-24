import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
import {
  acknowledgeIncident,
  createIncident,
  deleteIncidentById,
  getIncidentById,
  listIncidents,
  reassignIncident,
  updateIncidentById,
} from "@/modules/incident/incident.service";
import {
  createIncident as createIncidentRepo,
  deleteIncidentById as deleteIncidentByIdRepo,
  findIncidentById,
  listIncidentInboxForUser,
  listIncidents as listIncidentsRepo,
  updateIncidentById as updateIncidentByIdRepo,
} from "@/modules/incident/incident.repository";
import { logActivity } from "@/modules/activity/activity.service";

vi.mock("@/modules/incident/incident.repository", () => ({
  createIncident: vi.fn(),
  deleteIncidentById: vi.fn(),
  findIncidentById: vi.fn(),
  listIncidentInboxForUser: vi.fn(),
  listIncidents: vi.fn(),
  updateIncidentById: vi.fn(),
}));

vi.mock("@/modules/activity/activity.service", () => ({
  logActivity: vi.fn(),
}));

function makeIncident(overrides: Partial<IncidentWithNames> = {}): IncidentWithNames {
  return {
    id: "incident-1",
    incidentId: 1,
    teamId: 3,
    title: "Test Incident",
    description: "Test description",
    severity: "Medium",
    status: "Open",
    boardOrder: 1000,
    createdBy: "u1",
    assignedBy: "u2",
    assignedTo: "u3",
    resolvedOn: null,
    closedOn: null,
    comment: null,
    sla: {
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      responseDueAt: new Date("2026-01-01T00:15:00.000Z"),
      resolutionDueAt: new Date("2026-01-01T04:00:00.000Z"),
      acknowledgedAt: null,
      state: "Running",
      stoppedAt: null,
      breachedResponse: false,
      breachedResolution: false,
    },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdByName: "Creator",
    assignedByName: "Assigner",
    assignedToName: "Assignee",
    ...overrides,
  };
}

describe("incident.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets boardOrder when creating incidents", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue({
      id: "incident-1",
      incidentId: 1,
      teamId: 3,
      title: "Test",
      description: "Test",
      severity: "Low",
      status: "Open",
      boardOrder: 1000,
      createdBy: "u1",
      assignedBy: "u2",
      assignedTo: "u3",
      resolvedOn: null,
      closedOn: null,
      comment: null,
      sla: {
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        responseDueAt: new Date("2026-01-01T00:15:00.000Z"),
        resolutionDueAt: new Date("2026-01-01T04:00:00.000Z"),
        acknowledgedAt: null,
        state: "Running",
        stoppedAt: null,
        breachedResponse: false,
        breachedResolution: false,
      },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident());

    await createIncident(
      {
        teamId: 3,
        title: "Test",
        description: "Test",
        severity: "Low",
        status: "Open",
        assignedBy: "u2",
        assignedTo: "u3",
      },
      "u1"
    );

    expect(createIncidentRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 3,
        boardOrder: expect.any(Number),
      })
    );
  });

  it("sets closedOn when status changes to Closed", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await updateIncidentById("incident-1", { status: "Closed" }, "u1", "User One");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "Closed",
        closedOn: expect.any(Date),
      })
    );
  });

  it("clears closedOn when reopening incidents", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(
      makeIncident({ status: "Closed", assignedTo: "u1", sla: { ...makeIncident().sla, state: "Stopped" } })
    );
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Open", closedOn: null }));

    await updateIncidentById("incident-1", { status: "Open" }, "u1", "User One");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "Open",
        closedOn: null,
      })
    );
  });

  it("does not change closedOn when status is not updated", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident());
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { severity: "High" });

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith("incident-1", expect.not.objectContaining({ closedOn: null }));
    expect(updateIncidentByIdRepo).toHaveBeenCalledWith("incident-1", expect.not.objectContaining({ closedOn: expect.any(Date) }));
  });

  it("clears closedOn when status changes to In Progress", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "In Progress", closedOn: null }));

    await updateIncidentById("incident-1", { status: "In Progress" }, "u1", "User One");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ status: "In Progress", closedOn: null })
    );
  });

  it("throws when no updates provided", async () => {
    await expect(updateIncidentById("incident-1", {})).rejects.toThrow("No updates provided");
  });

  it("throws when incident not found", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(null);
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(null);

    await expect(updateIncidentById("incident-1", { severity: "High" })).rejects.toThrow("Incident not found");
  });

  it("throws when a non-assignee tries to close a ticket", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(updateIncidentById("incident-1", { status: "Closed" }, "u1", "User One")).rejects.toThrow(
      "Only the assigned user can close this ticket"
    );
  });

  it("throws when a non-assignee tries to move a ticket to In Progress", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(
      updateIncidentById("incident-1", { status: "In Progress" }, "u1", "User One")
    ).rejects.toThrow("Only the assigned user can move this ticket to In Progress");
  });
});

describe("incident.service — listIncidents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of incidents from repository", async () => {
    const incidents = [makeIncident(), makeIncident({ id: "incident-2", incidentId: 2 })];
    vi.mocked(listIncidentsRepo).mockResolvedValue(incidents);

    const result = await listIncidents();

    expect(result).toEqual(incidents);
    expect(listIncidentsRepo).toHaveBeenCalledTimes(1);
  });
});

describe("incident.service — listIncidentInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns inbox items from repository", async () => {
    const inbox = [
      {
        ...makeIncident(),
        availableAssignees: [{ id: "u3", name: "Assignee", email: "a@example.com" }],
      },
    ];
    vi.mocked(listIncidentInboxForUser).mockResolvedValue(inbox as never);

    const result = await (await import("@/modules/incident/incident.service")).listIncidentInbox("u3");

    expect(result).toEqual(inbox);
    expect(listIncidentInboxForUser).toHaveBeenCalledWith("u3");
  });
});

describe("incident.service — getIncidentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns incident when found", async () => {
    const incident = makeIncident();
    vi.mocked(findIncidentById).mockResolvedValue(incident);

    const result = await getIncidentById("incident-1");

    expect(result).toEqual(incident);
  });

  it("throws when incident not found", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(null);

    await expect(getIncidentById("nonexistent-id")).rejects.toThrow("Incident not found");
  });
});

describe("incident.service — deleteIncidentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when incident is deleted", async () => {
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(true);

    await expect(deleteIncidentById("incident-1")).resolves.toBeUndefined();
  });

  it("throws when incident not found", async () => {
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(false);

    await expect(deleteIncidentById("nonexistent-id")).rejects.toThrow("Incident not found");
  });
});

describe("incident.service — createIncident failure path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when populated incident cannot be fetched after creation", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue({
      id: "incident-1",
      incidentId: 1,
      teamId: 3,
      title: "Test",
      description: "Test",
      severity: "Low",
      status: "Open",
      boardOrder: 1000,
      createdBy: "u1",
      assignedBy: "u2",
      assignedTo: "u3",
      resolvedOn: null,
      closedOn: null,
      comment: null,
      sla: {
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        responseDueAt: new Date("2026-01-01T00:15:00.000Z"),
        resolutionDueAt: new Date("2026-01-01T04:00:00.000Z"),
        acknowledgedAt: null,
        state: "Running",
        stoppedAt: null,
        breachedResponse: false,
        breachedResolution: false,
      },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(findIncidentById).mockResolvedValue(null);

    await expect(
      createIncident({ teamId: 3, title: "Test", description: "Test", severity: "Low", status: "Open", assignedBy: "u2", assignedTo: "u3" }, "u1")
    ).rejects.toThrow("Failed to create incident");
  });
});

const minimalRepo = {
  id: "incident-1",
  incidentId: 1,
  teamId: 3,
  title: "Test",
  description: "Test",
  severity: "Low" as const,
  status: "Open" as const,
  boardOrder: 1000,
  createdBy: "u1",
  assignedBy: "u2",
  assignedTo: "u3",
  resolvedOn: null,
  closedOn: null,
  comment: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("incident.service — createIncident activity logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs incident_created activity using createdByName when actorName is not provided", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue(minimalRepo);
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ createdByName: "Creator" }));

    await createIncident(
      { teamId: 3, title: "Test", description: "Test", severity: "Low", assignedBy: "u2", assignedTo: "u3" },
      "u1"
    );

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_created", actorName: "Creator" })
    );
  });

  it("uses provided actorName for activity logging instead of createdByName", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue(minimalRepo);
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ createdByName: "Creator" }));

    await createIncident(
      { teamId: 3, title: "Test", description: "Test", severity: "Low", assignedBy: "u2", assignedTo: "u3" },
      "u1",
      "Custom Actor"
    );

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_created", actorName: "Custom Actor" })
    );
  });
});

describe("incident.service — updateIncidentById activity logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs incident_status_changed when status is updated", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await updateIncidentById("incident-1", { status: "Closed" }, "u1", "Actor");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_status_changed", metadata: { newStatus: "Closed" } })
    );
  });

  it("logs incident_severity_changed when severity is updated", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { severity: "High" }, "u1", "Actor");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_severity_changed", metadata: { newSeverity: "High" } })
    );
  });

  it("logs incident_assigned when assignedTo is updated", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedToName: "New Assignee" }));

    await updateIncidentById("incident-1", { assignedTo: "u4" }, "u1", "Actor");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_assigned", metadata: { assignedTo: "u4" } })
    );
  });

  it("logs incident_updated for other field changes", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { title: "New Title" }, "u1", "Actor");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_updated", metadata: { fields: ["title"] } })
    );
  });

  it("does not log activity when actorId is not provided", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { severity: "High" });

    expect(logActivity).not.toHaveBeenCalled();
  });

  it("converts resolvedOn string to Date in repository call", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { resolvedOn: "2026-01-01T00:00:00.000Z" });

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ resolvedOn: new Date("2026-01-01T00:00:00.000Z") })
    );
  });

  it("passes null resolvedOn through to repository", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { resolvedOn: null });

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ resolvedOn: null })
    );
  });

  it("recomputes SLA deadlines when severity changes", async () => {
    const existing = makeIncident({
      severity: "Medium",
      sla: {
        ...makeIncident().sla,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        acknowledgedAt: new Date("2026-01-01T00:10:00.000Z"),
      },
    });
    vi.mocked(findIncidentById).mockResolvedValue(existing);
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ severity: "High" }));

    await updateIncidentById("incident-1", { severity: "High" }, "u1", "Actor");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        responseDueAt: expect.any(Date),
        resolutionDueAt: expect.any(Date),
      })
    );
  });

  it("resets assignment workflow fields when reassigned", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u3", status: "In Progress" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedTo: "u4", status: "Open" }));

    await updateIncidentById("incident-1", { assignedTo: "u4" }, "u1", "Actor");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        assignedBy: "u1",
        assignedTo: "u4",
        status: "Open",
        acknowledgedAt: null,
        slaState: "Running",
        slaStoppedAt: null,
        resolvedOn: null,
        closedOn: null,
      })
    );
  });
});

describe("incident.service — acknowledgeIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when actor is not assignee", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(acknowledgeIncident("incident-1", "u1", "Actor")).rejects.toThrow(
      "Only the assigned user can acknowledge this ticket"
    );
  });

  it("throws when ticket is not open", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "In Progress" }));

    await expect(acknowledgeIncident("incident-1", "u1", "Actor")).rejects.toThrow(
      "Only open tickets can be acknowledged"
    );
  });

  it("updates ticket to In Progress when acknowledged", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "Open" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "In Progress" }));

    const result = await acknowledgeIncident("incident-1", "u1", "Actor");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "In Progress",
        acknowledgedAt: expect.any(Date),
      })
    );
    expect(result.status).toBe("In Progress");
  });
});

describe("incident.service — reassignIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when actor is not current assignee", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(reassignIncident("incident-1", "u4", "u1", "Actor")).rejects.toThrow(
      "Only the current assignee can reassign this ticket"
    );
  });

  it("throws when ticket is closed", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "Closed" }));

    await expect(reassignIncident("incident-1", "u4", "u1", "Actor")).rejects.toThrow(
      "Closed tickets cannot be reassigned"
    );
  });

  it("throws when next assignee is the same as current assignee", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1" }));

    await expect(reassignIncident("incident-1", "u1", "u1", "Actor")).rejects.toThrow(
      "Select a different teammate to reassign this ticket"
    );
  });

  it("resets workflow fields on successful reassignment", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "In Progress" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedTo: "u4", assignedToName: "New Assignee" }));

    const result = await reassignIncident("incident-1", "u4", "u1", "Actor");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        assignedBy: "u1",
        assignedTo: "u4",
        status: "Open",
        acknowledgedAt: null,
        closedOn: null,
        resolvedOn: null,
        slaState: "Running",
        slaStoppedAt: null,
      })
    );
    expect(result.assignedTo).toBe("u4");
  });
});

describe("incident.service — deleteIncidentById activity logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs incident_deleted when actorId, actorName, and incident are all present", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ incidentId: 1, teamId: 3 }));
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(true);

    await deleteIncidentById("incident-1", "u1", "Actor");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_deleted", actorId: "u1", actorName: "Actor" })
    );
  });

  it("does not log when incident is not found before deletion", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(null);
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(true);

    await deleteIncidentById("incident-1", "u1", "Actor");

    expect(logActivity).not.toHaveBeenCalled();
  });

  it("does not pre-fetch incident when actorId is absent", async () => {
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(true);

    await deleteIncidentById("incident-1");

    expect(findIncidentById).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
  });
});
