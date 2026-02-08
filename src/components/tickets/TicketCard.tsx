import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Ticket } from "@/lib/mock-data";

const priorityVariant: Record<Ticket["priority"], "default" | "warning" | "danger" | "info"> = {
  Low: "default",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="border-transparent bg-[color:var(--color-surface)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[color:var(--color-muted)]">{ticket.id}</p>
            <h4 className="text-sm font-semibold text-[color:var(--color-foreground)]">
              {ticket.title}
            </h4>
          </div>
          <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
        </div>
        <p className="text-xs text-[color:var(--color-muted)]">{ticket.summary}</p>
        <div className="flex flex-wrap gap-2">
          {ticket.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[color:var(--color-surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)]">
          <span>Assignee: {ticket.assignee}</span>
          <span>{ticket.updatedAt}</span>
        </div>
      </CardContent>
    </Card>
  );
}
