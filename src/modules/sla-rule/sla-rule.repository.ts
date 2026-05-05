import { connectMongo } from "@/lib/db/mongodb";
import { getDefaultIncidentSlaPolicy } from "@/modules/incident/incident-sla";
import type { IncidentSeverity } from "@/modules/incident/incident.model";
import type { SlaRule, UpdateSlaRuleRepositoryInput } from "@/modules/sla-rule/sla-rule.model";
import { SlaRuleModel } from "@/modules/sla-rule/sla-rule.model";

const SEVERITIES: IncidentSeverity[] = ["Critical", "High", "Medium", "Low"];

function mapSlaRule(doc: {
  _id: { toString(): string };
  severity: IncidentSeverity;
  response_minutes: number;
  resolution_minutes: number;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SlaRule {
  return {
    id: doc._id.toString(),
    severity: doc.severity,
    responseMinutes: doc.response_minutes,
    resolutionMinutes: doc.resolution_minutes,
    isActive: doc.is_active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function ensureDefaultSlaRules(): Promise<void> {
  await connectMongo();

  await Promise.all(
    SEVERITIES.map(async (severity) => {
      const defaults = getDefaultIncidentSlaPolicy(severity);
      await SlaRuleModel.findOneAndUpdate(
        { severity },
        {
          $setOnInsert: {
            severity,
            response_minutes: defaults.responseMinutes,
            resolution_minutes: defaults.resolutionMinutes,
            is_active: true,
          },
        },
        { upsert: true, new: true }
      );
    })
  );
}

export async function listSlaRules(): Promise<SlaRule[]> {
  await ensureDefaultSlaRules();
  const docs = await SlaRuleModel.find().sort({ severity: 1 });
  const bySeverity = new Map(docs.map((doc) => [doc.severity, mapSlaRule(doc.toObject())] as const));
  return SEVERITIES.map((severity) => bySeverity.get(severity)).filter((item): item is SlaRule => Boolean(item));
}

export async function findSlaRuleBySeverity(severity: IncidentSeverity): Promise<SlaRule | null> {
  await ensureDefaultSlaRules();
  const doc = await SlaRuleModel.findOne({ severity });
  return doc ? mapSlaRule(doc.toObject()) : null;
}

export async function updateSlaRuleBySeverity(
  severity: IncidentSeverity,
  updates: UpdateSlaRuleRepositoryInput
): Promise<SlaRule | null> {
  await ensureDefaultSlaRules();

  const mongoUpdates: Record<string, unknown> = {};
  if (updates.responseMinutes !== undefined) mongoUpdates.response_minutes = updates.responseMinutes;
  if (updates.resolutionMinutes !== undefined) mongoUpdates.resolution_minutes = updates.resolutionMinutes;
  if (updates.isActive !== undefined) mongoUpdates.is_active = updates.isActive;

  const updated = await SlaRuleModel.findOneAndUpdate({ severity }, { $set: mongoUpdates }, { new: true });
  return updated ? mapSlaRule(updated.toObject()) : null;
}
