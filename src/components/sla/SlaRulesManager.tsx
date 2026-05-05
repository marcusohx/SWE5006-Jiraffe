"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { severityVariant } from "@/lib/constants";
import type { IncidentSeverity } from "@/modules/incident/incident.model";
import type { ApiError, ApiSuccess } from "@/types/api";

type SlaRuleItem = {
  id: string;
  severity: IncidentSeverity;
  responseMinutes: number;
  resolutionMinutes: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function formatMinutes(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export function SlaRulesManager({ initialRules }: { initialRules: SlaRuleItem[] }) {
  const [rules, setRules] = useState(initialRules);
  const [drafts, setDrafts] = useState<Record<string, { responseMinutes: string; resolutionMinutes: string; isActive: boolean }>>(
    () => Object.fromEntries(initialRules.map((rule) => [rule.severity, {
      responseMinutes: String(rule.responseMinutes),
      resolutionMinutes: String(rule.resolutionMinutes),
      isActive: rule.isActive,
    }]))
  );
  const [savingSeverity, setSavingSeverity] = useState<IncidentSeverity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const summaries = useMemo(() => rules.map((rule) => ({
    severity: rule.severity,
    response: formatMinutes(rule.responseMinutes),
    resolution: formatMinutes(rule.resolutionMinutes),
  })), [rules]);

  const updateDraft = (severity: IncidentSeverity, patch: Partial<{ responseMinutes: string; resolutionMinutes: string; isActive: boolean }>) => {
    setDrafts((current) => ({
      ...current,
      [severity]: {
        ...current[severity],
        ...patch,
      },
    }));
  };

  const saveRule = async (severity: IncidentSeverity) => {
    const draft = drafts[severity];
    if (!draft) return;

    setError(null);
    setSuccess(null);
    setSavingSeverity(severity);

    const responseMinutes = Number(draft.responseMinutes);
    const resolutionMinutes = Number(draft.resolutionMinutes);

    if (!Number.isInteger(responseMinutes) || responseMinutes <= 0) {
      setSavingSeverity(null);
      setError(`${severity}: response minutes must be a positive integer.`);
      return;
    }
    if (!Number.isInteger(resolutionMinutes) || resolutionMinutes <= 0) {
      setSavingSeverity(null);
      setError(`${severity}: resolution minutes must be a positive integer.`);
      return;
    }

    try {
      const response = await fetch(`/api/sla-rules/${severity}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseMinutes,
          resolutionMinutes,
          isActive: draft.isActive,
        }),
      });
      const payload = (await response.json()) as ApiSuccess<SlaRuleItem> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to update SLA rule." : payload.error);
      }

      setRules((current) => current.map((rule) => rule.severity === severity ? payload.data : rule));
      setDrafts((current) => ({
        ...current,
        [severity]: {
          responseMinutes: String(payload.data.responseMinutes),
          resolutionMinutes: String(payload.data.resolutionMinutes),
          isActive: payload.data.isActive,
        },
      }));
      setSuccess(`${severity} SLA rule updated.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to update SLA rule.");
    } finally {
      setSavingSeverity(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {summaries.map((item) => (
          <Card key={item.severity}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{item.severity}</span>
                <Badge variant={severityVariant[item.severity]}>{item.severity}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted">
              <p>Response: {item.response}</p>
              <p>Resolution: {item.resolution}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage SLA Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Response minutes</th>
                  <th className="px-6 py-4">Resolution minutes</th>
                  <th className="px-6 py-4">Active</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {rules.map((rule) => {
                  const draft = drafts[rule.severity];
                  return (
                    <tr key={rule.id}>
                      <td className="px-6 py-4 font-semibold text-foreground">{rule.severity}</td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          min={1}
                          value={draft?.responseMinutes ?? String(rule.responseMinutes)}
                          onChange={(event) => updateDraft(rule.severity, { responseMinutes: event.target.value })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          min={1}
                          value={draft?.resolutionMinutes ?? String(rule.resolutionMinutes)}
                          onChange={(event) => updateDraft(rule.severity, { resolutionMinutes: event.target.value })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={draft?.isActive ?? rule.isActive}
                          onCheckedChange={(checked) => updateDraft(rule.severity, { isActive: checked })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => saveRule(rule.severity)}
                          disabled={savingSeverity === rule.severity}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {savingSeverity === rule.severity ? "Saving..." : "Save"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
