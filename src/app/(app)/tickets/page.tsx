import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTicketButton } from "@/components/tickets/CreateTicketButton";
import { TicketsTableSection, type TeamScopeOption } from "@/components/tickets/TicketsTableSection";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";

export default async function TicketsPage() {
  const [session, incidents, teams] = await Promise.all([
    getServerSession(authOptions),
    listIncidents(),
    listTeams(),
  ]);

  const userId = session?.user?.id ?? "";
  const teamScopeOptions: TeamScopeOption[] = teams
    .filter((team) => team.members.some((member) => member.userId === userId))
    .map((team) => ({
      teamId: team.teamId,
      name: team.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const scopedTeamIds = new Set(teamScopeOptions.map((team) => team.teamId));
  const scopedIncidents = incidents.filter((incident) => scopedTeamIds.has(incident.teamId));

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Tickets</p>
          <h1 className="mt-2 text-3xl font-semibold">All Tickets</h1>
        </div>
        <CreateTicketButton label="Create Ticket" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <TicketsTableSection initialRows={scopedIncidents} teamOptions={teamScopeOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
