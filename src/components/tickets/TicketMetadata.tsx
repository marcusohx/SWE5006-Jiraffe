"use client";

import { useEffect, useMemo, useState } from "react";
import { IncidentAcknowledgeButton } from "@/components/tickets/IncidentAcknowledgeButton";
import { IncidentCloseButton } from "@/components/tickets/IncidentCloseButton";
import { IncidentReassignControl } from "@/components/tickets/IncidentReassignControl";
import { SlaStatusBadge } from "@/components/tickets/SlaStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { SEVERITY_OPTIONS, STATUS_OPTIONS, severityVariant, statusVariant } from "@/lib/constants";
import { capitalizeName, formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TeamOptionWithMembers, UserOption } from "@/types/domain";

type FieldName = "status" | "severity" | "assignedTo" | "assignedBy";
type IncidentUpdates = Partial<{
  status: IncidentStatus;
  severity: IncidentSeverity;
  assignedTo: string;
  assignedBy: string;
}>;

async function fetchTeams(signal: AbortSignal): Promise<TeamOptionWithMembers[]> {
  const response = await fetch("/api/teams", { method: "GET", signal });
  const payload = (await response.json()) as ApiSuccess<TeamOptionWithMembers[]> | ApiError;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Unable to load teams." : payload.error);
  }
  return payload.data;
}

async function updateIncidentRequest(incidentId: string, updates: IncidentUpdates): Promise<void> {
  const response = await fetch(`/api/incidents/${incidentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const payload = (await response.json()) as ApiSuccess<unknown> | ApiError;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Unable to update ticket metadata." : payload.error);
  }
}

function buildTeamUsers(teams: TeamOptionWithMembers[], teamId: number | null | undefined): UserOption[] {
  if (!teamId) return [];
  const team = teams.find((t) => t.teamId === teamId);
  if (!team) return [];

  const unique = new Map<string, UserOption>();
  team.members.forEach((member) => {
    if (!unique.has(member.userId)) {
      unique.set(member.userId, { id: member.userId, name: member.name, email: member.email });
    }
  });

  return Array.from(unique.values()).sort((a, b) =>
    capitalizeName(a.name).localeCompare(capitalizeName(b.name))
  );
}

function useTeams() {
  const [teams, setTeams] = useState<TeamOptionWithMembers[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchTeams(controller.signal)
      .then(setTeams)
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingUsers(false);
      });
    return () => controller.abort();
  }, []);

  return { teams, loadingUsers, error, setError };
}

type OptimisticArgs = {
  field: FieldName;
  apply: () => void;
  rollback: () => void;
  updates: IncidentUpdates;
  errorMsg: string;
};

function useOptimisticIncidentUpdate(incidentId: string, onError: (msg: string) => void) {
  const [updatingField, setUpdatingField] = useState<FieldName | null>(null);

  const run = async ({ field, apply, rollback, updates, errorMsg }: OptimisticArgs) => {
    if (updatingField) return;
    setUpdatingField(field);
    apply();
    try {
      await updateIncidentRequest(incidentId, updates);
    } catch (e: unknown) {
      rollback();
      onError(e instanceof Error ? e.message : errorMsg);
    } finally {
      setUpdatingField(null);
    }
  };

  return { updatingField, run };
}

function useStatusField(incident: IncidentWithNames, run: (args: OptimisticArgs) => void) {
  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const [closedOn, setClosedOn] = useState<string | null>(
    incident.closedOn ? new Date(incident.closedOn).toISOString() : null
  );

  const onStatusChange = (nextStatus: IncidentStatus) => {
    if (nextStatus === status) return;
    const prevStatus = status;
    const prevClosedOn = closedOn;
    const nextClosedOn = nextStatus === "Closed" ? new Date().toISOString() : null;
    run({
      field: "status",
      apply: () => {
        setStatus(nextStatus);
        setClosedOn(nextClosedOn);
      },
      rollback: () => {
        setStatus(prevStatus);
        setClosedOn(prevClosedOn);
      },
      updates: { status: nextStatus },
      errorMsg: "Unable to update status.",
    });
  };

  return { status, closedOn, onStatusChange };
}

function useSeverityField(incident: IncidentWithNames, run: (args: OptimisticArgs) => void) {
  const [severity, setSeverity] = useState<IncidentSeverity>(incident.severity);

  const onSeverityChange = (nextSeverity: IncidentSeverity) => {
    if (nextSeverity === severity) return;
    const prevSeverity = severity;
    run({
      field: "severity",
      apply: () => setSeverity(nextSeverity),
      rollback: () => setSeverity(prevSeverity),
      updates: { severity: nextSeverity },
      errorMsg: "Unable to update severity.",
    });
  };

  return { severity, onSeverityChange };
}

function useUserAssignment(
  field: "assignedTo" | "assignedBy",
  initialId: string,
  initialName: string,
  errorMsg: string,
  users: UserOption[],
  run: (args: OptimisticArgs) => void
) {
  const [userId, setUserId] = useState(initialId);
  const [userName, setUserName] = useState(initialName);

  const onChange = (nextUserId: string) => {
    if (nextUserId === userId) return;
    const user = users.find((u) => u.id === nextUserId);
    if (!user) return;
    const prevId = userId;
    const prevName = userName;
    const nextName = capitalizeName(user.name);
    run({
      field,
      apply: () => {
        setUserId(user.id);
        setUserName(nextName);
      },
      rollback: () => {
        setUserId(prevId);
        setUserName(prevName);
      },
      updates: { [field]: user.id },
      errorMsg,
    });
  };

  return { userId, userName, onChange };
}

function useIncidentMetadata(incident: IncidentWithNames) {
  const { teams, loadingUsers, error: teamsError, setError: setTeamsError } = useTeams();
  const users = useMemo(() => buildTeamUsers(teams, incident.teamId), [teams, incident.teamId]);

  const onOperationError = (msg: string) => setTeamsError(msg);
  const { updatingField, run } = useOptimisticIncidentUpdate(incident.id, onOperationError);

  const { status, closedOn, onStatusChange } = useStatusField(incident, run);
  const { severity, onSeverityChange } = useSeverityField(incident, run);
  const assignee = useUserAssignment(
    "assignedTo",
    incident.assignedTo,
    incident.assignedToName,
    "Unable to update assignee.",
    users,
    run
  );
  const assignedBy = useUserAssignment(
    "assignedBy",
    incident.assignedBy,
    incident.assignedByName,
    "Unable to update assigned by.",
    users,
    run
  );

  return {
    status,
    severity,
    closedOn,
    assignedToId: assignee.userId,
    assignedToName: assignee.userName,
    assignedById: assignedBy.userId,
    assignedByName: assignedBy.userName,
    users,
    loadingUsers,
    error: teamsError,
    updatingField,
    onStatusChange,
    onSeverityChange,
    onAssigneeChange: assignee.onChange,
    onAssignedByChange: assignedBy.onChange,
  };
}

export function TicketMetadata({
  incident,
  currentUserId,
}: {
  incident: IncidentWithNames;
  currentUserId: string | null;
}) {
  const {
    status,
    severity,
    assignedToId,
    assignedById,
    assignedToName,
    assignedByName,
    closedOn,
    users,
    loadingUsers,
    error,
    updatingField,
    onStatusChange,
    onSeverityChange,
    onAssigneeChange,
    onAssignedByChange,
  } = useIncidentMetadata(incident);

  const canManageIncident = currentUserId === incident.assignedTo;

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
                disabled={Boolean(updatingField) || !canManageIncident}
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
                  disabled={Boolean(updatingField) || !canManageIncident}
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
                  disabled={Boolean(updatingField) || !canManageIncident}
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

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted">SLA</p>
              <p className="mt-1 text-sm font-medium">Current compliance state</p>
            </div>
            <SlaStatusBadge incident={incident} />
          </div>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>Started {formatDisplayDateTime(incident.sla.startedAt)}</p>
            <p>Response due {formatDisplayDateTime(incident.sla.responseDueAt)}</p>
            <p>Resolution due {formatDisplayDateTime(incident.sla.resolutionDueAt)}</p>
            {incident.sla.acknowledgedAt ? (
              <p>Acknowledged {formatDisplayDateTime(incident.sla.acknowledgedAt)}</p>
            ) : null}
          </div>
        </div>

        {canManageIncident && incident.status === "Open" ? (
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs uppercase text-muted">Action Required</p>
            <div className="flex flex-wrap gap-2">
              <IncidentAcknowledgeButton incidentId={incident.id} />
              <IncidentReassignControl
                incidentId={incident.id}
                currentAssigneeId={incident.assignedTo}
                users={users}
              />
            </div>
          </div>
        ) : null}

        {canManageIncident && incident.status === "In Progress" ? (
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs uppercase text-muted">Resolution</p>
            <div className="flex flex-wrap gap-2">
              <IncidentCloseButton incidentId={incident.id} />
              <IncidentReassignControl
                incidentId={incident.id}
                currentAssigneeId={incident.assignedTo}
                users={users}
              />
            </div>
          </div>
        ) : null}

        {!canManageIncident ? (
          <p className="text-xs text-muted">Only the assigned user can acknowledge, reassign, or close this ticket.</p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
