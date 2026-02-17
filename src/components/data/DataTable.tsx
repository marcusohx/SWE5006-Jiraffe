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
import { severityVariant, statusVariant } from "@/lib/constants";
import { formatDisplayDate, formatIncidentCode } from "@/lib/utils";
import type { IncidentWithNames } from "@/modules/incident/incident.model";

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
              <Link className="font-semibold text-foreground" href={`/tickets/${incident.id}`}>
                {incident.title}
              </Link>
              <p className="mt-1 text-xs text-muted">{formatIncidentCode(incident.incidentId)}</p>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
            </TableCell>
            <TableCell>{incident.assignedToName}</TableCell>
            <TableCell className="text-muted">
              {formatDisplayDate(incident.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
