"use client";

import { Bell, Loader2, Ticket, UserRoundX, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IncidentAcknowledgeButton } from "@/components/tickets/IncidentAcknowledgeButton";
import { IncidentReassignControl } from "@/components/tickets/IncidentReassignControl";
import { SlaStatusBadge } from "@/components/tickets/SlaStatusBadge";
import { Button } from "@/components/ui/button";
import { cn, formatDisplayDateTime, formatIncidentCode } from "@/lib/utils";
import type { ApiError, ApiSuccess } from "@/types/api";

type InboxItem = {
  id: string;
  incidentId: number;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Closed";
  assignedTo: string;
  assignedToName: string;
  teamId: number;
  sla: {
    responseDueAt: string;
    resolutionDueAt: string;
    acknowledgedAt: string | null;
    breachedResponse: boolean;
    breachedResolution: boolean;
  };
  availableAssignees: { id: string; name: string; email: string }[];
};

export function IncidentNotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInbox = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/incidents/inbox", { method: "GET", cache: "no-store" });
        const payload = (await response.json()) as ApiSuccess<InboxItem[]> | ApiError;
        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Unable to load notifications." : payload.error);
        }
        if (isMounted) {
          setItems(payload.data);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Unable to load notifications.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInbox();

    const onRefresh = () => {
      void loadInbox();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadInbox();
      }
    };

    const intervalId = window.setInterval(() => {
      void loadInbox();
    }, 15000);

    window.addEventListener("incident-inbox-refresh", onRefresh);
    window.addEventListener("focus", onRefresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("incident-inbox-refresh", onRefresh);
      window.removeEventListener("focus", onRefresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

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

  const removeIncident = (incidentId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== incidentId));
    router.refresh();
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="relative"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Incident notifications"
      >
        <Bell className="h-4 w-4" />
        {items.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {items.length}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] rounded-2xl border border-border bg-white p-4 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Notifications</p>
              <h3 className="mt-1 text-lg font-semibold">Assigned tickets</h3>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-muted transition hover:bg-surface-muted"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading assigned tickets...
            </div>
          ) : null}

          {!loading && error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

          {!loading && !error && items.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No unacknowledged assigned tickets.</p>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    item.sla.breachedResponse || item.sla.breachedResolution
                      ? "border-danger bg-danger-soft"
                      : "border-border bg-surface"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/tickets/${item.id}?returnTo=/tickets`}
                        className="flex items-center gap-2 font-semibold text-foreground"
                      >
                        <Ticket className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                      <p className="mt-1 text-xs text-muted">{formatIncidentCode(item.incidentId)}</p>
                    </div>
                    <SlaStatusBadge incident={item} />
                  </div>

                  <p className="mt-2 text-xs text-muted">
                    Response due {formatDisplayDateTime(item.sla.responseDueAt)}
                  </p>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <IncidentAcknowledgeButton
                      incidentId={item.id}
                      label="Accept"
                      onAcknowledged={() => removeIncident(item.id)}
                    />
                    <IncidentReassignControl
                      incidentId={item.id}
                      currentAssigneeId={item.assignedTo}
                      users={item.availableAssignees}
                      onReassigned={() => removeIncident(item.id)}
                      trigger={
                        <Button type="button" size="sm" variant="ghost" aria-label="Reassign ticket">
                          <UserRoundX className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
