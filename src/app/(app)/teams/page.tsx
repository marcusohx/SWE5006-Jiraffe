import { getServerSession } from "next-auth";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { EditTeamModal } from "@/components/teams/EditTeamModal";
import { TeamsTableSection } from "@/components/teams/TeamsTableSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/modules/auth/auth.options";
import { listTeams } from "@/modules/team/team.service";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const teams = await listTeams(session.user.id);

  return (
    <div className="space-y-6">
      <Suspense>
        <CreateTeamModal />
      </Suspense>
      <Suspense>
        <EditTeamModal />
      </Suspense>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Teams</p>
          <h1 className="mt-2 text-3xl font-semibold">Team Management</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href="?createTeam=true">
              <Plus className="h-4 w-4" />
              Add Team
            </Link>
          </Button>
        </div>
      </section>

      {teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              No teams currently. Please proceed to create a team.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamsTableSection initialRows={teams} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
