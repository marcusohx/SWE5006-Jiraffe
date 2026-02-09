import type { CreateIncidentInput, UpdateIncidentInput } from "@/modules/incident/incident.dto";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
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
  userId: string
): Promise<IncidentWithNames> {
  const created = await createIncidentRepo({
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status ?? "Open",
    createdBy: userId,
    assignedBy: input.assignedBy,
    assignedTo: input.assignedTo,
    comment: input.comment ?? null,
  });

  const populated = await findIncidentById(created.id);
  if (!populated) {
    throw new Error("Failed to create incident");
  }
  return populated;
}

export async function updateIncidentById(
  id: string,
  input: UpdateIncidentInput
): Promise<IncidentWithNames> {
  if (Object.keys(input).length === 0) {
    throw new Error("No updates provided");
  }

  const updates: Record<string, unknown> = { ...input };
  if (input.status === "Closed" && !input.closedOn) {
    updates.closedOn = new Date().toISOString();
  }

  const incident = await updateIncidentByIdRepo(id, updates as any);
  if (!incident) {
    throw new Error("Incident not found");
  }
  return incident;
}

export async function deleteIncidentById(id: string): Promise<void> {
  const deleted = await deleteIncidentByIdRepo(id);
  if (!deleted) {
    throw new Error("Incident not found");
  }
}
