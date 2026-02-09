import { Badge } from "@/components/ui/badge";
import { TicketCard } from "@/components/tickets/TicketCard";
import { listIncidents } from "@/modules/incident/incident.service";
import type { IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";

const columnDescriptions: Record<IncidentStatus, string> = {
  Open: "Triaged and awaiting assignment.",
  "In Progress": "Actively being worked on by the team.",
  Closed: "Resolved and communicated to stakeholders.",
};

const columns: IncidentStatus[] = ["Open", "In Progress", "Closed"];

export default async function BoardPage() {
  const incidents = await listIncidents();

  const grouped: Record<IncidentStatus, IncidentWithNames[]> = {
    Open: incidents.filter((i) => i.status === "Open"),
    "In Progress": incidents.filter((i) => i.status === "In Progress"),
    Closed: incidents.filter((i) => i.status === "Closed"),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Kanban</p>
        <h1 className="mt-2 text-3xl font-semibold">Sprint Board</h1>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Drag tickets across lanes to visualize work in motion.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {columns.map((status) => (
          <div key={status} className="space-y-4">
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{status}</h2>
                <Badge variant="info">{grouped[status].length}</Badge>
              </div>
              <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                {columnDescriptions[status]}
              </p>
            </div>
            <div className="space-y-3">
              {grouped[status].map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
