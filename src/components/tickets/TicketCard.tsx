import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDisplayDate } from "@/lib/utils";
import type { IncidentSeverity, IncidentWithNames } from "@/modules/incident/incident.model";

const severityVariant: Record<IncidentSeverity, "default" | "warning" | "danger" | "info"> = {
  Low: "default",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

export function TicketCard({ ticket, className }: { ticket: IncidentWithNames; className?: string }) {
  return (
    <Card
      className={cn(
        "border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)]",
        className
      )}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[color:var(--color-muted)]">{ticket.incidentId}</p>
            <h4 className="text-sm font-semibold text-[color:var(--color-foreground)]">
              {ticket.title}
            </h4>
          </div>
          <Badge variant={severityVariant[ticket.severity]}>{ticket.severity}</Badge>
        </div>
        <p className="text-xs text-[color:var(--color-muted)]">{ticket.description}</p>
        <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)]">
          <span>Assignee: {ticket.assignedToName}</span>
          <span>{formatDisplayDate(ticket.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
