"use client";

import { Filter, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus } from "@/modules/incident/incident.model";

export function TicketsTableControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onToggleStatus,
  severityFilter,
  onToggleSeverity,
  updatedFrom,
  onUpdatedFromChange,
  updatedTo,
  onUpdatedToChange,
  onClearAll,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: IncidentStatus[];
  onToggleStatus: (status: IncidentStatus) => void;
  severityFilter: IncidentSeverity[];
  onToggleSeverity: (severity: IncidentSeverity) => void;
  updatedFrom: string;
  onUpdatedFromChange: (value: string) => void;
  updatedTo: string;
  onUpdatedToChange: (value: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div className="relative flex w-full flex-wrap items-center gap-3 lg:w-auto" ref={panelRef}>
      <div className="relative w-full lg:w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search tickets"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <Button variant="secondary" size="sm" onClick={() => setOpen((prev) => !prev)}>
        <Filter className="h-4 w-4" />
        Advanced Filters
      </Button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-xl rounded-2xl border border-border bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)] lg:w-[520px]">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase text-muted">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onToggleStatus(option)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      statusFilter.includes(option)
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border bg-white text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted">Severity</p>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onToggleSeverity(option)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      severityFilter.includes(option)
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border bg-white text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted">Updated At</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted">
                  From
                  <Input
                    className="mt-1"
                    type="date"
                    value={updatedFrom}
                    onChange={(event) => onUpdatedFromChange(event.target.value)}
                  />
                </label>
                <label className="text-xs text-muted">
                  To
                  <Input
                    className="mt-1"
                    type="date"
                    value={updatedTo}
                    onChange={(event) => onUpdatedToChange(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClearAll}>
                Clear all
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
