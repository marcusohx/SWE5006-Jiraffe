import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, formatRelativeTime } from "@/lib/utils";
import { dashboardMetrics } from "@/lib/mock-data";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";
import { listRecentActivities } from "@/modules/activity/activity.service";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [incidents, teams] = await Promise.all([
    listIncidents(),
    listTeams(session.user.id),
  ]);

  const teamIds = teams.map((t) => t.teamId);
  const scopedIncidents = incidents.filter((incident) => teamIds.includes(incident.teamId));
  const spotlightTicket = scopedIncidents[0] ?? null;

  const activities = await listRecentActivities(teamIds, 3);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold">Product Operations Dashboard</h1>
          <p className="mt-2 text-muted">
            Track sprint health, ticket velocity, and team ownership in one command center.
          </p>
        </div>
        <Button>
          Review Sprint Report
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="info">{metric.trend}</Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Focus Ticket</CardDescription>
            <CardTitle>{spotlightTicket?.title ?? "No incidents"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {spotlightTicket ? (
              <>
                <p className="text-sm text-muted">{spotlightTicket.description}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted">
                  <span>Assignee: {spotlightTicket.assignedToName}</span>
                  <span>Reporter: {spotlightTicket.createdByName}</span>
                  <span>Updated: {formatDisplayDate(spotlightTicket.updatedAt)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">No incidents to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Activity Feed</CardDescription>
            <CardTitle>Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted">No recent activity.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-border bg-white p-3">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted">{formatRelativeTime(activity.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
