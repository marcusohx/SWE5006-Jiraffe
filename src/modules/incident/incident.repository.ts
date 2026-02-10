import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongodb";
import { capitalizeName } from "@/lib/utils";
import type {
  CreateIncidentRepositoryInput,
  Incident,
  IncidentWithNames,
  UpdateIncidentRepositoryInput,
} from "@/modules/incident/incident.model";
import { IncidentModel } from "@/modules/incident/incident.model";
import "@/modules/user/user.model";

type IncidentRef = { toString(): string; name?: string } | null | undefined;
type IncidentDocumentShape = {
  _id: { toString(): string };
  incident_id?: { toString(): string } | null;
  title: string;
  description: string;
  severity: Incident["severity"];
  status: Incident["status"];
  board_order?: number;
  created_by?: IncidentRef;
  assigned_by?: IncidentRef;
  assigned_to?: IncidentRef;
  resolved_on?: Date | null;
  closed_on?: Date | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapIncident(doc: Record<string, unknown>): Incident {
  const d = doc as IncidentDocumentShape;
  return {
    id: d._id.toString(),
    incidentId: d.incident_id?.toString() ?? "",
    title: d.title,
    description: d.description,
    severity: d.severity,
    status: d.status,
    boardOrder: d.board_order ?? new Date(d.createdAt).getTime(),
    createdBy: d.created_by?.toString() ?? "",
    assignedBy: d.assigned_by?.toString() ?? "",
    assignedTo: d.assigned_to?.toString() ?? "",
    resolvedOn: d.resolved_on ?? null,
    closedOn: d.closed_on ?? null,
    comment: d.comment ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapIncidentWithNames(doc: Record<string, unknown>): IncidentWithNames {
  const d = doc as IncidentDocumentShape;
  const base = mapIncident(doc);
  return {
    ...base,
    createdByName: capitalizeName(d.created_by?.name ?? "Unknown"),
    assignedByName: capitalizeName(d.assigned_by?.name ?? "Unknown"),
    assignedToName: capitalizeName(d.assigned_to?.name ?? "Unknown"),
  };
}

const USER_POPULATE = [
  { path: "created_by", select: "name email" },
  { path: "assigned_by", select: "name email" },
  { path: "assigned_to", select: "name email" },
];

export async function listIncidents(): Promise<IncidentWithNames[]> {
  await connectMongo();
  const docs = await IncidentModel.find().populate(USER_POPULATE).sort({ board_order: 1, createdAt: 1 });
  return docs.map((d) => mapIncidentWithNames(d.toObject()));
}

export async function createIncident(
  data: CreateIncidentRepositoryInput
): Promise<Incident> {
  await connectMongo();
  const created = await IncidentModel.create({
    incident_id: new mongoose.Types.ObjectId(),
    title: data.title,
    description: data.description,
    severity: data.severity,
    status: data.status,
    board_order: data.boardOrder,
    created_by: new mongoose.Types.ObjectId(data.createdBy),
    assigned_by: new mongoose.Types.ObjectId(data.assignedBy),
    assigned_to: new mongoose.Types.ObjectId(data.assignedTo),
    comment: data.comment ?? null,
  });
  return mapIncident(created.toObject());
}

export async function findIncidentById(id: string): Promise<IncidentWithNames | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const doc = await IncidentModel.findById(id).populate(USER_POPULATE);
  return doc ? mapIncidentWithNames(doc.toObject()) : null;
}

export async function updateIncidentById(
  id: string,
  updates: UpdateIncidentRepositoryInput
): Promise<IncidentWithNames | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const mongoUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) mongoUpdates.title = updates.title;
  if (updates.description !== undefined) mongoUpdates.description = updates.description;
  if (updates.severity !== undefined) mongoUpdates.severity = updates.severity;
  if (updates.status !== undefined) mongoUpdates.status = updates.status;
  if (updates.boardOrder !== undefined) mongoUpdates.board_order = updates.boardOrder;
  if (updates.assignedBy !== undefined) mongoUpdates.assigned_by = new mongoose.Types.ObjectId(updates.assignedBy);
  if (updates.assignedTo !== undefined) mongoUpdates.assigned_to = new mongoose.Types.ObjectId(updates.assignedTo);
  if (updates.resolvedOn !== undefined) mongoUpdates.resolved_on = updates.resolvedOn;
  if (updates.closedOn !== undefined) mongoUpdates.closed_on = updates.closedOn;
  if (updates.comment !== undefined) mongoUpdates.comment = updates.comment;

  const updated = await IncidentModel.findByIdAndUpdate(
    id,
    { $set: mongoUpdates },
    { new: true }
  ).populate(USER_POPULATE);
  return updated ? mapIncidentWithNames(updated.toObject()) : null;
}

export async function deleteIncidentById(id: string): Promise<boolean> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  const result = await IncidentModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
