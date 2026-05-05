import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { IncidentSeverity } from "@/modules/incident/incident.model";

export interface SlaRule {
  id: string;
  severity: IncidentSeverity;
  responseMinutes: number;
  resolutionMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSlaRuleRepositoryInput {
  responseMinutes?: number;
  resolutionMinutes?: number;
  isActive?: boolean;
}

const slaRuleSchema = new Schema(
  {
    severity: {
      type: String,
      required: true,
      unique: true,
      enum: ["Low", "Medium", "High", "Critical"],
    },
    response_minutes: { type: Number, required: true, min: 1 },
    resolution_minutes: { type: Number, required: true, min: 1 },
    is_active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export type SlaRuleDocument = InferSchemaType<typeof slaRuleSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SlaRuleModel: Model<SlaRuleDocument> =
  mongoose.models.SlaRule ?? mongoose.model<SlaRuleDocument>("SlaRule", slaRuleSchema);
