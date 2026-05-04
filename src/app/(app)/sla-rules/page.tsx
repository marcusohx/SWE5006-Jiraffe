import { AlarmClock, ShieldAlert, TimerReset } from "lucide-react";
import { SlaRulesManager } from "@/components/sla/SlaRulesManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSlaRules } from "@/modules/sla-rule/sla-rule.service";

export default async function SlaRulesPage() {
  const rules = await listSlaRules();

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
              Strategy pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Each severity uses a dedicated SLA strategy for deadline computation while this page manages the timing configuration applied by those strategies.
          </CardContent>
        </Card>
      </div>

      <SlaRulesManager initialRules={rules} />
    </div>
  );
}
