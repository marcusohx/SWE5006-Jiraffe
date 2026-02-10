import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";
export type IncidentStatus = "Open" | "In Progress" | "Closed";

export interface Incident {
  id: string;
  incidentId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentWithNames extends Incident {
  createdByName: string;
  assignedByName: string;
  assignedToName: string;
}

export interface CreateIncidentRepositoryInput {
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
}

const incidentSchema = new Schema(
  {
    incident_id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
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
