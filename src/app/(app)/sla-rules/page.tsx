import { AlarmClock, ShieldAlert, TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listIncidentSlaPolicies } from "@/modules/incident/incident-sla";

function formatMinutes(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  return parts.join(" ");
}

const SEVERITY_HANDLING: Record<string, string> = {
  Critical: "Immediate ownership and same-shift resolution expected.",
  High: "Priority handling with same-day follow-through.",
  Medium: "Standard operational handling within one business day.",
};

function describeHandling(severity: string): string {
  return SEVERITY_HANDLING[severity] ?? "Planned handling unless business impact increases.";
}

export default function SlaRulesPage() {
  const rules = listIncidentSlaPolicies();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Operations Policy</p>
          <h1 className="mt-2 text-3xl font-semibold">SLA Rules</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Tickets start their SLA clock immediately on creation. The assigned user must acknowledge the ticket to move it from Open to In Progress. Only the assigned user can close the ticket.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlarmClock className="h-4 w-4" />
              Response clock
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Response SLA starts at ticket creation time and stops when the assignee acknowledges the ticket.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TimerReset className="h-4 w-4" />
              Resolution clock
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Resolution SLA continues running until the assigned user closes the incident.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Breach handling
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Response and resolution breaches are highlighted directly in the ticket table and notification panel.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SLA Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Response target</th>
                  <th className="px-6 py-4">Resolution target</th>
                  <th className="px-6 py-4">Expected handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {rules.map((rule) => (
                  <tr key={rule.severity}>
                    <td className="px-6 py-4 font-semibold text-foreground">{rule.severity}</td>
                    <td className="px-6 py-4 text-muted">{formatMinutes(rule.responseMinutes)}</td>
                    <td className="px-6 py-4 text-muted">{formatMinutes(rule.resolutionMinutes)}</td>
                    <td className="px-6 py-4 text-muted">
                      {describeHandling(rule.severity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
