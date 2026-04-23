"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { SEVERITY_OPTIONS, STATUS_OPTIONS, severityVariant, statusVariant } from "@/lib/constants";
import { capitalizeName, formatDisplayDate } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TeamOptionWithMembers, UserOption } from "@/types/domain";

function useIncidentMetadata(incident: IncidentWithNames) {
  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const [severity, setSeverity] = useState<IncidentSeverity>(incident.severity);
  const [assignedToId, setAssignedToId] = useState(incident.assignedTo);
  const [assignedById, setAssignedById] = useState(incident.assignedBy);
  const [assignedToName, setAssignedToName] = useState(incident.assignedToName);
  const [assignedByName, setAssignedByName] = useState(incident.assignedByName);
  const [closedOn, setClosedOn] = useState<string | null>(
    incident.closedOn ? new Date(incident.closedOn).toISOString() : null
  );
  const [teams, setTeams] = useState<TeamOptionWithMembers[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingField, setUpdatingField] = useState<
    "status" | "severity" | "assignedTo" | "assignedBy" | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeams() {
      setLoadingUsers(true);
      try {
        const response = await fetch("/api/teams", { method: "GET", signal: controller.signal });
        const payload = (await response.json()) as ApiSuccess<TeamOptionWithMembers[]> | ApiError;
        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Unable to load teams." : payload.error);
        }
        setTeams(payload.data);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        setLoadingUsers(false);
      }
    }

    loadTeams();
    return () => controller.abort();
  }, []);

  const users = useMemo(() => {
    const teamId = incident.teamId;
    if (!teamId) return [];
    const team = teams.find((t) => t.teamId === teamId);
    if (!team) return [];
    const uniqueUsers = new Map<string, UserOption>();
    team.members.forEach((member) => {
      if (!uniqueUsers.has(member.userId)) {
        uniqueUsers.set(member.userId, { id: member.userId, name: member.name, email: member.email });
      }
    });
    return Array.from(uniqueUsers.values()).sort((a, b) =>
      capitalizeName(a.name).localeCompare(capitalizeName(b.name))
    );
  }, [teams, incident.teamId]);

  const updateIncident = async (
    updates: Partial<{ status: IncidentStatus; severity: IncidentSeverity; assignedTo: string; assignedBy: string }>
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

  const applyOptimisticUpdate = async (
    field: "status" | "severity" | "assignedTo" | "assignedBy",
    applyFn: () => void,
    rollbackFn: () => void,
    apiUpdateFn: () => Promise<void>,
    errorMsg: string
  ) => {
    if (updatingField) return;
    setError(null);
    setUpdatingField(field);
    applyFn();
    try {
      await apiUpdateFn();
    } catch (e) {
      rollbackFn();
      setError(e instanceof Error ? e.message : errorMsg);
    } finally {
      setUpdatingField(null);
    }
  };

  const onStatusChange = (nextStatus: IncidentStatus) => {
    if (nextStatus === status) return;
    const prevStatus = status;
    const prevClosedOn = closedOn;
    applyOptimisticUpdate(
      "status",
      () => { setStatus(nextStatus); setClosedOn(nextStatus === "Closed" ? new Date().toISOString() : null); },
      () => { setStatus(prevStatus); setClosedOn(prevClosedOn); },
      () => updateIncident({ status: nextStatus }),
      "Unable to update status."
    );
  };

  const onSeverityChange = (nextSeverity: IncidentSeverity) => {
    if (nextSeverity === severity) return;
    const prevSeverity = severity;
    applyOptimisticUpdate(
      "severity",
      () => setSeverity(nextSeverity),
      () => setSeverity(prevSeverity),
      () => updateIncident({ severity: nextSeverity }),
      "Unable to update severity."
    );
  };

  const onAssigneeChange = (nextUserId: string) => {
    if (nextUserId === assignedToId) return;
    const user = users.find((u) => u.id === nextUserId);
    if (!user) return;
    const prevId = assignedToId;
    const prevName = assignedToName;
    applyOptimisticUpdate(
      "assignedTo",
      () => { setAssignedToId(user.id); setAssignedToName(capitalizeName(user.name)); },
      () => { setAssignedToId(prevId); setAssignedToName(prevName); },
      () => updateIncident({ assignedTo: user.id }),
      "Unable to update assignee."
    );
  };

  const onAssignedByChange = (nextUserId: string) => {
    if (nextUserId === assignedById) return;
    const user = users.find((u) => u.id === nextUserId);
    if (!user) return;
    const prevId = assignedById;
    const prevName = assignedByName;
    applyOptimisticUpdate(
      "assignedBy",
      () => { setAssignedById(user.id); setAssignedByName(capitalizeName(user.name)); },
      () => { setAssignedById(prevId); setAssignedByName(prevName); },
      () => updateIncident({ assignedBy: user.id }),
      "Unable to update assigned by."
    );
  };

  return {
    status, severity, assignedToId, assignedById,
    assignedToName, assignedByName, closedOn,
    users, loadingUsers, error, updatingField,
    onStatusChange, onSeverityChange, onAssigneeChange, onAssignedByChange,
  };
}

export function TicketMetadata({ incident }: { incident: IncidentWithNames }) {
  const {
    status, severity, assignedToId, assignedById,
    assignedToName, assignedByName, closedOn,
    users, loadingUsers, error, updatingField,
    onStatusChange, onSeverityChange, onAssigneeChange, onAssignedByChange,
  } = useIncidentMetadata(incident);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs uppercase text-muted">Status</p>
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
          <p className="text-xs uppercase text-muted">Severity</p>
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
          <p className="text-xs uppercase text-muted">Assignee</p>
          <Dropdown
            trigger={
              <div className="flex h-9 min-w-[180px] items-center rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground">
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
          <p className="text-xs uppercase text-muted">Assigned By</p>
          <Dropdown
            trigger={
              <div className="flex h-9 min-w-[180px] items-center rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground">
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
            <p className="text-xs uppercase text-muted">Closed On</p>
            <p className="text-sm font-medium">{formatDisplayDate(closedOn)}</p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
