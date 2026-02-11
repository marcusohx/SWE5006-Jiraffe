import { getServerSession } from "next-auth";
import { TeamScopedIncidentBoard } from "@/components/board/TeamScopedIncidentBoard";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";

export type TeamOption = {
  teamId: number;
  name: string;
};

export default async function BoardPage() {
  const [session, incidents, teams] = await Promise.all([
    getServerSession(authOptions),
    listIncidents(),
    listTeams(),
  ]);

  const userId = session?.user?.id ?? "";
  const teamOptions: TeamOption[] = teams
    .filter((team) => team.members.some((member) => member.userId === userId))
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
        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Kanban</p>
        <h1 className="mt-2 text-3xl font-semibold">Sprint Board</h1>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Drag tickets across lanes to visualize work in motion.
        </p>
      </div>

      <TeamScopedIncidentBoard incidents={scopedIncidents} teamOptions={teamOptions} />
    </div>
  );
}
