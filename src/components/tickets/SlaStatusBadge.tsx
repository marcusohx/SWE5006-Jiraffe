"use client";

import { Badge } from "@/components/ui/badge";
import { formatDurationFromNow } from "@/lib/utils";

type SlaLike = {
  status: "Open" | "In Progress" | "Closed";
  sla: {
    responseDueAt: Date | string;
    resolutionDueAt: Date | string;
    acknowledgedAt: Date | string | null;
    breachedResponse: boolean;
    breachedResolution: boolean;
  };
};

export function SlaStatusBadge({ incident }: { incident: SlaLike }) {
  if (incident.status === "Closed") {
    return <Badge variant="success">SLA stopped</Badge>;
  }

  if (incident.sla.breachedResolution) {
    return <Badge variant="danger">Resolution breached</Badge>;
  }

  if (incident.sla.breachedResponse) {
    return <Badge variant="warning">Response breached</Badge>;
  }

  if (!incident.sla.acknowledgedAt) {
    return <Badge variant="info">Ack {formatDurationFromNow(incident.sla.responseDueAt)}</Badge>;
  }

  return <Badge variant="info">Resolve {formatDurationFromNow(incident.sla.resolutionDueAt)}</Badge>;
}
