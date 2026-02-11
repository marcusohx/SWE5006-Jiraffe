"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InteractiveDataTable, type SortColumn, type SortState } from "@/components/data/InteractiveDataTable";
import { DeleteIncidentConfirmModal } from "@/components/tickets/DeleteIncidentConfirmModal";
import { TicketsTableControls } from "@/components/tickets/TicketsTableControls";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { getLastSelectedTeamId, saveSelectedTeamId } from "@/lib/team-persistence";
import { formatIncidentCode } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string };

const statusOrder: Record<IncidentStatus, number> = {
  Open: 0,
  "In Progress": 1,
  Closed: 2,
};

const severityOrder: Record<IncidentSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export type TeamScopeOption = {
  teamId: number;
  name: string;
};

function includesIgnoreCase(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export function TicketsTableSection({
  initialRows,
  teamOptions,
}: {
  initialRows: IncidentWithNames[];
  teamOptions: TeamScopeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    setRows(initialRows);
  }, [initialRows]);

  const selectedTeamId = useMemo(() => {
    // Priority 1: URL query parameter
    const queryTeam = searchParams.get("team");
    const parsedTeamId = queryTeam ? Number.parseInt(queryTeam, 10) : Number.NaN;
    if (Number.isInteger(parsedTeamId) && teamOptions.some((team) => team.teamId === parsedTeamId)) {
      return parsedTeamId;
    }

    // Priority 2: Last selected team from localStorage
    const lastSelectedTeamId = getLastSelectedTeamId();
    if (lastSelectedTeamId !== null && teamOptions.some((team) => team.teamId === lastSelectedTeamId)) {
      return lastSelectedTeamId;
    }

    // Priority 3: First team as fallback
    return teamOptions[0]?.teamId ?? null;
  }, [teamOptions, searchParams]);

  useEffect(() => {
    if (selectedTeamId === null) {
      return;
    }
    if (searchParams.get("team") === String(selectedTeamId)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("team", String(selectedTeamId));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [selectedTeamId, searchParams, router, pathname]);

  useEffect(() => {
    if (selectedTeamId !== null) {
      saveSelectedTeamId(selectedTeamId);
    }
  }, [selectedTeamId]);

  const onSelectTeam = (teamId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("team", String(teamId));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const selectedTeam = useMemo(() => {
    return teamOptions.find((team) => team.teamId === selectedTeamId) ?? null;
  }, [teamOptions, selectedTeamId]);

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
      setIncidentToDelete(null);
      setDeleteError(null);
      setIsDeleting(false);
    }
  }, [teamScopedRows, incidentToDelete]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fromDate = updatedFrom ? new Date(`${updatedFrom}T00:00:00`) : null;
    const toDate = updatedTo ? new Date(`${updatedTo}T23:59:59.999`) : null;

    return teamScopedRows.filter((incident) => {
      const updatedDate = new Date(incident.updatedAt);

      if (q) {
        const matchesSearch =
          includesIgnoreCase(incident.title, q) ||
          includesIgnoreCase(formatIncidentCode(incident.incidentId), q) ||
          includesIgnoreCase(String(incident.incidentId), q) ||
          includesIgnoreCase(incident.description, q) ||
          includesIgnoreCase(incident.assignedToName, q) ||
          includesIgnoreCase(incident.status, q) ||
          includesIgnoreCase(incident.severity, q);
        if (!matchesSearch) {
          return false;
        }
      }

      if (statusFilter.length > 0 && !statusFilter.includes(incident.status)) {
        return false;
      }

      if (severityFilter.length > 0 && !severityFilter.includes(incident.severity)) {
        return false;
      }

      if (fromDate && updatedDate < fromDate) {
        return false;
      }

      if (toDate && updatedDate > toDate) {
        return false;
      }

      return true;
    });
  }, [teamScopedRows, searchQuery, statusFilter, severityFilter, updatedFrom, updatedTo]);

  const visibleRows = useMemo(() => {
    if (!sort) {
      return filteredRows;
    }

    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let result = 0;

      if (sort.column === "ticket") {
        result = a.title.localeCompare(b.title);
      }
      if (sort.column === "status") {
        result = statusOrder[a.status] - statusOrder[b.status];
      }
      if (sort.column === "severity") {
        result = severityOrder[a.severity] - severityOrder[b.severity];
      }
      if (sort.column === "assignee") {
        result = a.assignedToName.localeCompare(b.assignedToName);
      }
      if (sort.column === "updated") {
        result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sort.direction === "asc" ? result : -result;
    });

    return sorted;
  }, [filteredRows, sort]);

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
          <div className="flex flex-wrap items-center gap-3">
            <Dropdown
              trigger={
                <div className="flex min-h-11 min-w-[240px] items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2 text-sm shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
                  <Building2 className="h-4 w-4 text-[color:var(--color-muted)]" />
                  <div className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Team Scope</span>
                    <span className="truncate font-medium text-[color:var(--color-foreground)]">
                      {selectedTeam ? selectedTeam.name : "No team available"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[color:var(--color-muted)]" />
                </div>
              }
            >
              {teamOptions.length === 0 ? (
                <DropdownItem disabled>No teams assigned</DropdownItem>
              ) : (
                teamOptions.map((team) => (
                  <DropdownItem
                    key={team.teamId}
                    selected={team.teamId === selectedTeamId}
                    onClick={() => onSelectTeam(team.teamId)}
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center">
                      {team.teamId === selectedTeamId ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span>{team.name}</span>
                    <span className="ml-auto text-xs text-[color:var(--color-muted)]">#{team.teamId}</span>
                  </DropdownItem>
                ))
              )}
            </Dropdown>
            {selectedTeam ? <Badge variant="default">Team ID {selectedTeam.teamId}</Badge> : null}
          </div>

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
