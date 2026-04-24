import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { IncidentSlaSnapshot, IncidentSlaState } from "@/modules/incident/incident-sla";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";
export type IncidentStatus = "Open" | "In Progress" | "Closed";

export interface Incident {
  id: string;
  incidentId: number;
  teamId: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  boardOrder: number;
  createdBy: string;
  assignedBy: string;
  assignedTo: string;
  resolvedOn: Date | null;
  closedOn: Date | null;
  comment: string | null;
  sla: IncidentSlaSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentWithNames extends Incident {
  createdByName: string;
  assignedByName: string;
  assignedToName: string;
}

export interface CreateIncidentRepositoryInput {
  teamId: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  boardOrder: number;
  createdBy: string;
  assignedBy: string;
  assignedTo: string;
  comment?: string | null;
}

export interface UpdateIncidentRepositoryInput {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  boardOrder?: number;
  assignedBy?: string;
  assignedTo?: string;
  resolvedOn?: Date | null;
  closedOn?: Date | null;
  comment?: string | null;
  acknowledgedAt?: Date | null;
  slaState?: IncidentSlaState;
  slaStoppedAt?: Date | null;
  responseDueAt?: Date;
  resolutionDueAt?: Date;
}

const incidentSchema = new Schema(
  {
    incident_id: { type: Number, required: true, unique: true, index: true },
    team_id: { type: Number, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, required: true, enum: ["Low", "Medium", "High", "Critical"] },
    status: { type: String, required: true, enum: ["Open", "In Progress", "Closed"], default: "Open" },
    board_order: { type: Number, required: true, default: () => Date.now() },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assigned_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assigned_to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolved_on: { type: Date, default: null },
    closed_on: { type: Date, default: null },
    comment: { type: String, default: null },
    sla_started_at: { type: Date, required: true },
    response_due_at: { type: Date, required: true },
    resolution_due_at: { type: Date, required: true },
    acknowledged_at: { type: Date, default: null },
    sla_state: { type: String, required: true, enum: ["Running", "Stopped"], default: "Running" },
    sla_stopped_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export type IncidentDocument = InferSchemaType<typeof incidentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const IncidentModel: Model<IncidentDocument> =
  mongoose.models.Incident ?? mongoose.model<IncidentDocument>("Incident", incidentSchema);
