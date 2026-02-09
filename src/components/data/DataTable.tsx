import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";

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

export function DataTable({ rows }: { rows: IncidentWithNames[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((incident) => (
          <TableRow key={incident.id}>
            <TableCell>
              <Link className="font-semibold text-[color:var(--color-foreground)]" href={`/tickets/${incident.id}`}>
                {incident.title}
              </Link>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">{incident.incidentId}</p>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
            </TableCell>
            <TableCell>{incident.assignedToName}</TableCell>
            <TableCell className="text-[color:var(--color-muted)]">
              {new Date(incident.updatedAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
