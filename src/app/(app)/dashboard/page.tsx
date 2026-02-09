import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/utils";
import { activityFeed, dashboardMetrics } from "@/lib/mock-data";
import { listIncidents } from "@/modules/incident/incident.service";

export default async function DashboardPage() {
  const incidents = await listIncidents();
  const spotlightTicket = incidents[0] ?? null;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold">Product Operations Dashboard</h1>
          <p className="mt-2 text-[color:var(--color-muted)]">
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
                <p className="text-sm text-[color:var(--color-muted)]">{spotlightTicket.description}</p>
                <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
                  <span>Assignee: {spotlightTicket.assignedToName}</span>
                  <span>Reporter: {spotlightTicket.createdByName}</span>
                  <span>Updated: {formatDisplayDate(spotlightTicket.updatedAt)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[color:var(--color-muted)]">No incidents to display.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Activity Feed</CardDescription>
            <CardTitle>Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityFeed.map((activity) => (
              <div key={activity.title} className="rounded-xl border border-[color:var(--color-border)] bg-white p-3">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-[color:var(--color-muted)]">{activity.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
