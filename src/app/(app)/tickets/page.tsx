import { Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data/DataTable";
import { listIncidents } from "@/modules/incident/incident.service";

export default async function TicketsPage() {
  const incidents = await listIncidents();

  const openCount = incidents.filter((i) => i.status === "Open").length;
  const inProgressCount = incidents.filter((i) => i.status === "In Progress").length;
  const closedCount = incidents.filter((i) => i.status === "Closed").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Tickets</p>
          <h1 className="mt-2 text-3xl font-semibold">All Tickets</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Ticket Pipeline</CardTitle>
          <div className="flex w-full flex-wrap gap-3 lg:w-auto">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
              <Input className="pl-9" placeholder="Search tickets" />
            </div>
            <Badge variant="default">Open {openCount}</Badge>
            <Badge variant="info">In Progress {inProgressCount}</Badge>
            <Badge variant="success">Closed {closedCount}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable rows={incidents} />
        </CardContent>
      </Card>
    </div>
  );
}
