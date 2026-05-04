import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongodb";
import { capitalizeName } from "@/lib/utils";
import { createIncidentSlaSnapshot, recomputeIncidentSlaSnapshot } from "@/modules/incident/incident-sla";
import type {
  CreateIncidentRepositoryInput,
  Incident,
  IncidentWithNames,
  UpdateIncidentRepositoryInput,
} from "@/modules/incident/incident.model";
import { IncidentModel } from "@/modules/incident/incident.model";
import { CounterModel, UserTeamModel } from "@/modules/team/team.model";
import "@/modules/user/user.model";

type IncidentRef =
  | { _id?: mongoose.Types.ObjectId | string; name?: string; toString?: () => string }
  | mongoose.Types.ObjectId
  | string
  | null
  | undefined;
type IncidentDocumentShape = {
  _id: { toString(): string };
  incident_id?: number | null;
  team_id?: number;
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
  sla_started_at?: Date;
  response_due_at?: Date;
  resolution_due_at?: Date;
  acknowledged_at?: Date | null;
  sla_state?: "Running" | "Stopped";
  sla_stopped_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IncidentInboxItem extends IncidentWithNames {
  availableAssignees: { id: string; name: string; email: string }[];
}

function toObjectId(value: string, fieldName: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`${fieldName} is invalid`);
  }
  return new mongoose.Types.ObjectId(value);
}

function getRefId(ref: IncidentRef): string {
  if (!ref) {
    return "";
  }
  if (typeof ref === "string") {
    return ref;
  }
  if (ref instanceof mongoose.Types.ObjectId) {
    return ref.toString();
  }
  if (typeof ref === "object" && "_id" in ref && ref._id) {
    return ref._id.toString();
  }
  if (typeof ref.toString === "function") {
    return ref.toString();
  }
  return "";
}

function getRefName(ref: IncidentRef): string {
  if (!ref || typeof ref === "string" || ref instanceof mongoose.Types.ObjectId) {
    return "Unknown";
  }
  return ref.name ?? "Unknown";
}

async function getNextIncidentId(): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { name: "incident_id" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (!counter) {
    throw new Error("Failed to allocate incident id");
  }

  if (counter.seq <= 1) {
    const maxIncident = await IncidentModel.findOne({}, { incident_id: 1 }, { sort: { incident_id: -1 } });
    const maxIncidentId = maxIncident?.incident_id ?? 0;
    if (maxIncidentId >= counter.seq) {
      const bumped = await CounterModel.findOneAndUpdate(
        { name: "incident_id" },
        { $set: { seq: maxIncidentId + 1 } },
        { new: true }
      );
      if (bumped) {
        return bumped.seq;
      }
    }
  }

  return counter.seq;
}

async function isUserInTeam(userId: string, teamId: number, session?: mongoose.ClientSession): Promise<boolean> {
  const query = {
    user_id: toObjectId(userId, "User id"),
    team_id: teamId,
  };
  const count = session
    ? await UserTeamModel.countDocuments(query, { session })
    : await UserTeamModel.countDocuments(query);
  return count > 0;
}

async function assertUserInTeam(
  userId: string,
  teamId: number,
  failureMessage: string,
  session?: mongoose.ClientSession
): Promise<void> {
  const member = await isUserInTeam(userId, teamId, session);
  if (!member) {
    throw new Error(failureMessage);
  }
}

function mapIncident(doc: Record<string, unknown>): Incident {
  const d = doc as IncidentDocumentShape;
  const now = new Date();
  const sla = recomputeIncidentSlaSnapshot(
    d.severity,
    {
      startedAt: d.sla_started_at ?? d.createdAt,
      acknowledgedAt: d.acknowledged_at ?? null,
      state: d.sla_state ?? "Running",
      stoppedAt: d.sla_stopped_at ?? null,
    },
    now
  );

  return {
    id: d._id.toString(),
    incidentId: d.incident_id ?? 0,
    teamId: d.team_id ?? 0,
    title: d.title,
    description: d.description,
    severity: d.severity,
    status: d.status,
    boardOrder: d.board_order ?? new Date(d.createdAt).getTime(),
    createdBy: getRefId(d.created_by),
    assignedBy: getRefId(d.assigned_by),
    assignedTo: getRefId(d.assigned_to),
    resolvedOn: d.resolved_on ?? null,
    closedOn: d.closed_on ?? null,
    comment: d.comment ?? null,
    sla: {
      ...sla,
      responseDueAt: d.response_due_at ?? sla.responseDueAt,
      resolutionDueAt: d.resolution_due_at ?? sla.resolutionDueAt,
    },
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapIncidentWithNames(doc: Record<string, unknown>): IncidentWithNames {
  const d = doc as IncidentDocumentShape;
  const base = mapIncident(doc);
  return {
    ...base,
    createdByName: capitalizeName(getRefName(d.created_by)),
    assignedByName: capitalizeName(getRefName(d.assigned_by)),
    assignedToName: capitalizeName(getRefName(d.assigned_to)),
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

export async function listIncidentsForUser(userId: string): Promise<IncidentWithNames[]> {
  await connectMongo();
  const memberships = await UserTeamModel.find({
    user_id: toObjectId(userId, "User id"),
  }).lean();
  const teamIds = memberships.map((membership) => membership.team_id);
  if (teamIds.length === 0) {
    return [];
  }
  const docs = await IncidentModel.find({ team_id: { $in: teamIds } })
    .populate(USER_POPULATE)
    .sort({ board_order: 1, createdAt: 1 });
  return docs.map((d) => mapIncidentWithNames(d.toObject()));
}

export async function createIncident(
  data: CreateIncidentRepositoryInput
): Promise<Incident> {
  await connectMongo();
  const teamId = data.teamId;
  await Promise.all([
    assertUserInTeam(data.createdBy, teamId, "Creator is not a member of selected team"),
    assertUserInTeam(data.assignedBy, teamId, "Assigned by user is not a member of selected team"),
    assertUserInTeam(data.assignedTo, teamId, "Assignee is not a member of selected team"),
  ]);

  const incidentId = await getNextIncidentId();
  const sla = createIncidentSlaSnapshot(data.severity);
  const created = await IncidentModel.create([
    {
      incident_id: incidentId,
      team_id: teamId,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: data.status,
      board_order: data.boardOrder,
      created_by: toObjectId(data.createdBy, "Created by"),
      assigned_by: toObjectId(data.assignedBy, "Assigned by"),
      assigned_to: toObjectId(data.assignedTo, "Assigned to"),
      comment: data.comment ?? null,
      sla_started_at: sla.startedAt,
      response_due_at: sla.responseDueAt,
      resolution_due_at: sla.resolutionDueAt,
      acknowledged_at: sla.acknowledgedAt,
      sla_state: sla.state,
      sla_stopped_at: sla.stoppedAt,
    },
  ]);
  const createdDoc = created[0]?.toObject() ?? null;

  if (!createdDoc) {
    throw new Error("Failed to create incident");
  }
  return mapIncident(createdDoc);
}

export async function findIncidentById(id: string): Promise<IncidentWithNames | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const doc = await IncidentModel.findById(id).populate(USER_POPULATE);
  return doc ? mapIncidentWithNames(doc.toObject()) : null;
}

export async function findIncidentByIdForUser(
  id: string,
  userId: string
): Promise<IncidentWithNames | null> {
  const incident = await findIncidentById(id);
  if (!incident) {
    return null;
  }
  const member = await isUserInTeam(userId, incident.teamId);
  return member ? incident : null;
}

async function listAssignableTeamMembers(teamId: number): Promise<IncidentInboxItem["availableAssignees"]> {
  const membershipDocs = await UserTeamModel.find({ team_id: teamId }).populate({
    path: "user_id",
    select: "name email",
  });

  const uniqueUsers = new Map<string, { id: string; name: string; email: string }>();
  membershipDocs.forEach((doc) => {
    const rawUser = doc.user_id as { _id?: mongoose.Types.ObjectId | string; name?: string; email?: string } | null;
    const id = rawUser?._id?.toString();
    if (!id || uniqueUsers.has(id)) {
      return;
    }
    uniqueUsers.set(id, {
      id,
      name: capitalizeName(rawUser?.name ?? "Unknown"),
      email: rawUser?.email ?? "",
    });
  });

  return Array.from(uniqueUsers.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listIncidentInboxForUser(userId: string): Promise<IncidentInboxItem[]> {
  await connectMongo();
  const assignedTo = toObjectId(userId, "User id");
  const docs = await IncidentModel.find({
    assigned_to: assignedTo,
    status: "Open",
    acknowledged_at: null,
  })
    .populate(USER_POPULATE)
    .sort({ createdAt: -1 });

  const teamIds = Array.from(new Set(docs.map((doc) => doc.team_id)));
  const assigneeMap = new Map<number, IncidentInboxItem["availableAssignees"]>();

  await Promise.all(
    teamIds.map(async (teamId) => {
      assigneeMap.set(teamId, await listAssignableTeamMembers(teamId));
    })
  );

  return docs.map((doc) => ({
    ...mapIncidentWithNames(doc.toObject()),
    availableAssignees: assigneeMap.get(doc.team_id) ?? [],
  }));
}

const SIMPLE_UPDATE_FIELDS: ReadonlyArray<{
  input: keyof UpdateIncidentRepositoryInput;
  mongo: string;
}> = [
  { input: "title", mongo: "title" },
  { input: "description", mongo: "description" },
  { input: "severity", mongo: "severity" },
  { input: "status", mongo: "status" },
  { input: "boardOrder", mongo: "board_order" },
  { input: "resolvedOn", mongo: "resolved_on" },
  { input: "closedOn", mongo: "closed_on" },
  { input: "comment", mongo: "comment" },
  { input: "acknowledgedAt", mongo: "acknowledged_at" },
  { input: "slaState", mongo: "sla_state" },
  { input: "slaStoppedAt", mongo: "sla_stopped_at" },
  { input: "responseDueAt", mongo: "response_due_at" },
  { input: "resolutionDueAt", mongo: "resolution_due_at" },
];

function buildSimpleMongoUpdates(updates: UpdateIncidentRepositoryInput): Record<string, unknown> {
  const mongoUpdates: Record<string, unknown> = {};
  for (const field of SIMPLE_UPDATE_FIELDS) {
    const value = updates[field.input];
    if (value !== undefined) {
      mongoUpdates[field.mongo] = value;
    }
  }
  if (updates.assignedBy !== undefined) {
    mongoUpdates.assigned_by = toObjectId(updates.assignedBy, "Assigned by");
  }
  return mongoUpdates;
}

async function applyAssignedToUpdate(
  mongoUpdates: Record<string, unknown>,
  assignedTo: string,
  teamId: number
): Promise<void> {
  const member = await isUserInTeam(assignedTo, teamId);
  if (!member) {
    throw new Error("Cannot reassign incident to a user from a different team");
  }
  mongoUpdates.assigned_to = toObjectId(assignedTo, "Assigned to");
}

export async function updateIncidentById(
  id: string,
  updates: UpdateIncidentRepositoryInput
): Promise<IncidentWithNames | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const existing = await IncidentModel.findById(id).select("team_id");
  if (!existing) {
    return null;
  }

  const mongoUpdates = buildSimpleMongoUpdates(updates);
  if (updates.assignedTo !== undefined) {
    await applyAssignedToUpdate(mongoUpdates, updates.assignedTo, existing.team_id);
  }

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

