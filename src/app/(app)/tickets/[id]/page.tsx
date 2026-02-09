import { ArrowLeft, Calendar, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIncidentById } from "@/modules/incident/incident.service";
import type { IncidentSeverity, IncidentStatus } from "@/modules/incident/incident.model";

const statusVariant: Record<IncidentStatus, "default" | "info" | "success"> = {
  Open: "default",
  "In Progress": "info",
  Closed: "success",
};

const severityVariant: Record<IncidentSeverity, "default" | "info" | "warning" | "danger"> = {
  Low: "default",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
          <Link href="/tickets" className="text-[color:var(--color-muted)]">
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
            <p className="text-sm text-[color:var(--color-muted)]">{incident.description}</p>
            <div className="grid gap-2 text-sm text-[color:var(--color-muted)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Updated {new Date(incident.updatedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Reporter: {incident.createdByName}
              </div>
              {incident.comment && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {incident.comment}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Status</p>
              <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Severity</p>
              <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Assignee</p>
              <p className="text-sm font-medium">{incident.assignedToName}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Assigned By</p>
              <p className="text-sm font-medium">{incident.assignedByName}</p>
            </div>
            {incident.closedOn && (
              <div>
                <p className="text-xs uppercase text-[color:var(--color-muted)]">Closed On</p>
                <p className="text-sm font-medium">{new Date(incident.closedOn).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
