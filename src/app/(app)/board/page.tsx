import { Badge } from "@/components/ui/badge";
import { TicketCard } from "@/components/tickets/TicketCard";
import { boardColumns } from "@/lib/mock-data";

const columnDescriptions: Record<string, string> = {
  Backlog: "Triaged and ready for grooming.",
  "In Progress": "Actively being worked on by the team.",
  Review: "Awaiting QA and stakeholder sign-off.",
  Done: "Shipped and communicated to stakeholders.",
};

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Kanban</p>
        <h1 className="mt-2 text-3xl font-semibold">Sprint Board</h1>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Drag tickets across lanes to visualize work in motion.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {Object.entries(boardColumns).map(([status, tickets]) => (
          <div key={status} className="space-y-4">
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{status}</h2>
                <Badge variant="info">{tickets.length}</Badge>
              </div>
              <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                {columnDescriptions[status]}
              </p>
            </div>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
