import type { IncidentSeverity } from "@/modules/incident/incident.model";

export type IncidentSlaState = "Running" | "Stopped";

export interface IncidentSlaPolicy {
  responseMinutes: number;
  resolutionMinutes: number;
}

export interface IncidentSlaSnapshot {
  startedAt: Date;
  responseDueAt: Date;
  resolutionDueAt: Date;
  acknowledgedAt: Date | null;
  state: IncidentSlaState;
  stoppedAt: Date | null;
  breachedResponse: boolean;
  breachedResolution: boolean;
}

const MINUTE_MS = 60 * 1000;

const SLA_POLICY_BY_SEVERITY: Record<IncidentSeverity, IncidentSlaPolicy> = {
  Critical: { responseMinutes: 15, resolutionMinutes: 4 * 60 },
  High: { responseMinutes: 30, resolutionMinutes: 8 * 60 },
  Medium: { responseMinutes: 60, resolutionMinutes: 24 * 60 },
  Low: { responseMinutes: 4 * 60, resolutionMinutes: 72 * 60 },
};

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function getIncidentSlaPolicy(severity: IncidentSeverity): IncidentSlaPolicy {
  return SLA_POLICY_BY_SEVERITY[severity];
}

export function listIncidentSlaPolicies(): Array<{ severity: IncidentSeverity } & IncidentSlaPolicy> {
  return (Object.keys(SLA_POLICY_BY_SEVERITY) as IncidentSeverity[]).map((severity) => ({
    severity,
    ...SLA_POLICY_BY_SEVERITY[severity],
  }));
}

export function createIncidentSlaSnapshot(
  severity: IncidentSeverity,
  startedAt: Date = new Date()
): IncidentSlaSnapshot {
  const policy = getIncidentSlaPolicy(severity);

  return {
    startedAt,
    responseDueAt: addMinutes(startedAt, policy.responseMinutes),
    resolutionDueAt: addMinutes(startedAt, policy.resolutionMinutes),
    acknowledgedAt: null,
    state: "Running",
    stoppedAt: null,
    breachedResponse: false,
    breachedResolution: false,
  };
}

export function recomputeIncidentSlaSnapshot(
  severity: IncidentSeverity,
  base: Pick<IncidentSlaSnapshot, "startedAt" | "acknowledgedAt" | "state" | "stoppedAt">,
  now: Date = new Date()
): IncidentSlaSnapshot {
  const policy = getIncidentSlaPolicy(severity);
  const responseDueAt = addMinutes(base.startedAt, policy.responseMinutes);
  const resolutionDueAt = addMinutes(base.startedAt, policy.resolutionMinutes);

  return {
    startedAt: base.startedAt,
    responseDueAt,
    resolutionDueAt,
    acknowledgedAt: base.acknowledgedAt,
    state: base.state,
    stoppedAt: base.stoppedAt,
    breachedResponse: !base.acknowledgedAt && now > responseDueAt,
    breachedResolution: base.state !== "Stopped" && now > resolutionDueAt,
  };
}
