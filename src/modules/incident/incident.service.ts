import { formatIncidentCode } from "@/lib/utils";
import { logActivity } from "@/modules/activity/activity.service";
import type { CreateIncidentInput, UpdateIncidentInput } from "@/modules/incident/incident.dto";
import type { IncidentWithNames, UpdateIncidentRepositoryInput } from "@/modules/incident/incident.model";
import {
  createIncident as createIncidentRepo,
  deleteIncidentById as deleteIncidentByIdRepo,
  findIncidentById,
  listIncidents as listIncidentsRepo,
  updateIncidentById as updateIncidentByIdRepo,
} from "@/modules/incident/incident.repository";

export async function listIncidents(): Promise<IncidentWithNames[]> {
  return listIncidentsRepo();
}

export async function getIncidentById(id: string): Promise<IncidentWithNames> {
  const incident = await findIncidentById(id);
  if (!incident) {
    throw new Error("Incident not found");
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

export async function updateIncidentById(
  id: string,
  input: UpdateIncidentInput,
  actorId?: string,
  actorName?: string
): Promise<IncidentWithNames> {
  if (Object.keys(input).length === 0) {
    throw new Error("No updates provided");
  }

  const updates: UpdateIncidentInput = { ...input };
  if (input.status === "Closed" && !input.closedOn) {
    updates.closedOn = new Date().toISOString();
  }
  if (input.status === "Open" || input.status === "In Progress") {
    updates.closedOn = null;
  }

  const repositoryUpdates: UpdateIncidentRepositoryInput = {
    ...updates,
    resolvedOn:
      updates.resolvedOn !== undefined
        ? updates.resolvedOn === null
          ? null
          : new Date(updates.resolvedOn)
        : undefined,
    closedOn:
      updates.closedOn !== undefined
        ? updates.closedOn === null
          ? null
          : new Date(updates.closedOn)
        : undefined,
  };

  const incident = await updateIncidentByIdRepo(id, repositoryUpdates);
  if (!incident) {
    throw new Error("Incident not found");
  }

  if (actorId && actorName) {
    const label = formatIncidentCode(incident.incidentId);

    if (input.status !== undefined) {
      logActivity({
        actorId,
        actorName,
        activityType: "incident_status_changed",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: label,
        teamId: incident.teamId,
        description: `${actorName} moved ${label} to ${input.status}`,
        metadata: { newStatus: input.status },
      });
    } else if (input.severity !== undefined) {
      logActivity({
        actorId,
        actorName,
        activityType: "incident_severity_changed",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: label,
        teamId: incident.teamId,
        description: `${actorName} changed ${label} severity to ${input.severity}`,
        metadata: { newSeverity: input.severity },
      });
    } else if (input.assignedTo !== undefined) {
      logActivity({
        actorId,
        actorName,
        activityType: "incident_assigned",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: label,
        teamId: incident.teamId,
        description: `${actorName} assigned ${label} to ${incident.assignedToName}`,
        metadata: { assignedTo: input.assignedTo },
      });
    } else {
      logActivity({
        actorId,
        actorName,
        activityType: "incident_updated",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: label,
        teamId: incident.teamId,
        description: `${actorName} updated ${label}`,
        metadata: { fields: Object.keys(input) },
      });
    }
  }

  return incident;
}

export async function deleteIncidentById(
  id: string,
  actorId?: string,
  actorName?: string
): Promise<void> {
  let meta: { incidentId: number; teamId: number } | null = null;
  if (actorId) {
    const existing = await findIncidentById(id);
    if (existing) {
      meta = { incidentId: existing.incidentId, teamId: existing.teamId };
    }
  }

  const deleted = await deleteIncidentByIdRepo(id);
  if (!deleted) {
    throw new Error("Incident not found");
  }

  if (actorId && actorName && meta) {
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
}
