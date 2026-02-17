import type { IncidentSeverity, IncidentStatus } from "@/modules/incident/incident.model";

export const STATUS_OPTIONS: IncidentStatus[] = ["Open", "In Progress", "Closed"];
export const SEVERITY_OPTIONS: IncidentSeverity[] = ["Critical", "High", "Medium", "Low"];

export const statusVariant: Record<IncidentStatus, "default" | "info" | "success"> = {
  Open: "default",
  "In Progress": "info",
  Closed: "success",
};

export const severityVariant: Record<IncidentSeverity, "default" | "info" | "warning" | "danger"> = {
  Low: "default",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

export const statusOrder: Record<IncidentStatus, number> = {
  Open: 0,
  "In Progress": 1,
  Closed: 2,
};

export const severityOrder: Record<IncidentSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
