"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { capitalizeName } from "@/lib/utils";
import type { IncidentSeverity } from "@/modules/incident/incident.model";

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string };

type UserOption = {
  id: string;
  name: string;
  email: string;
};

const SEVERITY_OPTIONS: IncidentSeverity[] = ["Critical", "High", "Medium", "Low"];

export function CreateTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null);
  const [assignedTo, setAssignedTo] = useState<UserOption | null>(null);
  const [comment, setComment] = useState("");

  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const canSubmit = useMemo(() => {
    return Boolean(
      title.trim() &&
        description.trim() &&
        severity &&
        assignedTo?.id &&
        session?.user?.id &&
        !isSubmitting
    );
  }, [title, description, severity, assignedTo, session?.user?.id, isSubmitting]);

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

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-xs uppercase text-[color:var(--color-muted)]">
        Title
        <Input
          className="mt-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Brief ticket title"
          required
        />
      </label>

      <label className="block text-xs uppercase text-[color:var(--color-muted)]">
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
          <p className="text-xs uppercase text-[color:var(--color-muted)]">Severity</p>
          <div className="mt-2">
            <Dropdown
              trigger={
                <div className="flex h-11 min-w-[180px] items-center rounded-xl border border-[color:var(--color-border)] bg-white px-4 text-sm text-[color:var(--color-foreground)] shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
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
          <p className="text-xs uppercase text-[color:var(--color-muted)]">Assign To</p>
          <div className="mt-2">
            <Dropdown
              trigger={
                <div className="flex h-11 min-w-[220px] items-center rounded-xl border border-[color:var(--color-border)] bg-white px-4 text-sm text-[color:var(--color-foreground)] shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
                  {assignedTo ? capitalizeName(assignedTo.name) : "Select assignee"}
                </div>
              }
            >
              {loadingUsers ? (
                <DropdownItem disabled>Loading users...</DropdownItem>
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

      <label className="block text-xs uppercase text-[color:var(--color-muted)]">
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
