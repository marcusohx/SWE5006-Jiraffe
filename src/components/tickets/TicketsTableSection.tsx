"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveDataTable, type SortColumn, type SortState } from "@/components/data/InteractiveDataTable";
import { DeleteIncidentConfirmModal } from "@/components/tickets/DeleteIncidentConfirmModal";
import { TicketsTableControls } from "@/components/tickets/TicketsTableControls";
import { Badge } from "@/components/ui/badge";
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

function includesIgnoreCase(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export function TicketsTableSection({ initialRows }: { initialRows: IncidentWithNames[] }) {
  const router = useRouter();
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

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fromDate = updatedFrom ? new Date(`${updatedFrom}T00:00:00`) : null;
    const toDate = updatedTo ? new Date(`${updatedTo}T23:59:59.999`) : null;

    return rows.filter((incident) => {
      const updatedDate = new Date(incident.updatedAt);

      if (q) {
        const matchesSearch =
          includesIgnoreCase(incident.title, q) ||
          includesIgnoreCase(incident.incidentId, q) ||
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
  }, [rows, searchQuery, statusFilter, severityFilter, updatedFrom, updatedTo]);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Open {counts.open}</Badge>
          <Badge variant="info">In Progress {counts.inProgress}</Badge>
          <Badge variant="success">Closed {counts.closed}</Badge>
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
