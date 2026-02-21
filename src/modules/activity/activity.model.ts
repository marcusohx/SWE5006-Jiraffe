import mongoose, { Schema, type Model } from "mongoose";

export type ActivityType =
  | "incident_created"
  | "incident_updated"
  | "incident_status_changed"
  | "incident_severity_changed"
  | "incident_assigned"
  | "incident_deleted";

export interface Activity {
  id: string;
  actorId: string;
  actorName: string;
  activityType: ActivityType;
  entityType: "incident";
  entityId: string;
  entityLabel: string;
  teamId: number | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

const activitySchema = new Schema(
  {
    actor_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor_name: { type: String, required: true },
    activity_type: {
      type: String,
      required: true,
      enum: [
        "incident_created",
        "incident_updated",
        "incident_status_changed",
        "incident_severity_changed",
        "incident_assigned",
        "incident_deleted",
      ],
      index: true,
    },
    entity_type: { type: String, required: true, enum: ["incident"] },
    entity_id: { type: String, required: true },
    entity_label: { type: String, required: true },
    team_id: { type: Number, default: null, index: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ team_id: 1, createdAt: -1 });

export interface ActivityDocument {
  _id: mongoose.Types.ObjectId;
  actor_id: mongoose.Types.ObjectId;
  actor_name: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  team_id: number | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export const ActivityModel: Model<ActivityDocument> =
  mongoose.models.Activity ??
  mongoose.model<ActivityDocument>("Activity", activitySchema);
