"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from "lucide-react";
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
import { cn, formatDisplayDate } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";

export type SortColumn = "ticket" | "status" | "severity" | "assignee" | "updated";
export type SortDirection = "asc" | "desc";
export type SortState = { column: SortColumn; direction: SortDirection } | null;

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

function SortIcon({ active, direction }: { active: boolean; direction?: SortDirection }) {
  if (!active || !direction) {
    return <ArrowUpDown className="h-4 w-4" />;
  }
  if (direction === "asc") {
    return <ArrowUp className="h-4 w-4" />;
  }
  return <ArrowDown className="h-4 w-4" />;
}

function SortHeader({
  label,
  column,
  sort,
  onToggleSort,
}: {
  label: string;
  column: SortColumn;
  sort: SortState;
  onToggleSort: (column: SortColumn) => void;
}) {
  const active = sort?.column === column;
  return (
    <button
      type="button"
      onClick={() => onToggleSort(column)}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1 py-1 transition",
        active ? "text-[color:var(--color-foreground)]" : "text-[color:var(--color-muted)]"
      )}
    >
      <span>{label}</span>
      <SortIcon active={active} direction={sort?.direction} />
    </button>
  );
}

export function InteractiveDataTable({
  rows,
  sort,
  onToggleSort,
  onRequestDelete,
  deletingId,
}: {
  rows: IncidentWithNames[];
  sort: SortState;
  onToggleSort: (column: SortColumn) => void;
  onRequestDelete: (incident: IncidentWithNames) => void;
  deletingId: string | null;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader label="Ticket" column="ticket" sort={sort} onToggleSort={onToggleSort} />
          </TableHead>
          <TableHead>
            <SortHeader label="Status" column="status" sort={sort} onToggleSort={onToggleSort} />
          </TableHead>
          <TableHead>
            <SortHeader label="Severity" column="severity" sort={sort} onToggleSort={onToggleSort} />
          </TableHead>
          <TableHead>
            <SortHeader label="Assignee" column="assignee" sort={sort} onToggleSort={onToggleSort} />
          </TableHead>
          <TableHead>
            <SortHeader label="Updated" column="updated" sort={sort} onToggleSort={onToggleSort} />
          </TableHead>
          <TableHead className="w-[90px]">Delete</TableHead>
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
              {formatDisplayDate(incident.updatedAt)}
            </TableCell>
            <TableCell>
              <button
                type="button"
                aria-label={`Delete ${incident.title}`}
                className="rounded-full p-2 text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-danger)] disabled:opacity-40"
                disabled={deletingId === incident.id}
                onClick={() => onRequestDelete(incident)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-[color:var(--color-muted)]">
              No tickets match your search and filters.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
