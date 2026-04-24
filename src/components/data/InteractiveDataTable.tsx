"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { IncidentAcknowledgeButton } from "@/components/tickets/IncidentAcknowledgeButton";
import { IncidentCloseButton } from "@/components/tickets/IncidentCloseButton";
import { IncidentReassignControl } from "@/components/tickets/IncidentReassignControl";
import { SlaStatusBadge } from "@/components/tickets/SlaStatusBadge";
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
import { cn, formatDisplayDate, formatIncidentCode } from "@/lib/utils";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
import type { TeamOptionWithMembers } from "@/types/domain";

export type SortColumn = "ticket" | "status" | "severity" | "assignee" | "updated";
export type SortDirection = "asc" | "desc";
export type SortState = { column: SortColumn; direction: SortDirection } | null;

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
        active ? "text-foreground" : "text-muted"
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
  currentUserId,
  teamOptionsWithMembers,
  onRequestDelete,
  deletingId,
}: {
  rows: IncidentWithNames[];
  sort: SortState;
  onToggleSort: (column: SortColumn) => void;
  currentUserId: string | null;
  teamOptionsWithMembers: TeamOptionWithMembers[];
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
          <TableHead>SLA</TableHead>
          <TableHead>
            <SortHeader label="Updated" column="updated" sort={sort} onToggleSort={onToggleSort} />
          </TableHead>
          <TableHead className="w-[220px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((incident) => (
          <TableRow
            key={incident.id}
            className={cn(
              incident.sla.breachedResolution
                ? "bg-danger-soft hover:bg-danger-soft"
                : incident.sla.breachedResponse
                  ? "bg-warning-soft hover:bg-warning-soft"
                  : undefined
            )}
          >
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
            <TableCell>
              <div className="space-y-2">
                <SlaStatusBadge incident={incident} />
                <p className="text-xs text-muted">
                  {incident.sla.acknowledgedAt ? "Resolve due" : "Response due"}{" "}
                  {formatDisplayDate(
                    incident.sla.acknowledgedAt ? incident.sla.resolutionDueAt : incident.sla.responseDueAt
                  )}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-muted">
              {formatDisplayDate(incident.updatedAt)}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {currentUserId === incident.assignedTo && incident.status === "Open" ? (
                  <>
                    <IncidentAcknowledgeButton incidentId={incident.id} />
                    <IncidentReassignControl
                      incidentId={incident.id}
                      currentAssigneeId={incident.assignedTo}
                      users={
                        teamOptionsWithMembers.find((team) => team.teamId === incident.teamId)?.members.map((member) => ({
                          id: member.userId,
                          name: member.name,
                          email: member.email,
                        })) ?? []
                      }
                    />
                  </>
                ) : null}
                {currentUserId === incident.assignedTo && incident.status === "In Progress" ? (
                  <IncidentCloseButton incidentId={incident.id} />
                ) : null}
                <button
                  type="button"
                  aria-label={`Delete ${incident.title}`}
                  className="rounded-full p-2 text-muted transition hover:bg-surface-muted hover:text-danger disabled:opacity-40"
                  disabled={deletingId === incident.id}
                  onClick={() => onRequestDelete(incident)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-sm text-muted">
              No tickets match your search and filters.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
