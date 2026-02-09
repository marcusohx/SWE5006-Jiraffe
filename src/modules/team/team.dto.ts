import { z } from "zod";

export const teamIdSchema = z.string().min(1, "Team id is required");

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().nullable().optional(),
  memberIds: z.array(z.string().min(1)).optional().default([]),
  isActive: z.boolean().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  memberIds: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export function parseCreateTeam(input: unknown): CreateTeamInput {
  return createTeamSchema.parse(input);
}

export function parseUpdateTeam(input: unknown): UpdateTeamInput {
  return updateTeamSchema.parse(input);
}

export function parseTeamId(input: unknown): string {
  return teamIdSchema.parse(input);
}
