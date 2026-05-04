import { ArrowLeft, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamCodeCopyButton } from "@/components/teams/TeamCodeCopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/utils";
import { authOptions } from "@/modules/auth/auth.options";
import { getTeamById } from "@/modules/team/team.service";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  let team;
  try {
    if (!session?.user?.id) {
      notFound();
    }
    team = await getTeamById(id, session.user.id, session.user.role);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teams" className="text-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm text-muted">Team Details</p>
            <h1 className="text-3xl font-semibold">{team.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-border bg-white px-4 py-2 text-xs text-muted">
            Team ID: {team.teamId}
          </div>
          <div className="rounded-full border border-border bg-white px-2 py-1 text-xs text-muted">
            <TeamCodeCopyButton teamCode={team.teamCode} />
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              team.isActive
                ? "bg-accent-soft text-accent"
                : "bg-surface-muted text-muted"
            }`}
          >
            {team.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase text-muted">Description</p>
              <p className="mt-2 text-sm text-foreground">
                {team.description ?? "No description provided."}
              </p>
            </div>
            <div className="grid gap-2 text-sm text-muted">
              <div>Created {formatDisplayDate(team.createdAt)}</div>
              <div>Updated {formatDisplayDate(team.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.members.length === 0 ? (
              <p className="text-sm text-muted">No members added.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {team.members.map((member) => (
                  <li key={member.userId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted">{member.email}</p>
                    </div>
                    <span className="text-xs text-muted">{member.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
