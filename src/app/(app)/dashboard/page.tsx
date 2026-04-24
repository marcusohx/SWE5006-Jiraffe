import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, formatRelativeTime } from "@/lib/utils";
import { authOptions } from "@/modules/auth/auth.options";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";
import { listRecentActivities } from "@/modules/activity/activity.service";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type MetricResult = { value: string; trend: string | null; variant: "default" | "success" | "warning" };

function calcOpenTicketMetric(
  scopedIncidents: IncidentWithNames[],
  hasTeams: boolean,
  now: number
): MetricResult {
  if (!hasTeams) return { value: "—", trend: null, variant: "default" };

  const currentOpen = scopedIncidents.filter((i) => i.status === "Open").length;
  const t7 = now - 7 * MS_PER_DAY;
  const prevOpen = scopedIncidents.filter(
    (i) => i.createdAt.getTime() <= t7 && (i.closedOn === null || i.closedOn.getTime() > t7)
  ).length;

  if (prevOpen === 0) {
    return { value: String(currentOpen), trend: currentOpen > 0 ? "New" : null, variant: "default" };
  }

  const pct = Math.round(((currentOpen - prevOpen) / prevOpen) * 100);
  return {
    value: String(currentOpen),
    trend: `${pct >= 0 ? "+" : ""}${pct}%`,
    variant: pct <= 0 ? "success" : "warning",
  };
}

function calcResolutionMetric(
  scopedIncidents: IncidentWithNames[],
  hasTeams: boolean,
  now: number
): MetricResult {
  if (!hasTeams) return { value: "—", trend: null, variant: "default" };

  const allClosed = scopedIncidents.filter((i) => i.closedOn !== null);
  if (allClosed.length === 0) return { value: "—", trend: null, variant: "default" };

  const totalMs = allClosed.reduce(
    (sum, i) => sum + (i.closedOn!.getTime() - i.createdAt.getTime()),
    0
  );
  const value = `${(totalMs / allClosed.length / MS_PER_DAY).toFixed(1)}d`;

  const t30 = now - 30 * MS_PER_DAY;
  const t60 = now - 60 * MS_PER_DAY;
  const avgMs = (list: IncidentWithNames[]) => {
    const c = list.filter((i) => i.closedOn !== null);
    if (c.length === 0) return null;
    return c.reduce((s, i) => s + (i.closedOn!.getTime() - i.createdAt.getTime()), 0) / c.length;
  };
  const curMs = avgMs(scopedIncidents.filter((i) => i.closedOn !== null && i.closedOn.getTime() >= t30));
  const preMs = avgMs(
    scopedIncidents.filter(
      (i) => i.closedOn !== null && i.closedOn.getTime() >= t60 && i.closedOn.getTime() < t30
    )
  );

  if (curMs === null || preMs === null || preMs === 0) return { value, trend: null, variant: "default" };

  const pct = Math.round(((curMs - preMs) / preMs) * 100);
  return { value, trend: `${pct >= 0 ? "+" : ""}${pct}%`, variant: pct <= 0 ? "success" : "warning" };
}

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

  const hasTeams = teamIds.length > 0;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const openMetric = calcOpenTicketMetric(scopedIncidents, hasTeams, now);
  const resMetric = calcResolutionMetric(scopedIncidents, hasTeams, now);

  const metrics = [
    { label: "Open Tickets",    value: openMetric.value, trend: openMetric.trend, trendVariant: openMetric.variant },
    { label: "Avg. Resolution", value: resMetric.value,  trend: resMetric.trend,  trendVariant: resMetric.variant },
    { label: "SLA Met",         value: "94%",              trend: "+3%",      trendVariant: "info" as const },
    { label: "Active Sprints",  value: "3",                trend: "Stable",   trendVariant: "info" as const },
  ];

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
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              {metric.trend !== null && (
                <Badge variant={metric.trendVariant}>{metric.trend}</Badge>
              )}
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
