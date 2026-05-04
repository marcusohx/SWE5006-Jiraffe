import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http-error";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
import {
  acknowledgeIncident,
  createIncident,
  deleteIncidentById,
  getIncidentById,
  listIncidentInbox,
  listIncidents,
  reassignIncident,
  updateIncidentById,
} from "@/modules/incident/incident.service";
import {
  createIncident as createIncidentRepo,
  deleteIncidentById as deleteIncidentByIdRepo,
  findIncidentById,
  findIncidentByIdForUser,
  listIncidentInboxForUser,
  listIncidents as listIncidentsRepo,
  listIncidentsForUser,
  updateIncidentById as updateIncidentByIdRepo,
} from "@/modules/incident/incident.repository";
import { logActivity } from "@/modules/activity/activity.service";

vi.mock("@/modules/incident/incident.repository", () => ({
  createIncident: vi.fn(),
  deleteIncidentById: vi.fn(),
  findIncidentById: vi.fn(),
  findIncidentByIdForUser: vi.fn(),
  listIncidentInboxForUser: vi.fn(),
  listIncidents: vi.fn(),
  listIncidentsForUser: vi.fn(),
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
  sla: {
    startedAt: new Date("2026-01-01T00:00:00.000Z"),
    responseDueAt: new Date("2026-01-01T00:15:00.000Z"),
    resolutionDueAt: new Date("2026-01-01T04:00:00.000Z"),
    acknowledgedAt: null,
    state: "Running" as const,
    stoppedAt: null,
    breachedResponse: false,
    breachedResolution: false,
  },
};

describe("incident.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets boardOrder when creating incidents", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue(minimalRepo as never);
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
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await updateIncidentById("incident-1", { status: "Closed" }, "u1", "User One", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "Closed",
        closedOn: expect.any(Date),
      })
    );
  });

  it("clears closedOn when reopening incidents", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({ status: "Closed", assignedTo: "u1", sla: { ...makeIncident().sla, state: "Stopped" } })
    );
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Open", closedOn: null }));

    await updateIncidentById("incident-1", { status: "Open" }, "u1", "User One", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "Open",
        closedOn: null,
      })
    );
  });

  it("does not change closedOn when status is not updated", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident());
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { severity: "High" }, "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith("incident-1", expect.not.objectContaining({ closedOn: null }));
    expect(updateIncidentByIdRepo).toHaveBeenCalledWith("incident-1", expect.not.objectContaining({ closedOn: expect.any(Date) }));
  });

  it("clears closedOn when status changes to In Progress", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "In Progress", closedOn: null }));

    await updateIncidentById("incident-1", { status: "In Progress" }, "u1", "User One", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ status: "In Progress", closedOn: null })
    );
  });

  it("throws when no updates provided", async () => {
    await expect(updateIncidentById("incident-1", {}, "u1", "Actor", "user")).rejects.toThrow("No updates provided");
  });

  it("throws when incident not found", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(null);

    await expect(updateIncidentById("incident-1", { severity: "High" }, "u1", "Actor", "user")).rejects.toThrow("Incident not found");
  });

  it("throws when a non-assignee tries to close a ticket", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(updateIncidentById("incident-1", { status: "Closed" }, "u1", "User One", "user")).rejects.toThrow(
      "Only the assigned user can close this ticket"
    );
  });

  it("allows admin to close a ticket they are not assigned to", async () => {
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ assignedTo: "u3" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await expect(updateIncidentById("incident-1", { status: "Closed" }, "admin-1", "Admin", "admin")).resolves.toBeTruthy();
  });
});

describe("incident.service - listIncidents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses repository-wide list for admins", async () => {
    const incidents = [makeIncident(), makeIncident({ id: "incident-2", incidentId: 2 })];
    vi.mocked(listIncidentsRepo).mockResolvedValue(incidents);

    const result = await listIncidents("admin-1", "admin");

    expect(result).toEqual(incidents);
    expect(listIncidentsRepo).toHaveBeenCalledTimes(1);
  });

  it("uses scoped list for non-admins", async () => {
    const incidents = [makeIncident()];
    vi.mocked(listIncidentsForUser).mockResolvedValue(incidents);

    const result = await listIncidents("u1", "user");

    expect(result).toEqual(incidents);
    expect(listIncidentsForUser).toHaveBeenCalledWith("u1");
  });
});

describe("incident.service - listIncidentInbox", () => {
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

    const result = await listIncidentInbox("u3");

    expect(result).toEqual(inbox);
    expect(listIncidentInboxForUser).toHaveBeenCalledWith("u3");
  });
});

describe("incident.service - getIncidentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns incident when found for admin", async () => {
    const incident = makeIncident();
    vi.mocked(findIncidentById).mockResolvedValue(incident);

    const result = await getIncidentById("incident-1", "admin-1", "admin");

    expect(result).toEqual(incident);
  });

  it("returns incident when found for non-admin", async () => {
    const incident = makeIncident();
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(incident);

    const result = await getIncidentById("incident-1", "u1", "user");

    expect(result).toEqual(incident);
  });

  it("throws HttpError when incident not found", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(null);

    await expect(getIncidentById("nonexistent-id", "u1", "user")).rejects.toThrow("Incident not found");
    await expect(getIncidentById("nonexistent-id", "u1", "user")).rejects.toBeInstanceOf(HttpError);
  });
});

describe("incident.service - deleteIncidentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when incident is deleted", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident());
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(true);

    await expect(deleteIncidentById("incident-1", "u1", "Actor", "user")).resolves.toBeUndefined();
  });

  it("throws when incident not found", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident());
    vi.mocked(deleteIncidentByIdRepo).mockResolvedValue(false);

    await expect(deleteIncidentById("nonexistent-id", "u1", "Actor", "user")).rejects.toThrow("Incident not found");
  });
});

describe("incident.service - createIncident failure path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when populated incident cannot be fetched after creation", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue(minimalRepo as never);
    vi.mocked(findIncidentById).mockResolvedValue(null);

    await expect(
      createIncident({ teamId: 3, title: "Test", description: "Test", severity: "Low", status: "Open", assignedBy: "u2", assignedTo: "u3" }, "u1")
    ).rejects.toThrow("Failed to create incident");
  });
});

describe("incident.service - activity logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs incident_created activity using createdByName when actorName is not provided", async () => {
    vi.mocked(createIncidentRepo).mockResolvedValue(minimalRepo as never);
    vi.mocked(findIncidentById).mockResolvedValue(makeIncident({ createdByName: "Creator" }));

    await createIncident(
      { teamId: 3, title: "Test", description: "Test", severity: "Low", assignedBy: "u2", assignedTo: "u3" },
      "u1"
    );

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_created", actorName: "Creator" })
    );
  });

  it("logs incident_status_changed when status is updated", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await updateIncidentById("incident-1", { status: "Closed" }, "u1", "Actor", "user");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_status_changed", metadata: { newStatus: "Closed" } })
    );
  });

  it("logs incident_updated for other field changes", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident());
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { title: "New Title" }, "u1", "Actor", "user");

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_updated", metadata: { fields: ["title"] } })
    );
  });
});

describe("incident.service - acknowledgeIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when actor is not assignee", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(acknowledgeIncident("incident-1", "u1", "Actor", "user")).rejects.toThrow(
      "Only the assigned user can acknowledge this ticket"
    );
  });

  it("throws when ticket is not Open", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({ assignedTo: "u1", status: "In Progress" })
    );

    await expect(acknowledgeIncident("incident-1", "u1", "Actor", "user")).rejects.toThrow(
      "Only open tickets can be acknowledged"
    );
  });

  it("throws when repository returns null after update", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({ assignedTo: "u1", status: "Open" })
    );
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(null);

    await expect(acknowledgeIncident("incident-1", "u1", "Actor", "user")).rejects.toThrow(
      "Incident not found"
    );
  });

  it("updates ticket to In Progress when acknowledged", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "Open" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "In Progress" }));

    const result = await acknowledgeIncident("incident-1", "u1", "Actor", "user");

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

describe("incident.service - reassignIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when non-admin tries to reassign someone else's ticket", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(reassignIncident("incident-1", "u4", "u1", "Actor", "user")).rejects.toThrow(
      "Only the current assignee can reassign this ticket"
    );
  });

  it("throws when reassigning a Closed ticket", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({ assignedTo: "u1", status: "Closed" })
    );

    await expect(reassignIncident("incident-1", "u4", "u1", "Actor", "user")).rejects.toThrow(
      "Closed tickets cannot be reassigned"
    );
  });

  it("throws when reassigning to self", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));

    await expect(reassignIncident("incident-1", "u1", "u1", "Actor", "user")).rejects.toThrow(
      "Select a different teammate to reassign this ticket"
    );
  });

  it("throws when repository returns null after update", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(null);

    await expect(reassignIncident("incident-1", "u4", "u1", "Actor", "user")).rejects.toThrow(
      "Incident not found"
    );
  });

  it("reassigns and resets sla state when assignee is the current actor", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(
      makeIncident({ assignedTo: "u4", assignedToName: "User Four" })
    );

    const result = await reassignIncident("incident-1", "u4", "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        assignedBy: "u1",
        assignedTo: "u4",
        status: "Open",
        acknowledgedAt: null,
        slaState: "Running",
      })
    );
    expect(result.assignedTo).toBe("u4");
  });
});

describe("incident.service - updateIncidentById SLA branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auto-acknowledges when moving to In Progress without prior acknowledgment", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({ assignedTo: "u1", status: "Open" })
    );
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "In Progress" }));

    await updateIncidentById("incident-1", { status: "In Progress" }, "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ acknowledgedAt: expect.any(Date) })
    );
  });

  it("stops SLA and sets resolvedOn when closing", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({ assignedTo: "u1", status: "In Progress" })
    );
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await updateIncidentById("incident-1", { status: "Closed" }, "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        slaState: "Stopped",
        slaStoppedAt: expect.any(Date),
        resolvedOn: expect.any(Date),
      })
    );
  });

  it("recomputes SLA dates when severity changes", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident());
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { severity: "Critical" }, "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        responseDueAt: expect.any(Date),
        resolutionDueAt: expect.any(Date),
      })
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: "incident_severity_changed",
      })
    );
  });

  it("restarts SLA when reopening a Stopped ticket", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(
      makeIncident({
        assignedTo: "u1",
        status: "Closed",
        sla: {
          ...makeIncident().sla,
          state: "Stopped",
          stoppedAt: new Date(),
        },
      })
    );
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Open" }));

    await updateIncidentById("incident-1", { status: "Open" }, "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ slaState: "Running", slaStoppedAt: null })
    );
  });

  it("clears SLA acknowledgment and reassigns when assignedTo changes", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedTo: "u4" }));

    await updateIncidentById("incident-1", { assignedTo: "u4" }, "u1", "Actor", "user");

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        assignedBy: "u1",
        assignedTo: "u4",
        acknowledgedAt: null,
        slaState: "Running",
        status: "Open",
      })
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "incident_assigned" })
    );
  });

  it("rejects non-assignee non-admin moving ticket to In Progress", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(
      updateIncidentById("incident-1", { status: "In Progress" }, "u1", "Actor", "user")
    ).rejects.toThrow("Only the assigned user can move this ticket to In Progress");
  });
});

describe("incident.service - reassignIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when actor is not current assignee", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u3" }));

    await expect(reassignIncident("incident-1", "u4", "u1", "Actor", "user")).rejects.toThrow(
      "Only the current assignee can reassign this ticket"
    );
  });

  it("resets workflow fields on successful reassignment", async () => {
    vi.mocked(findIncidentByIdForUser).mockResolvedValue(makeIncident({ assignedTo: "u1", status: "In Progress" }));
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ assignedTo: "u4", assignedToName: "New Assignee" }));

    const result = await reassignIncident("incident-1", "u4", "u1", "Actor", "user");

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
