import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TeamScopedIncidentBoard } from "@/components/board/TeamScopedIncidentBoard";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";
import type { TeamScopeOption } from "@/types/domain";

export default async function BoardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [incidents, teams] = await Promise.all([
    listIncidents(),
    listTeams(session.user.id),
  ]);

  const teamOptions: TeamScopeOption[] = teams
    .map((team) => ({
      teamId: team.teamId,
      name: team.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const scopedTeamIds = new Set(teamOptions.map((team) => team.teamId));
  const scopedIncidents = incidents.filter((incident) => scopedTeamIds.has(incident.teamId));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Kanban</p>
        <h1 className="mt-2 text-3xl font-semibold">Sprint Board</h1>
        <p className="mt-2 text-muted">
          Drag tickets across lanes to visualize work in motion.
        </p>
      </div>

      <Suspense fallback={null}>
        <TeamScopedIncidentBoard incidents={scopedIncidents} teamOptions={teamOptions} />
      </Suspense>
    </div>
  );
}
