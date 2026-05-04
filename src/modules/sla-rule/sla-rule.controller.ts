import { ok } from "@/lib/api-response";
import type { IncidentSeverity } from "@/modules/incident/incident.model";
import type { UpdateSlaRuleInput } from "@/modules/sla-rule/sla-rule.dto";
import {
  getSlaRuleBySeverity,
  listSlaRules,
  updateSlaRuleBySeverity,
} from "@/modules/sla-rule/sla-rule.service";

export async function listSlaRulesController() {
  const rules = await listSlaRules();
  return ok(rules);
}

export async function getSlaRuleBySeverityController(severity: IncidentSeverity) {
  const rule = await getSlaRuleBySeverity(severity);
  return ok(rule);
}

export async function updateSlaRuleBySeverityController(severity: IncidentSeverity, input: UpdateSlaRuleInput) {
  const rule = await updateSlaRuleBySeverity(severity, input);
  return ok(rule);
}
