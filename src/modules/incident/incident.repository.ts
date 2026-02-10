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
import { CounterModel, UserTeamModel } from "@/modules/team/team.model";
import "@/modules/user/user.model";

type IncidentRef = { toString(): string; name?: string } | null | undefined;
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
  createdAt: Date;
  updatedAt: Date;
};

function toObjectId(value: string, fieldName: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`${fieldName} is invalid`);
  }
  return new mongoose.Types.ObjectId(value);
}

async function getNextIncidentId(session: mongoose.ClientSession): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { name: "incident_id" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  if (!counter) {
    throw new Error("Failed to allocate incident id");
  }

  if (counter.seq <= 1) {
    const maxIncident = await IncidentModel.findOne({}, { incident_id: 1 }, { sort: { incident_id: -1 }, session });
    const maxIncidentId = maxIncident?.incident_id ?? 0;
    if (maxIncidentId >= counter.seq) {
      const bumped = await CounterModel.findOneAndUpdate(
        { name: "incident_id" },
        { $set: { seq: maxIncidentId + 1 } },
        { new: true, session }
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
  return {
    id: d._id.toString(),
    incidentId: d.incident_id ?? 0,
    teamId: d.team_id ?? 0,
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
  const mongo = await connectMongo();
  const session = await mongo.startSession();
  let createdDoc: Record<string, unknown> | null = null;

  try {
    await session.withTransaction(async () => {
      const teamId = data.teamId;
      await Promise.all([
        assertUserInTeam(data.createdBy, teamId, "Creator is not a member of selected team", session),
        assertUserInTeam(data.assignedBy, teamId, "Assigned by user is not a member of selected team", session),
        assertUserInTeam(data.assignedTo, teamId, "Assignee is not a member of selected team", session),
      ]);

      const incidentId = await getNextIncidentId(session);
      const created = await IncidentModel.create(
        [
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
          },
        ],
        { session }
      );
      createdDoc = created[0]?.toObject() ?? null;
    });

    if (!createdDoc) {
      throw new Error("Failed to create incident");
    }
    return mapIncident(createdDoc);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Transaction numbers are only allowed on a replica set member or mongos")) {
      throw new Error("MongoDB transactions are required for incident id allocation");
    }
    throw error;
  } finally {
    await session.endSession();
  }
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

  const existing = await IncidentModel.findById(id).select("team_id");
  if (!existing) {
    return null;
  }

  const mongoUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) mongoUpdates.title = updates.title;
  if (updates.description !== undefined) mongoUpdates.description = updates.description;
  if (updates.severity !== undefined) mongoUpdates.severity = updates.severity;
  if (updates.status !== undefined) mongoUpdates.status = updates.status;
  if (updates.boardOrder !== undefined) mongoUpdates.board_order = updates.boardOrder;
  if (updates.assignedBy !== undefined) mongoUpdates.assigned_by = toObjectId(updates.assignedBy, "Assigned by");
  if (updates.assignedTo !== undefined) {
    const member = await isUserInTeam(updates.assignedTo, existing.team_id);
    if (!member) {
      throw new Error("Cannot reassign incident to a user from a different team");
    }
    mongoUpdates.assigned_to = toObjectId(updates.assignedTo, "Assigned to");
  }
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
