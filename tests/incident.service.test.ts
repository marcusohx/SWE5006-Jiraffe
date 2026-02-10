import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
import { createIncident, updateIncidentById } from "@/modules/incident/incident.service";
import {
  createIncident as createIncidentRepo,
  findIncidentById,
  updateIncidentById as updateIncidentByIdRepo,
} from "@/modules/incident/incident.repository";

vi.mock("@/modules/incident/incident.repository", () => ({
  createIncident: vi.fn(),
  deleteIncidentById: vi.fn(),
  findIncidentById: vi.fn(),
  listIncidents: vi.fn(),
  updateIncidentById: vi.fn(),
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
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Closed" }));

    await updateIncidentById("incident-1", { status: "Closed" });

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "Closed",
        closedOn: expect.any(Date),
      })
    );
  });

  it("clears closedOn when reopening incidents", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident({ status: "Open", closedOn: null }));

    await updateIncidentById("incident-1", { status: "Open" });

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "Open",
        closedOn: null,
      })
    );
  });

  it("does not change closedOn when status is not updated", async () => {
    vi.mocked(updateIncidentByIdRepo).mockResolvedValue(makeIncident());

    await updateIncidentById("incident-1", { severity: "High" });

    expect(updateIncidentByIdRepo).toHaveBeenCalledWith("incident-1", expect.not.objectContaining({ closedOn: null }));
    expect(updateIncidentByIdRepo).toHaveBeenCalledWith("incident-1", expect.not.objectContaining({ closedOn: expect.any(Date) }));
  });
});
