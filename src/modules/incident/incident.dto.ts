import { z } from "zod";

export const incidentIdSchema = z.string().min(1, "Incident id is required");

export const createIncidentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Open", "In Progress", "Closed"]).optional().default("Open"),
  assignedBy: z.string().min(1, "Assigned by is required"),
  assignedTo: z.string().min(1, "Assigned to is required"),
  comment: z.string().nullable().optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  status: z.enum(["Open", "In Progress", "Closed"]).optional(),
  assignedBy: z.string().min(1).optional(),
  assignedTo: z.string().min(1).optional(),
  resolvedOn: z.string().datetime().nullable().optional(),
  closedOn: z.string().datetime().nullable().optional(),
  comment: z.string().nullable().optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;

export function parseCreateIncident(input: unknown): CreateIncidentInput {
  return createIncidentSchema.parse(input);
}

export function parseUpdateIncident(input: unknown): UpdateIncidentInput {
  return updateIncidentSchema.parse(input);
}

export function parseIncidentId(input: unknown): string {
  return incidentIdSchema.parse(input);
}
