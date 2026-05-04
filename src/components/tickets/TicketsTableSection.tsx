"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveDataTable, type SortColumn, type SortState } from "@/components/data/InteractiveDataTable";
import { DeleteIncidentConfirmModal } from "@/components/tickets/DeleteIncidentConfirmModal";
import { TicketsTableControls } from "@/components/tickets/TicketsTableControls";
import { TeamScopeSelector } from "@/components/ui/team-scope-selector";
import { Badge } from "@/components/ui/badge";
import { severityOrder, statusOrder } from "@/lib/constants";
import { formatIncidentCode, includesIgnoreCase } from "@/lib/utils";
import { useTeamSelection } from "@/hooks/useTeamSelection";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TeamScopeOption, TeamOptionWithMembers } from "@/types/domain";

function matchesSearchQuery(incident: IncidentWithNames, q: string): boolean {
  return (
    includesIgnoreCase(incident.title, q) ||
    includesIgnoreCase(formatIncidentCode(incident.incidentId), q) ||
    includesIgnoreCase(String(incident.incidentId), q) ||
    includesIgnoreCase(incident.description, q) ||
    includesIgnoreCase(incident.assignedToName, q) ||
    includesIgnoreCase(incident.status, q) ||
    includesIgnoreCase(incident.severity, q)
  );
}

function matchesDateRange(updatedDate: Date, fromDate: Date | null, toDate: Date | null): boolean {
  if (fromDate && updatedDate < fromDate) return false;
  if (toDate && updatedDate > toDate) return false;
  return true;
}

function matchesListFilter<T>(values: T[], value: T): boolean {
  return values.length === 0 || values.includes(value);
}

function filterIncidents(
  incidents: IncidentWithNames[],
  searchQuery: string,
  statusFilter: IncidentStatus[],
  severityFilter: IncidentSeverity[],
  updatedFrom: string,
  updatedTo: string
): IncidentWithNames[] {
  const q = searchQuery.trim().toLowerCase();
  const fromDate = updatedFrom ? new Date(`${updatedFrom}T00:00:00`) : null;
  const toDate = updatedTo ? new Date(`${updatedTo}T23:59:59.999`) : null;

  return incidents.filter((incident) => {
    if (q && !matchesSearchQuery(incident, q)) return false;
    if (!matchesListFilter(statusFilter, incident.status)) return false;
    if (!matchesListFilter(severityFilter, incident.severity)) return false;
    return matchesDateRange(new Date(incident.updatedAt), fromDate, toDate);
  });
}

function sortIncidents(incidents: IncidentWithNames[], sort: SortState): IncidentWithNames[] {
  if (!sort) return incidents;

  const sorted = [...incidents];
  sorted.sort((a, b) => {
    let result = 0;
    if (sort.column === "ticket") result = a.title.localeCompare(b.title);
    if (sort.column === "status") result = statusOrder[a.status] - statusOrder[b.status];
    if (sort.column === "severity") result = severityOrder[a.severity] - severityOrder[b.severity];
    if (sort.column === "assignee") result = a.assignedToName.localeCompare(b.assignedToName);
    if (sort.column === "updated") {
      result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sort.direction === "asc" ? result : -result;
  });

  return sorted;
}

export type { TeamScopeOption };

export function TicketsTableSection({
  initialRows,
  teamOptions,
  teamOptionsWithMembers,
  currentUserId,
}: {
  initialRows: IncidentWithNames[];
  teamOptions: TeamScopeOption[];
  teamOptionsWithMembers: TeamOptionWithMembers[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { selectedTeamId, selectedTeam, onSelectTeam } = useTeamSelection(teamOptions);
  const [rows, setRows] = useState<IncidentWithNames[]>(initialRows);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus[]>([]);
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity[]>([]);
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const [incidentToDelete, setIncidentToDelete] = useState<IncidentWithNames | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setRows(initialRows));
  }, [initialRows]);

  const teamScopedRows = useMemo(() => {
    if (selectedTeamId === null) {
      return [];
    }
    return rows.filter((incident) => incident.teamId === selectedTeamId);
  }, [rows, selectedTeamId]);

  useEffect(() => {
    if (!incidentToDelete) {
      return;
    }

    const stillExists = teamScopedRows.some((row) => row.id === incidentToDelete.id);
    if (!stillExists) {
      queueMicrotask(() => {
        setIncidentToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
      });
    }
  }, [teamScopedRows, incidentToDelete]);

  const filteredRows = useMemo(
    () => filterIncidents(teamScopedRows, searchQuery, statusFilter, severityFilter, updatedFrom, updatedTo),
    [teamScopedRows, searchQuery, statusFilter, severityFilter, updatedFrom, updatedTo]
  );

  const visibleRows = useMemo(() => sortIncidents(filteredRows, sort), [filteredRows, sort]);

  const counts = useMemo(() => {
    return {
      open: visibleRows.filter((row) => row.status === "Open").length,
      inProgress: visibleRows.filter((row) => row.status === "In Progress").length,
      closed: visibleRows.filter((row) => row.status === "Closed").length,
    };
  }, [visibleRows]);

  const onToggleStatus = (status: IncidentStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((value) => value !== status) : [...prev, status]
    );
  };

  const onToggleSeverity = (severity: IncidentSeverity) => {
    setSeverityFilter((prev) =>
      prev.includes(severity) ? prev.filter((value) => value !== severity) : [...prev, severity]
    );
  };

  const onClearAll = () => {
    setStatusFilter([]);
    setSeverityFilter([]);
    setUpdatedFrom("");
    setUpdatedTo("");
    setSearchQuery("");
    setSort(null);
  };

  const onToggleSort = (column: SortColumn) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return null;
    });
  };

  const onConfirmDelete = async () => {
    if (!incidentToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/incidents/${incidentToDelete.id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiSuccess<{ deleted: boolean }> | ApiError;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to delete ticket." : payload.error);
      }

      setRows((prev) => prev.filter((row) => row.id !== incidentToDelete.id));
      setIncidentToDelete(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Unable to delete ticket.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <TeamScopeSelector
            teamOptions={teamOptions}
            selectedTeamId={selectedTeamId}
            selectedTeam={selectedTeam}
            onSelectTeam={onSelectTeam}
          />

          <TicketsTableControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onToggleStatus={onToggleStatus}
            severityFilter={severityFilter}
            onToggleSeverity={onToggleSeverity}
            updatedFrom={updatedFrom}
            onUpdatedFromChange={setUpdatedFrom}
            updatedTo={updatedTo}
            onUpdatedToChange={setUpdatedTo}
            onClearAll={onClearAll}
          />
        </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <Badge className="whitespace-nowrap" variant="default">Open {counts.open}</Badge>
          <Badge className="whitespace-nowrap" variant="info">In Progress {counts.inProgress}</Badge>
          <Badge className="whitespace-nowrap" variant="success">Closed {counts.closed}</Badge>
        </div>
      </div>

      <InteractiveDataTable
        rows={visibleRows}
        sort={sort}
        onToggleSort={onToggleSort}
        currentUserId={currentUserId}
        teamOptionsWithMembers={teamOptionsWithMembers}
        onRequestDelete={(incident) => {
          setDeleteError(null);
          setIncidentToDelete(incident);
        }}
        deletingId={isDeleting ? incidentToDelete?.id ?? null : null}
      />

      <DeleteIncidentConfirmModal
        open={Boolean(incidentToDelete)}
        incident={incidentToDelete}
        onClose={() => {
          if (!isDeleting) {
            setIncidentToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={onConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
