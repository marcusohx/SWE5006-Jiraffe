import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTicketButton } from "@/components/tickets/CreateTicketButton";
import { TicketsTableSection, type TeamScopeOption } from "@/components/tickets/TicketsTableSection";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";
import type { TeamOptionWithMembers } from "@/types/domain";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [incidents, teams] = await Promise.all([
    listIncidents(session.user.id, session.user.role),
    listTeams(session.user.id),
  ]);

  const teamScopeOptions: TeamScopeOption[] = teams
    .map((team) => ({
      teamId: team.teamId,
      name: team.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const teamOptionsWithMembers: TeamOptionWithMembers[] = teams.map((team) => ({
    teamId: team.teamId,
    name: team.name,
    members: team.members,
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Tickets</p>
          <h1 className="mt-2 text-3xl font-semibold">All Tickets</h1>
        </div>
        <Suspense fallback={null}>
          <CreateTicketButton label="Create Ticket" />
        </Suspense>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <Suspense fallback={null}>
            <TicketsTableSection
              initialRows={incidents}
              teamOptions={teamScopeOptions}
              teamOptionsWithMembers={teamOptionsWithMembers}
              currentUserId={session.user.id}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
