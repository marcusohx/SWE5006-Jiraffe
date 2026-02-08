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
import type { Ticket } from "@/lib/mock-data";

const statusVariant: Record<Ticket["status"], "default" | "info" | "success" | "warning"> = {
  Backlog: "default",
  "In Progress": "info",
  Review: "warning",
  Done: "success",
};

const priorityVariant: Record<Ticket["priority"], "default" | "info" | "warning" | "danger"> = {
  Low: "default",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

export function DataTable({ rows }: { rows: Ticket[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <Link className="font-semibold text-[color:var(--color-foreground)]" href={`/tickets/${ticket.id}`}>
                {ticket.title}
              </Link>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">{ticket.id}</p>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
            </TableCell>
            <TableCell>{ticket.assignee}</TableCell>
            <TableCell className="text-[color:var(--color-muted)]">{ticket.updatedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
