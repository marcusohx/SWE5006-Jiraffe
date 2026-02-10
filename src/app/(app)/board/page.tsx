import { IncidentBoard } from "@/components/board/IncidentBoard";
import { listIncidents } from "@/modules/incident/incident.service";

export default async function BoardPage() {
  const incidents = await listIncidents();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Kanban</p>
        <h1 className="mt-2 text-3xl font-semibold">Sprint Board</h1>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Drag tickets across lanes to visualize work in motion.
        </p>
      </div>

      <IncidentBoard initialIncidents={incidents} />
    </div>
  );
}
