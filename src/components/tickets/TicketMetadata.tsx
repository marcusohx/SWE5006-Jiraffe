"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { capitalizeName } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string };
type UserOption = { id: string; name: string; email: string };

const STATUS_OPTIONS: IncidentStatus[] = ["Open", "In Progress", "Closed"];
const SEVERITY_OPTIONS: IncidentSeverity[] = ["Critical", "High", "Medium", "Low"];

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

export function TicketMetadata({ incident }: { incident: IncidentWithNames }) {
  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const [severity, setSeverity] = useState<IncidentSeverity>(incident.severity);
  const [assignedToId, setAssignedToId] = useState(incident.assignedTo);
  const [assignedById, setAssignedById] = useState(incident.assignedBy);
  const [assignedToName, setAssignedToName] = useState(incident.assignedToName);
  const [assignedByName, setAssignedByName] = useState(incident.assignedByName);
  const [closedOn, setClosedOn] = useState<string | null>(
    incident.closedOn ? new Date(incident.closedOn).toISOString() : null
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingField, setUpdatingField] = useState<"status" | "severity" | "assignedTo" | "assignedBy" | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch("/api/users", { method: "GET" });
        const payload = (await response.json()) as ApiSuccess<UserOption[]> | ApiError;
        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Unable to load users." : payload.error);
        }
        if (isMounted) {
          setUsers(payload.data);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Unable to load users.");
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateIncident = async (
    updates: Partial<{
      status: IncidentStatus;
      severity: IncidentSeverity;
      assignedTo: string;
      assignedBy: string;
    }>
  ) => {
    const response = await fetch(`/api/incidents/${incident.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const payload = (await response.json()) as ApiSuccess<unknown> | ApiError;
    if (!response.ok || !payload.success) {
      throw new Error(payload.success ? "Unable to update ticket metadata." : payload.error);
    }
  };

  const onStatusChange = async (nextStatus: IncidentStatus) => {
    if (nextStatus === status || updatingField) {
      return;
    }

    const prevStatus = status;
    const prevClosedOn = closedOn;

    setError(null);
    setUpdatingField("status");
    setStatus(nextStatus);
    if (nextStatus === "Closed") {
      setClosedOn(new Date().toISOString());
    } else {
      setClosedOn(null);
    }

    try {
      await updateIncident({ status: nextStatus });
    } catch (e) {
      setStatus(prevStatus);
      setClosedOn(prevClosedOn);
      setError(e instanceof Error ? e.message : "Unable to update status.");
    } finally {
      setUpdatingField(null);
    }
  };

  const onSeverityChange = async (nextSeverity: IncidentSeverity) => {
    if (nextSeverity === severity || updatingField) {
      return;
    }

    const prevSeverity = severity;

    setError(null);
    setUpdatingField("severity");
    setSeverity(nextSeverity);

    try {
      await updateIncident({ severity: nextSeverity });
    } catch (e) {
      setSeverity(prevSeverity);
      setError(e instanceof Error ? e.message : "Unable to update severity.");
    } finally {
      setUpdatingField(null);
    }
  };

  const onAssigneeChange = async (nextUserId: string) => {
    if (nextUserId === assignedToId || updatingField) {
      return;
    }

    const user = users.find((u) => u.id === nextUserId);
    if (!user) {
      return;
    }

    const prevId = assignedToId;
    const prevName = assignedToName;

    setError(null);
    setUpdatingField("assignedTo");
    setAssignedToId(user.id);
    setAssignedToName(capitalizeName(user.name));

    try {
      await updateIncident({ assignedTo: user.id });
    } catch (e) {
      setAssignedToId(prevId);
      setAssignedToName(prevName);
      setError(e instanceof Error ? e.message : "Unable to update assignee.");
    } finally {
      setUpdatingField(null);
    }
  };

  const onAssignedByChange = async (nextUserId: string) => {
    if (nextUserId === assignedById || updatingField) {
      return;
    }

    const user = users.find((u) => u.id === nextUserId);
    if (!user) {
      return;
    }

    const prevId = assignedById;
    const prevName = assignedByName;

    setError(null);
    setUpdatingField("assignedBy");
    setAssignedById(user.id);
    setAssignedByName(capitalizeName(user.name));

    try {
      await updateIncident({ assignedBy: user.id });
    } catch (e) {
      setAssignedById(prevId);
      setAssignedByName(prevName);
      setError(e instanceof Error ? e.message : "Unable to update assigned by.");
    } finally {
      setUpdatingField(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs uppercase text-[color:var(--color-muted)]">Status</p>
          <Dropdown trigger={<Badge variant={statusVariant[status]}>{status}</Badge>}>
            {STATUS_OPTIONS.map((option) => (
              <DropdownItem
                key={option}
                selected={option === status}
                disabled={Boolean(updatingField)}
                onClick={() => onStatusChange(option)}
              >
                {option}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>

        <div>
          <p className="text-xs uppercase text-[color:var(--color-muted)]">Severity</p>
          <Dropdown trigger={<Badge variant={severityVariant[severity]}>{severity}</Badge>}>
            {SEVERITY_OPTIONS.map((option) => (
              <DropdownItem
                key={option}
                selected={option === severity}
                disabled={Boolean(updatingField)}
                onClick={() => onSeverityChange(option)}
              >
                {option}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>

        <div>
          <p className="text-xs uppercase text-[color:var(--color-muted)]">Assignee</p>
          <Dropdown
            trigger={
              <div className="flex h-9 min-w-[180px] items-center rounded-xl border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-foreground)]">
                {assignedToName}
              </div>
            }
          >
            {loadingUsers ? (
              <DropdownItem disabled>Loading users...</DropdownItem>
            ) : (
              users.map((user) => (
                <DropdownItem
                  key={user.id}
                  selected={user.id === assignedToId}
                  disabled={Boolean(updatingField)}
                  onClick={() => onAssigneeChange(user.id)}
                >
                  {capitalizeName(user.name)}
                </DropdownItem>
              ))
            )}
          </Dropdown>
        </div>
        <div>
          <p className="text-xs uppercase text-[color:var(--color-muted)]">Assigned By</p>
          <Dropdown
            trigger={
              <div className="flex h-9 min-w-[180px] items-center rounded-xl border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-foreground)]">
                {assignedByName}
              </div>
            }
          >
            {loadingUsers ? (
              <DropdownItem disabled>Loading users...</DropdownItem>
            ) : (
              users.map((user) => (
                <DropdownItem
                  key={user.id}
                  selected={user.id === assignedById}
                  disabled={Boolean(updatingField)}
                  onClick={() => onAssignedByChange(user.id)}
                >
                  {capitalizeName(user.name)}
                </DropdownItem>
              ))
            )}
          </Dropdown>
        </div>
        {closedOn ? (
          <div>
            <p className="text-xs uppercase text-[color:var(--color-muted)]">Closed On</p>
            <p className="text-sm font-medium">{new Date(closedOn).toLocaleDateString()}</p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
