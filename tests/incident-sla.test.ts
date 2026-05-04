import { describe, expect, it } from "vitest";
import {
  createIncidentSlaSnapshot,
  getIncidentSlaPolicy,
  listIncidentSlaPolicies,
  recomputeIncidentSlaSnapshot,
} from "@/modules/incident/incident-sla";

describe("getIncidentSlaPolicy", () => {
  it("returns Critical policy with 15min response and 4h resolution", () => {
    expect(getIncidentSlaPolicy("Critical")).toEqual({ responseMinutes: 15, resolutionMinutes: 240 });
  });

  it("returns Low policy with 4h response and 72h resolution", () => {
    expect(getIncidentSlaPolicy("Low")).toEqual({ responseMinutes: 240, resolutionMinutes: 72 * 60 });
  });
});

describe("listIncidentSlaPolicies", () => {
  it("lists all four severities with their policies", () => {
    const result = listIncidentSlaPolicies();
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.severity)).toEqual(["Critical", "High", "Medium", "Low"]);
  });

  it("includes the response and resolution minutes in each entry", () => {
    const result = listIncidentSlaPolicies();
    const critical = result.find((p) => p.severity === "Critical");
    expect(critical).toEqual({ severity: "Critical", responseMinutes: 15, resolutionMinutes: 240 });
  });
});

describe("createIncidentSlaSnapshot", () => {
  it("creates running snapshot with response and resolution due dates", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z");
    const snapshot = createIncidentSlaSnapshot("Critical", startedAt);
    expect(snapshot.startedAt).toEqual(startedAt);
    expect(snapshot.responseDueAt).toEqual(new Date("2026-01-01T00:15:00.000Z"));
    expect(snapshot.resolutionDueAt).toEqual(new Date("2026-01-01T04:00:00.000Z"));
    expect(snapshot.state).toBe("Running");
    expect(snapshot.acknowledgedAt).toBeNull();
    expect(snapshot.breachedResponse).toBe(false);
    expect(snapshot.breachedResolution).toBe(false);
  });

  it("uses current time when startedAt is omitted", () => {
    const snapshot = createIncidentSlaSnapshot("Low");
    const now = Date.now();
    expect(Math.abs(snapshot.startedAt.getTime() - now)).toBeLessThan(1000);
  });
});

describe("recomputeIncidentSlaSnapshot", () => {
  const startedAt = new Date("2026-01-01T00:00:00.000Z");

  it("flags response breach when not acknowledged and now is past response due", () => {
    const now = new Date("2026-01-01T00:30:00.000Z");
    const snapshot = recomputeIncidentSlaSnapshot(
      "Critical",
      { startedAt, acknowledgedAt: null, state: "Running", stoppedAt: null },
      now
    );
    expect(snapshot.breachedResponse).toBe(true);
  });

  it("does not flag response breach when already acknowledged", () => {
    const now = new Date("2026-01-01T00:30:00.000Z");
    const snapshot = recomputeIncidentSlaSnapshot(
      "Critical",
      {
        startedAt,
        acknowledgedAt: new Date("2026-01-01T00:10:00.000Z"),
        state: "Running",
        stoppedAt: null,
      },
      now
    );
    expect(snapshot.breachedResponse).toBe(false);
  });

  it("flags resolution breach when state is running past resolution due", () => {
    const now = new Date("2026-01-01T05:00:00.000Z");
    const snapshot = recomputeIncidentSlaSnapshot(
      "Critical",
      { startedAt, acknowledgedAt: null, state: "Running", stoppedAt: null },
      now
    );
    expect(snapshot.breachedResolution).toBe(true);
  });

  it("does not flag resolution breach when state is stopped", () => {
    const now = new Date("2026-01-01T05:00:00.000Z");
    const snapshot = recomputeIncidentSlaSnapshot(
      "Critical",
      {
        startedAt,
        acknowledgedAt: null,
        state: "Stopped",
        stoppedAt: new Date("2026-01-01T04:30:00.000Z"),
      },
      now
    );
    expect(snapshot.breachedResolution).toBe(false);
  });
});
