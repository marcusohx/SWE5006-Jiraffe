import { connectMongo } from "@/lib/db/mongodb";
import type { Activity, ActivityType } from "@/modules/activity/activity.model";
import { ActivityModel } from "@/modules/activity/activity.model";

export interface CreateActivityInput {
  actorId: string;
  actorName: string;
  activityType: ActivityType;
  entityType: "incident";
  entityId: string;
  entityLabel: string;
  teamId: number | null;
  description: string;
  metadata?: Record<string, unknown> | null;
}

type ActivityDocumentShape = {
  _id: { toString(): string };
  actor_id: { toString(): string };
  actor_name: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  team_id: number | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function mapActivity(doc: ActivityDocumentShape): Activity {
  return {
    id: doc._id.toString(),
    actorId: doc.actor_id.toString(),
    actorName: doc.actor_name,
    activityType: doc.activity_type as Activity["activityType"],
    entityType: doc.entity_type as Activity["entityType"],
    entityId: doc.entity_id,
    entityLabel: doc.entity_label,
    teamId: doc.team_id,
    description: doc.description,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

export async function createActivity(data: CreateActivityInput): Promise<Activity> {
  await connectMongo();
  const doc = await ActivityModel.create({
    actor_id: data.actorId,
    actor_name: data.actorName,
    activity_type: data.activityType,
    entity_type: data.entityType,
    entity_id: data.entityId,
    entity_label: data.entityLabel,
    team_id: data.teamId,
    description: data.description,
    metadata: data.metadata ?? null,
  });
  return mapActivity(doc.toObject() as unknown as ActivityDocumentShape);
}

export async function listActivities(
  teamIds: number[],
  limit: number
): Promise<Activity[]> {
  await connectMongo();
  if (teamIds.length === 0) return [];
  const filter = { team_id: { $in: teamIds } };
  const docs = await ActivityModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => mapActivity(d as unknown as ActivityDocumentShape));
}
