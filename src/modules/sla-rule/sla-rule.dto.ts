import { z } from "zod";

export const slaRuleSeveritySchema = z.enum(["Low", "Medium", "High", "Critical"]);

export const updateSlaRuleSchema = z.object({
  responseMinutes: z.number().int().positive().optional(),
  resolutionMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export type SlaRuleSeverity = z.infer<typeof slaRuleSeveritySchema>;
export type UpdateSlaRuleInput = z.infer<typeof updateSlaRuleSchema>;

export function parseSlaRuleSeverity(input: unknown): SlaRuleSeverity {
  return slaRuleSeveritySchema.parse(input);
}

export function parseUpdateSlaRule(input: unknown): UpdateSlaRuleInput {
  return updateSlaRuleSchema.parse(input);
}
