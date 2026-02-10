import { describe, expect, it } from "vitest";
import type { IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";
import { moveIncidentInMemory, resolveDropTarget } from "@/components/board/board-dnd-utils";

let incidentSequence = 1;

function makeIncident(id: string, status: IncidentStatus, boardOrder: number): IncidentWithNames {
  return {
    id,
    incidentId: incidentSequence++,
    teamId: 1,
    title: `Incident ${id}`,
    description: "desc",
    severity: "Low",
    status,
    boardOrder,
    createdBy: "u1",
    assignedBy: "u1",
    assignedTo: "u1",
    resolvedOn: null,
    closedOn: null,
    comment: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdByName: "A",
    assignedByName: "B",
    assignedToName: "C",
  };
}

describe("board-dnd-utils", () => {
  const base = [
    makeIncident("open-1", "Open", 1000),
    makeIncident("prog-1", "In Progress", 1000),
    makeIncident("prog-2", "In Progress", 2000),
    makeIncident("closed-1", "Closed", 1000),
  ];

  it("reorders within same lane from bottom to top", () => {
    const moved = moveIncidentInMemory({
      incidents: base,
      activeId: "prog-2",
      targetStatus: "In Progress",
      targetIndex: 0,
    });

    expect(moved).not.toBeNull();
    expect(moved?.statusChanged).toBe(false);
    expect(moved?.indexChanged).toBe(true);
    const inProgress = moved!.incidents.filter((ticket) => ticket.status === "In Progress");
    expect(inProgress.map((ticket) => ticket.id)).toEqual(["prog-2", "prog-1"]);
  });

  it("reorders within same lane from top to bottom", () => {
    const moved = moveIncidentInMemory({
      incidents: base,
      activeId: "prog-1",
      targetStatus: "In Progress",
      targetIndex: 2,
    });

    expect(moved).not.toBeNull();
    const inProgress = moved!.incidents.filter((ticket) => ticket.status === "In Progress");
    expect(inProgress.map((ticket) => ticket.id)).toEqual(["prog-2", "prog-1"]);
  });

  it("moves across lanes and inserts before target", () => {
    const moved = moveIncidentInMemory({
      incidents: base,
      activeId: "open-1",
      targetStatus: "In Progress",
      targetIndex: 0,
    });

    expect(moved).not.toBeNull();
    expect(moved?.statusChanged).toBe(true);
    const inProgress = moved!.incidents.filter((ticket) => ticket.status === "In Progress");
    expect(inProgress.map((ticket) => ticket.id)).toEqual(["open-1", "prog-1", "prog-2"]);
  });

  it("returns no index change when dropped in same position", () => {
    const moved = moveIncidentInMemory({
      incidents: base,
      activeId: "prog-1",
      targetStatus: "In Progress",
      targetIndex: 0,
    });

    expect(moved).not.toBeNull();
    expect(moved?.statusChanged).toBe(false);
    expect(moved?.indexChanged).toBe(false);
  });

  it("resolves pointer zones with medium dead-zone", () => {
    const beforeTarget = resolveDropTarget({
      overId: "prog-1",
      overData: { type: "ticket", status: "In Progress" },
      incidents: base,
      pointerY: 102,
      overTop: 100,
      overHeight: 40,
      deadZoneRatio: 0.15,
    });

    const afterTarget = resolveDropTarget({
      overId: "prog-1",
      overData: { type: "ticket", status: "In Progress" },
      incidents: base,
      pointerY: 138,
      overTop: 100,
      overHeight: 40,
      deadZoneRatio: 0.15,
    });

    expect(beforeTarget).toEqual({ targetStatus: "In Progress", targetIndex: 0 });
    expect(afterTarget).toEqual({ targetStatus: "In Progress", targetIndex: 1 });
  });

  it("resolves center zone by current pointer position", () => {
    const target = resolveDropTarget({
      overId: "prog-1",
      overData: { type: "ticket", status: "In Progress" },
      incidents: base,
      pointerY: 120,
      overTop: 100,
      overHeight: 40,
      deadZoneRatio: 0.15,
    });

    expect(target).toEqual({ targetStatus: "In Progress", targetIndex: 0 });
  });

  it("resolves column drop to append", () => {
    const target = resolveDropTarget({
      overId: "column-In Progress",
      overData: { type: "column", status: "In Progress" },
      incidents: base,
      pointerY: null,
    });

    expect(target).toEqual({ targetStatus: "In Progress", targetIndex: 2 });
  });

  it("keeps previous in-lane index when collision falls back to column", () => {
    const target = resolveDropTarget({
      overId: "column-Closed",
      overData: { type: "column", status: "Closed" },
      incidents: base,
      pointerY: null,
      previousTarget: { targetStatus: "Closed", targetIndex: 0 },
    });

    expect(target).toEqual({ targetStatus: "Closed", targetIndex: 0 });
  });

  it("uses pointer position to resolve top index when over column", () => {
    const target = resolveDropTarget({
      overId: "column-Closed",
      overData: { type: "column", status: "Closed" },
      incidents: [
        makeIncident("closed-1", "Closed", 1000),
        makeIncident("closed-2", "Closed", 2000),
        makeIncident("closed-3", "Closed", 3000),
      ],
      pointerY: 105,
      overTop: 100,
      overHeight: 300,
    });

    expect(target).toEqual({ targetStatus: "Closed", targetIndex: 0 });
  });

  it("column index excludes active card from count", () => {
    const target = resolveDropTarget({
      overId: "column-In Progress",
      overData: { type: "column", status: "In Progress" },
      incidents: base,
      activeId: "prog-1",
      pointerY: 100,
      overTop: 100,
      overHeight: 200,
    });

    // visibleCount = 1 (prog-2 only), ratio = 0 → index 0
    expect(target).toEqual({ targetStatus: "In Progress", targetIndex: 0 });
  });

  it("resolves empty column drop to index 0", () => {
    const incidents = [makeIncident("open-1", "Open", 1000)];
    const target = resolveDropTarget({
      overId: "column-In Progress",
      overData: { type: "column", status: "In Progress" },
      incidents,
      activeId: "open-1",
      pointerY: 150,
      overTop: 100,
      overHeight: 96,
    });

    // visibleCount = 0 → Math.round(anything * 0) = 0
    expect(target).toEqual({ targetStatus: "In Progress", targetIndex: 0 });
  });

  it("returns stable target on repeated center-zone resolution", () => {
    const first = resolveDropTarget({
      overId: "prog-1",
      overData: { type: "ticket", status: "In Progress" },
      incidents: base,
      pointerY: 120,
      overTop: 100,
      overHeight: 40,
      deadZoneRatio: 0.15,
    });

    const second = resolveDropTarget({
      overId: "prog-1",
      overData: { type: "ticket", status: "In Progress" },
      incidents: base,
      pointerY: 120,
      overTop: 100,
      overHeight: 40,
      deadZoneRatio: 0.15,
    });

    expect(second).toEqual(first);
  });
});
