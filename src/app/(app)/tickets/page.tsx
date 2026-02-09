import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketsTableSection } from "@/components/tickets/TicketsTableSection";
import { listIncidents } from "@/modules/incident/incident.service";

export default async function TicketsPage() {
  const incidents = await listIncidents();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Tickets</p>
          <h1 className="mt-2 text-3xl font-semibold">All Tickets</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href="?create=true">
              <Plus className="h-4 w-4" />
              Create Ticket
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsTableSection initialRows={incidents} />
        </CardContent>
      </Card>
    </div>
  );
}
