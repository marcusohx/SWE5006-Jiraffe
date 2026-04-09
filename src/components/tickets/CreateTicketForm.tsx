"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SEVERITY_OPTIONS } from "@/lib/constants";
import { capitalizeName } from "@/lib/utils";
import type { IncidentSeverity } from "@/modules/incident/incident.model";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TeamOptionWithMembers, UserOption } from "@/types/domain";

export function CreateTicketForm({
  onSuccess,
  selectedTeamId,
}: {
  onSuccess: () => void;
  selectedTeamId: number | null;
}) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null);
  const [assignedTo, setAssignedTo] = useState<UserOption | null>(null);
  const [comment, setComment] = useState("");

  const [teams, setTeams] = useState<TeamOptionWithMembers[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTeams = async () => {
      setLoadingTeams(true);
      try {
        const response = await fetch("/api/teams", { method: "GET" });
        const payload = (await response.json()) as ApiSuccess<TeamOptionWithMembers[]> | ApiError;
        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Unable to load teams." : payload.error);
        }

        if (isMounted) {
          setTeams(payload.data);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Unable to load teams.");
        }
      } finally {
        if (isMounted) {
          setLoadingTeams(false);
        }
      }
    };

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  const users = useMemo(() => {
    if (selectedTeamId === null) {
      return [];
    }
    const team = teams.find((item) => item.teamId === selectedTeamId);
    if (!team) {
      return [];
    }

    const uniqueUsers = new Map<string, UserOption>();
    team.members.forEach((member) => {
      if (!uniqueUsers.has(member.userId)) {
        uniqueUsers.set(member.userId, {
          id: member.userId,
          name: member.name,
          email: member.email,
        });
      }
    });
    return Array.from(uniqueUsers.values()).sort((a, b) =>
      capitalizeName(a.name).localeCompare(capitalizeName(b.name))
    );
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (!assignedTo) {
      return;
    }
    if (!users.some((user) => user.id === assignedTo.id)) {
      setAssignedTo(null);
    }
  }, [users, assignedTo]);

  const canSubmit = useMemo(() => {
    return Boolean(
      title.trim() &&
        description.trim() &&
        severity &&
        assignedTo?.id &&
        selectedTeamId !== null &&
        session?.user?.id &&
        !isSubmitting
    );
  }, [title, description, severity, assignedTo, selectedTeamId, session?.user?.id, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !severity || !assignedTo?.id || !session?.user?.id) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          title: title.trim(),
          description: description.trim(),
          severity,
          assignedBy: session.user.id,
          assignedTo: assignedTo.id,
          status: "Open",
          comment: comment.trim() ? comment.trim() : null,
        }),
      });

      const payload = (await response.json()) as ApiSuccess<unknown> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to create ticket." : payload.error);
      }

      window.dispatchEvent(new CustomEvent("incident-inbox-refresh"));
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-xs uppercase text-muted">
        Title
        <Input
          className="mt-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Brief ticket title"
          required
        />
      </label>

      <label className="block text-xs uppercase text-muted">
        Description
        <Textarea
          className="mt-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the issue"
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted">Severity</p>
          <div className="mt-2">
            <Dropdown
              trigger={
                <div className="flex h-11 min-w-[180px] items-center rounded-xl border border-border bg-white px-4 text-sm text-foreground shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
                  {severity ?? "Select severity"}
                </div>
              }
            >
              {SEVERITY_OPTIONS.map((option) => (
                <DropdownItem
                  key={option}
                  selected={option === severity}
                  onClick={() => setSeverity(option)}
                >
                  {option}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-muted">Assign To</p>
          <div className="mt-2">
            <Dropdown
              trigger={
                <div className="flex h-11 min-w-[220px] items-center rounded-xl border border-border bg-white px-4 text-sm text-foreground shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
                  {assignedTo ? capitalizeName(assignedTo.name) : "Select assignee"}
                </div>
              }
            >
              {selectedTeamId === null ? (
                <DropdownItem disabled>Select a team from Ticket Pipeline first</DropdownItem>
              ) : loadingTeams ? (
                <DropdownItem disabled>Loading team members...</DropdownItem>
              ) : users.length === 0 ? (
                <DropdownItem disabled>No members found in this team</DropdownItem>
              ) : (
                users.map((user) => (
                  <DropdownItem
                    key={user.id}
                    selected={user.id === assignedTo?.id}
                    onClick={() => setAssignedTo(user)}
                  >
                    {capitalizeName(user.name)}
                  </DropdownItem>
                ))
              )}
            </Dropdown>
          </div>
        </div>
      </div>

      <label className="block text-xs uppercase text-muted">
        Comment (Optional)
        <Textarea
          className="mt-2 min-h-[90px]"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Additional context"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}
