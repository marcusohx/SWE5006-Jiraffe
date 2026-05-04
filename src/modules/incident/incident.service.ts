import { HttpError } from "@/lib/http-error";
import { formatIncidentCode } from "@/lib/utils";
import { logActivity } from "@/modules/activity/activity.service";
import type { CreateIncidentInput, UpdateIncidentInput } from "@/modules/incident/incident.dto";
import { recomputeIncidentSlaSnapshot } from "@/modules/incident/incident-sla";
import type { IncidentWithNames, UpdateIncidentRepositoryInput } from "@/modules/incident/incident.model";
import {
  createIncident as createIncidentRepo,
  deleteIncidentById as deleteIncidentByIdRepo,
  findIncidentById,
  findIncidentByIdForUser,
  listIncidentInboxForUser,
  listIncidents as listIncidentsRepo,
  listIncidentsForUser,
  updateIncidentById as updateIncidentByIdRepo,
  type IncidentInboxItem,
} from "@/modules/incident/incident.repository";

function toOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function logIncidentUpdateActivity(
  incident: IncidentWithNames,
  input: UpdateIncidentInput,
  actorId: string,
  actorName: string
): void {
  const label = formatIncidentCode(incident.incidentId);
  const base = { actorId, actorName, entityType: "incident" as const, entityId: incident.id, entityLabel: label, teamId: incident.teamId };

  if (input.status !== undefined) {
    logActivity({ ...base, activityType: "incident_status_changed", description: `${actorName} moved ${label} to ${input.status}`, metadata: { newStatus: input.status } });
  } else if (input.severity !== undefined) {
    logActivity({ ...base, activityType: "incident_severity_changed", description: `${actorName} changed ${label} severity to ${input.severity}`, metadata: { newSeverity: input.severity } });
  } else if (input.assignedTo !== undefined) {
    logActivity({ ...base, activityType: "incident_assigned", description: `${actorName} assigned ${label} to ${incident.assignedToName}`, metadata: { assignedTo: input.assignedTo } });
  } else {
    logActivity({ ...base, activityType: "incident_updated", description: `${actorName} updated ${label}`, metadata: { fields: Object.keys(input) } });
  }
}

export async function listIncidents(
  userId: string,
  role: "user" | "admin"
): Promise<IncidentWithNames[]> {
  return role === "admin" ? listIncidentsRepo() : listIncidentsForUser(userId);
}

export async function listIncidentInbox(userId: string): Promise<IncidentInboxItem[]> {
  return listIncidentInboxForUser(userId);
}

export async function getIncidentById(
  id: string,
  userId: string,
  role: "user" | "admin"
): Promise<IncidentWithNames> {
  const incident = role === "admin" ? await findIncidentById(id) : await findIncidentByIdForUser(id, userId);
  if (!incident) {
    throw new HttpError(404, "Incident not found");
  }
  return incident;
}

export async function createIncident(
  input: CreateIncidentInput,
  userId: string,
  actorName?: string
): Promise<IncidentWithNames> {
  const created = await createIncidentRepo({
    teamId: input.teamId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status ?? "Open",
    boardOrder: Date.now(),
    createdBy: userId,
    assignedBy: input.assignedBy,
    assignedTo: input.assignedTo,
    comment: input.comment ?? null,
  });

  const populated = await findIncidentById(created.id);
  if (!populated) {
    throw new Error("Failed to create incident");
  }

  const name = actorName ?? populated.createdByName;
  const label = formatIncidentCode(populated.incidentId);
  logActivity({
    actorId: userId,
    actorName: name,
    activityType: "incident_created",
    entityType: "incident",
    entityId: populated.id,
    entityLabel: label,
    teamId: populated.teamId,
    description: `${name} created ${label}`,
    metadata: { severity: populated.severity, status: populated.status },
  });

  return populated;
}

function applyClosedOnDefaults(input: UpdateIncidentInput): UpdateIncidentInput {
  const updates: UpdateIncidentInput = { ...input };
  if (input.status === "Closed" && !input.closedOn) {
    updates.closedOn = new Date().toISOString();
  }
  if (input.status === "Open" || input.status === "In Progress") {
    updates.closedOn = null;
  }
  return updates;
}

function assertStatusAuthorized(
  updates: UpdateIncidentInput,
  existing: IncidentWithNames,
  actorId: string,
  role: "user" | "admin"
): void {
  if (role === "admin" || existing.assignedTo === actorId) {
    return;
  }
  if (updates.status === "Closed") {
    throw new Error("Only the assigned user can close this ticket");
  }
  if (updates.status === "In Progress") {
    throw new Error("Only the assigned user can move this ticket to In Progress");
  }
}

function applyAssignmentSideEffects(
  repositoryUpdates: UpdateIncidentRepositoryInput,
  updates: UpdateIncidentInput,
  existing: IncidentWithNames,
  actorId: string
): void {
  if (updates.assignedTo === undefined || updates.assignedTo === existing.assignedTo) {
    return;
  }
  repositoryUpdates.assignedBy = actorId;
  repositoryUpdates.acknowledgedAt = null;
  repositoryUpdates.slaState = "Running";
  repositoryUpdates.slaStoppedAt = null;
  repositoryUpdates.resolvedOn = null;
  repositoryUpdates.closedOn = null;
  if (updates.status === undefined) {
    repositoryUpdates.status = "Open";
  }
}

function applySeveritySideEffects(
  repositoryUpdates: UpdateIncidentRepositoryInput,
  updates: UpdateIncidentInput,
  existing: IncidentWithNames
): void {
  if (updates.severity === undefined) {
    return;
  }
  const nextSla = recomputeIncidentSlaSnapshot(updates.severity, {
    startedAt: existing.sla.startedAt,
    acknowledgedAt: existing.sla.acknowledgedAt,
    state: existing.sla.state,
    stoppedAt: existing.sla.stoppedAt,
  });
  repositoryUpdates.responseDueAt = nextSla.responseDueAt;
  repositoryUpdates.resolutionDueAt = nextSla.resolutionDueAt;
}

function applyStatusSideEffects(
  repositoryUpdates: UpdateIncidentRepositoryInput,
  updates: UpdateIncidentInput,
  existing: IncidentWithNames
): void {
  if (updates.status === "In Progress" && !existing.sla.acknowledgedAt) {
    repositoryUpdates.acknowledgedAt = new Date();
  }
  if (updates.status === "Closed") {
    repositoryUpdates.slaState = "Stopped";
    repositoryUpdates.slaStoppedAt = new Date();
    if (repositoryUpdates.resolvedOn === undefined) {
      repositoryUpdates.resolvedOn = new Date();
    }
  }
  const reopening = updates.status === "Open" || updates.status === "In Progress";
  if (reopening && existing.sla.state === "Stopped") {
    repositoryUpdates.slaState = "Running";
    repositoryUpdates.slaStoppedAt = null;
  }
}

export async function updateIncidentById(
  id: string,
  input: UpdateIncidentInput,
  actorId: string,
  actorName: string,
  role: "user" | "admin"
): Promise<IncidentWithNames> {
  if (Object.keys(input).length === 0) {
    throw new Error("No updates provided");
  }

  const existing = await getIncidentById(id, actorId, role);
  const updates = applyClosedOnDefaults(input);

  assertStatusAuthorized(updates, existing, actorId, role);

  const repositoryUpdates: UpdateIncidentRepositoryInput = {
    ...updates,
    resolvedOn: toOptionalDate(updates.resolvedOn),
    closedOn: toOptionalDate(updates.closedOn),
  };

  applyAssignmentSideEffects(repositoryUpdates, updates, existing, actorId);
  applySeveritySideEffects(repositoryUpdates, updates, existing);
  applyStatusSideEffects(repositoryUpdates, updates, existing);

  const incident = await updateIncidentByIdRepo(id, repositoryUpdates);
  if (!incident) {
    throw new Error("Incident not found");
  }

  logIncidentUpdateActivity(incident, input, actorId, actorName);

  return incident;
}

export async function acknowledgeIncident(
  id: string,
  actorId: string,
  actorName: string,
  role: "user" | "admin"
): Promise<IncidentWithNames> {
  const incident = await getIncidentById(id, actorId, role);
  if (role !== "admin" && incident.assignedTo !== actorId) {
    throw new Error("Only the assigned user can acknowledge this ticket");
  }
  if (incident.status !== "Open") {
    throw new Error("Only open tickets can be acknowledged");
  }

  const updated = await updateIncidentByIdRepo(id, {
    status: "In Progress",
    acknowledgedAt: new Date(),
  });
  if (!updated) {
    throw new Error("Incident not found");
  }

  logActivity({
    actorId,
    actorName,
    activityType: "incident_status_changed",
    entityType: "incident",
    entityId: updated.id,
    entityLabel: formatIncidentCode(updated.incidentId),
    teamId: updated.teamId,
    description: `${actorName} acknowledged ${formatIncidentCode(updated.incidentId)}`,
    metadata: { newStatus: "In Progress", acknowledged: true },
  });

  return updated;
}

export async function reassignIncident(
  id: string,
  nextAssigneeId: string,
  actorId: string,
  actorName: string,
  role: "user" | "admin"
): Promise<IncidentWithNames> {
  const incident = await getIncidentById(id, actorId, role);
  if (role !== "admin" && incident.assignedTo !== actorId) {
    throw new Error("Only the current assignee can reassign this ticket");
  }
  if (incident.status === "Closed") {
    throw new Error("Closed tickets cannot be reassigned");
  }
  if (nextAssigneeId === actorId) {
    throw new Error("Select a different teammate to reassign this ticket");
  }

  const updated = await updateIncidentByIdRepo(id, {
    assignedBy: actorId,
    assignedTo: nextAssigneeId,
    status: "Open",
    acknowledgedAt: null,
    closedOn: null,
    resolvedOn: null,
    slaState: "Running",
    slaStoppedAt: null,
  });
  if (!updated) {
    throw new Error("Incident not found");
  }

  logActivity({
    actorId,
    actorName,
    activityType: "incident_assigned",
    entityType: "incident",
    entityId: updated.id,
    entityLabel: formatIncidentCode(updated.incidentId),
    teamId: updated.teamId,
    description: `${actorName} reassigned ${formatIncidentCode(updated.incidentId)} to ${updated.assignedToName}`,
    metadata: { assignedTo: updated.assignedTo, reassigned: true },
  });

  return updated;
}

export async function deleteIncidentById(
  id: string,
  actorId: string,
  actorName: string,
  role: "user" | "admin"
): Promise<void> {
  const existing = await getIncidentById(id, actorId, role);
  const meta = { incidentId: existing.incidentId, teamId: existing.teamId };

  const deleted = await deleteIncidentByIdRepo(id);
  if (!deleted) {
    throw new Error("Incident not found");
  }

  const label = formatIncidentCode(meta.incidentId);
  logActivity({
    actorId,
    actorName,
    activityType: "incident_deleted",
    entityType: "incident",
    entityId: id,
    entityLabel: label,
    teamId: meta.teamId,
    description: `${actorName} deleted ${label}`,
  });
}
