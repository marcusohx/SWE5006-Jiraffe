import { ok } from "@/lib/api-response";
import type { CreateIncidentInput, UpdateIncidentInput } from "@/modules/incident/incident.dto";
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

export async function listIncidentsController() {
  const incidents = await listIncidents();
  return ok(incidents);
}

export async function listIncidentInboxController(userId: string) {
  const incidents = await listIncidentInbox(userId);
  return ok(incidents);
}

export async function createIncidentController(
  input: CreateIncidentInput,
  userId: string,
  userName: string
) {
  const incident = await createIncident(input, userId, userName);
  return ok(incident, 201);
}

export async function getIncidentByIdController(id: string) {
  const incident = await getIncidentById(id);
  return ok(incident);
}

export async function updateIncidentByIdController(
  id: string,
  input: UpdateIncidentInput,
  userId: string,
  userName: string
) {
  const incident = await updateIncidentById(id, input, userId, userName);
  return ok(incident);
}

export async function deleteIncidentByIdController(
  id: string,
  userId: string,
  userName: string
) {
  await deleteIncidentById(id, userId, userName);
  return ok({ deleted: true });
}

export async function acknowledgeIncidentController(id: string, userId: string, userName: string) {
  const incident = await acknowledgeIncident(id, userId, userName);
  return ok(incident);
}

export async function reassignIncidentController(
  id: string,
  assignedTo: string,
  userId: string,
  userName: string
) {
  const incident = await reassignIncident(id, assignedTo, userId, userName);
  return ok(incident);
}
