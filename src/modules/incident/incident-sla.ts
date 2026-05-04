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

export interface SlaStrategy {
  readonly severity: IncidentSeverity;
  getPolicy(): IncidentSlaPolicy;
  createSnapshot(startedAt?: Date): IncidentSlaSnapshot;
  recomputeSnapshot(
    base: Pick<IncidentSlaSnapshot, "startedAt" | "acknowledgedAt" | "state" | "stoppedAt">,
    now?: Date
  ): IncidentSlaSnapshot;
}

const MINUTE_MS = 60 * 1000;

const DEFAULT_SLA_POLICY_BY_SEVERITY: Record<IncidentSeverity, IncidentSlaPolicy> = {
  Critical: { responseMinutes: 15, resolutionMinutes: 4 * 60 },
  High: { responseMinutes: 30, resolutionMinutes: 8 * 60 },
  Medium: { responseMinutes: 60, resolutionMinutes: 24 * 60 },
  Low: { responseMinutes: 4 * 60, resolutionMinutes: 72 * 60 },
};

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

abstract class BaseSlaStrategy implements SlaStrategy {
  readonly severity: IncidentSeverity;
  protected readonly policy: IncidentSlaPolicy;

  protected constructor(severity: IncidentSeverity, policy: IncidentSlaPolicy) {
    this.severity = severity;
    this.policy = policy;
  }

  getPolicy(): IncidentSlaPolicy {
    return this.policy;
  }

  createSnapshot(startedAt: Date = new Date()): IncidentSlaSnapshot {
    return {
      startedAt,
      responseDueAt: addMinutes(startedAt, this.policy.responseMinutes),
      resolutionDueAt: addMinutes(startedAt, this.policy.resolutionMinutes),
      acknowledgedAt: null,
      state: "Running",
      stoppedAt: null,
      breachedResponse: false,
      breachedResolution: false,
    };
  }

  recomputeSnapshot(
    base: Pick<IncidentSlaSnapshot, "startedAt" | "acknowledgedAt" | "state" | "stoppedAt">,
    now: Date = new Date()
  ): IncidentSlaSnapshot {
    const responseDueAt = addMinutes(base.startedAt, this.policy.responseMinutes);
    const resolutionDueAt = addMinutes(base.startedAt, this.policy.resolutionMinutes);

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
}

class CriticalSlaStrategy extends BaseSlaStrategy {
  constructor(policy: IncidentSlaPolicy) {
    super("Critical", policy);
  }
}

class HighSlaStrategy extends BaseSlaStrategy {
  constructor(policy: IncidentSlaPolicy) {
    super("High", policy);
  }
}

class MediumSlaStrategy extends BaseSlaStrategy {
  constructor(policy: IncidentSlaPolicy) {
    super("Medium", policy);
  }
}

class LowSlaStrategy extends BaseSlaStrategy {
  constructor(policy: IncidentSlaPolicy) {
    super("Low", policy);
  }
}

export function getDefaultIncidentSlaPolicy(severity: IncidentSeverity): IncidentSlaPolicy {
  return DEFAULT_SLA_POLICY_BY_SEVERITY[severity];
}

export function createSlaStrategy(
  severity: IncidentSeverity,
  policy: IncidentSlaPolicy = getDefaultIncidentSlaPolicy(severity)
): SlaStrategy {
  switch (severity) {
    case "Critical":
      return new CriticalSlaStrategy(policy);
    case "High":
      return new HighSlaStrategy(policy);
    case "Medium":
      return new MediumSlaStrategy(policy);
    case "Low":
      return new LowSlaStrategy(policy);
  }
}

export function getIncidentSlaPolicy(
  severity: IncidentSeverity,
  policy: IncidentSlaPolicy = getDefaultIncidentSlaPolicy(severity)
): IncidentSlaPolicy {
  return createSlaStrategy(severity, policy).getPolicy();
}

export function listIncidentSlaPolicies(): Array<{ severity: IncidentSeverity } & IncidentSlaPolicy> {
  return (Object.keys(DEFAULT_SLA_POLICY_BY_SEVERITY) as IncidentSeverity[]).map((severity) => ({
    severity,
    ...DEFAULT_SLA_POLICY_BY_SEVERITY[severity],
  }));
}

export function createIncidentSlaSnapshot(
  severity: IncidentSeverity,
  startedAt: Date = new Date(),
  policy: IncidentSlaPolicy = getDefaultIncidentSlaPolicy(severity)
): IncidentSlaSnapshot {
  return createSlaStrategy(severity, policy).createSnapshot(startedAt);
}

export function recomputeIncidentSlaSnapshot(
  severity: IncidentSeverity,
  base: Pick<IncidentSlaSnapshot, "startedAt" | "acknowledgedAt" | "state" | "stoppedAt">,
  now: Date = new Date(),
  policy: IncidentSlaPolicy = getDefaultIncidentSlaPolicy(severity)
): IncidentSlaSnapshot {
  return createSlaStrategy(severity, policy).recomputeSnapshot(base, now);
}
