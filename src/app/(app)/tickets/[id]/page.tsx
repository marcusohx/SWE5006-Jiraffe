import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditableComment } from "@/components/tickets/EditableComment";
import { EditableTicketDetails } from "@/components/tickets/EditableTicketDetails";
import { TicketMetadata } from "@/components/tickets/TicketMetadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/utils";
import { getIncidentById } from "@/modules/incident/incident.service";

function resolveBackHref(returnTo: string | string[] | undefined): string {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!value) {
    return "/tickets";
  }

  // Only allow internal relative paths.
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/tickets";
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const backHref = resolveBackHref(returnTo);
  let incident;
  try {
    incident = await getIncidentById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="text-[color:var(--color-muted)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm text-[color:var(--color-muted)]">Ticket Details</p>
            <h1 className="text-3xl font-semibold">{incident.title}</h1>
          </div>
        </div>
        <Button>Assign to me</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditableTicketDetails
              incidentId={incident.id}
              initialTitle={incident.title}
              initialDescription={incident.description}
            />
            <div className="grid gap-2 text-sm text-[color:var(--color-muted)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Updated {formatDisplayDate(incident.updatedAt)}
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Reporter: {incident.createdByName}
              </div>
            </div>
            <EditableComment incidentId={incident.id} initialComment={incident.comment} />
          </CardContent>
        </Card>

        <TicketMetadata incident={incident} />
      </div>
    </div>
  );
}
