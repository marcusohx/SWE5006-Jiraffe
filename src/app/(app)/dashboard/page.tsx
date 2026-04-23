import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, formatRelativeTime } from "@/lib/utils";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidents } from "@/modules/incident/incident.service";
import { listTeams } from "@/modules/team/team.service";
import { listRecentActivities } from "@/modules/activity/activity.service";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

  // --- Open Tickets ---
  const currentOpen = hasTeams
    ? scopedIncidents.filter((i) => i.status === "Open").length
    : 0;

  const openTicketsValue = !hasTeams ? "—" : String(currentOpen);

  let openTrend: string | null = null;
  let openTrendVariant: "default" | "success" | "warning" = "default";
  if (hasTeams) {
    const t7 = now - 7 * MS_PER_DAY;
    const prevOpen = scopedIncidents.filter(
      (i) =>
        i.createdAt.getTime() <= t7 &&
        (i.closedOn === null || i.closedOn.getTime() > t7)
    ).length;
    if (prevOpen === 0) {
      openTrend = currentOpen > 0 ? "New" : null;
    } else {
      const pct = Math.round(((currentOpen - prevOpen) / prevOpen) * 100);
      openTrend = `${pct >= 0 ? "+" : ""}${pct}%`;
      openTrendVariant = pct <= 0 ? "success" : "warning";
    }
  }

  // --- Avg. Resolution ---
  const allClosed = hasTeams
    ? scopedIncidents.filter((i) => i.closedOn !== null)
    : [];

  const avgResolutionValue: string = (() => {
    if (!hasTeams || allClosed.length === 0) return "—";
    const totalMs = allClosed.reduce(
      (sum, i) => sum + (i.closedOn!.getTime() - i.createdAt.getTime()),
      0
    );
    return `${(totalMs / allClosed.length / MS_PER_DAY).toFixed(1)}d`;
  })();

  let resTrend: string | null = null;
  let resTrendVariant: "default" | "success" | "warning" = "default";
  if (hasTeams) {
    const t30 = now - 30 * MS_PER_DAY;
    const t60 = now - 60 * MS_PER_DAY;
    const recentClosed = scopedIncidents.filter(
      (i) => i.closedOn !== null && i.closedOn.getTime() >= t30
    );
    const prevClosed = scopedIncidents.filter(
      (i) =>
        i.closedOn !== null &&
        i.closedOn.getTime() >= t60 &&
        i.closedOn.getTime() < t30
    );
    const avgMs = (list: typeof scopedIncidents) => {
      const c = list.filter((i) => i.closedOn !== null);
      if (c.length === 0) return null;
      return (
        c.reduce((s, i) => s + (i.closedOn!.getTime() - i.createdAt.getTime()), 0) /
        c.length
      );
    };
    const curMs = avgMs(recentClosed);
    const preMs = avgMs(prevClosed);
    if (curMs !== null && preMs !== null && preMs > 0) {
      const pct = Math.round(((curMs - preMs) / preMs) * 100);
      resTrend = `${pct >= 0 ? "+" : ""}${pct}%`;
      resTrendVariant = pct <= 0 ? "success" : "warning";
    }
  }

  const metrics = [
    { label: "Open Tickets",    value: openTicketsValue,   trend: openTrend,  trendVariant: openTrendVariant },
    { label: "Avg. Resolution", value: avgResolutionValue, trend: resTrend,   trendVariant: resTrendVariant },
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
