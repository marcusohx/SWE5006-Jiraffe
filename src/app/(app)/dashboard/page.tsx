import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activityFeed, dashboardMetrics, tickets } from "@/lib/mock-data";

export default function DashboardPage() {
  const spotlightTicket = tickets[0];

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
            <CardTitle>{spotlightTicket.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[color:var(--color-muted)]">{spotlightTicket.summary}</p>
            <div className="flex flex-wrap gap-2">
              {spotlightTicket.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[color:var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-[color:var(--color-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
              <span>Assignee: {spotlightTicket.assignee}</span>
              <span>Reporter: {spotlightTicket.reporter}</span>
              <span>Updated: {spotlightTicket.updatedAt}</span>
            </div>
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
