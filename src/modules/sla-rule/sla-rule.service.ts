import type { IncidentSeverity } from "@/modules/incident/incident.model";
import type { UpdateSlaRuleInput } from "@/modules/sla-rule/sla-rule.dto";
import type { SlaRule } from "@/modules/sla-rule/sla-rule.model";
import {
  findSlaRuleBySeverity,
  listSlaRules as listSlaRulesRepo,
  updateSlaRuleBySeverity as updateSlaRuleBySeverityRepo,
} from "@/modules/sla-rule/sla-rule.repository";

export async function listSlaRules(): Promise<SlaRule[]> {
  return listSlaRulesRepo();
}

export async function getSlaRuleBySeverity(severity: IncidentSeverity): Promise<SlaRule> {
  const rule = await findSlaRuleBySeverity(severity);
  if (!rule) {
    throw new Error("SLA rule not found");
  }
  return rule;
}

export async function updateSlaRuleBySeverity(
  severity: IncidentSeverity,
  input: UpdateSlaRuleInput
): Promise<SlaRule> {
  if (Object.keys(input).length === 0) {
    throw new Error("No updates provided");
  }

  const updated = await updateSlaRuleBySeverityRepo(severity, input);
  if (!updated) {
    throw new Error("SLA rule not found");
  }
  return updated;
}
