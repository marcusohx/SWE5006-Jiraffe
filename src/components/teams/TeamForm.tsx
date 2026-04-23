"use client";

import { Loader2, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { capitalizeName } from "@/lib/utils";
import type { ApiError, ApiSuccess } from "@/types/api";

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type TeamPayload = {
  name: string;
  description: string | null;
  memberIds: string[];
  isActive: boolean;
};

function useLoadUsers() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
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
          setLoadError(e instanceof Error ? e.message : "Unable to load users.");
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { users, loadingUsers, loadError };
}

function UserDropdownContent({
  loadingUsers,
  availableUsers,
  onSelect,
}: {
  loadingUsers: boolean;
  availableUsers: UserOption[];
  onSelect: (user: UserOption) => void;
}) {
  if (loadingUsers) {
    return <DropdownItem disabled>Loading users...</DropdownItem>;
  }
  if (availableUsers.length === 0) {
    return <DropdownItem disabled>No available users</DropdownItem>;
  }
  return (
    <>
      {availableUsers.map((user) => (
        <DropdownItem key={user.id} onClick={() => onSelect(user)}>
          {capitalizeName(user.name)}
        </DropdownItem>
      ))}
    </>
  );
}

export function TeamForm({
  submitLabel,
  onSubmit,
  onSuccess,
  initialName,
  initialDescription,
  initialMembers,
  initialIsActive,
  showAutoIdNotice = false,
}: {
  submitLabel: string;
  onSubmit: (payload: TeamPayload) => Promise<void>;
  onSuccess?: () => void;
  initialName?: string;
  initialDescription?: string;
  initialMembers?: UserOption[];
  initialIsActive?: boolean;
  showAutoIdNotice?: boolean;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>(initialMembers ?? []);
  const [isActive, setIsActive] = useState(initialIsActive ?? true);

  const { users, loadingUsers, loadError } = useLoadUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialMemberKey = useMemo(() => {
    if (!initialMembers) {
      return null;
    }
    return initialMembers.map((member) => member.id).join("|");
  }, [initialMembers]);

  useEffect(() => {
    if (initialName === undefined && initialDescription === undefined && initialMemberKey === null) {
      return;
    }
    setName(initialName ?? "");
    setDescription(initialDescription ?? "");
    setSelectedUsers(initialMembers ?? []);
    if (initialIsActive !== undefined) {
      setIsActive(initialIsActive);
    }
  }, [initialName, initialDescription, initialMembers, initialMemberKey, initialIsActive]);

  const selectedIds = useMemo(() => new Set(selectedUsers.map((user) => user.id)), [selectedUsers]);

  const availableUsers = useMemo(() => {
    return users.filter((user) => !selectedIds.has(user.id));
  }, [users, selectedIds]);

  const canSubmit = useMemo(() => {
    return Boolean(name.trim() && !isSubmitting);
  }, [name, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        memberIds: selectedUsers.map((user) => user.id),
        isActive,
      });
      onSuccess?.();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unable to save team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-xs uppercase text-muted">
        Team Name
        <Input
          className="mt-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Team name"
          required
        />
      </label>

      <label className="block text-xs uppercase text-muted">
        Description
        <Textarea
          className="mt-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short description"
        />
      </label>

      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
        <div>
          <p className="text-xs uppercase text-muted">Status</p>
          <p className="text-sm font-medium">{isActive ? "Active" : "Inactive"}</p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase text-muted">Team Members</p>
          {showAutoIdNotice ? (
            <p className="text-xs text-muted">Team ID is auto-generated</p>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {selectedUsers.length === 0 ? (
            <span className="text-sm text-muted">No members selected</span>
          ) : null}
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs"
            >
              {capitalizeName(user.name)}
              <button
                type="button"
                onClick={() =>
                  setSelectedUsers((prev) => prev.filter((item) => item.id !== user.id))
                }
                className="rounded-full p-1 text-muted hover:bg-surface-muted"
                aria-label={`Remove ${user.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="mt-3">
          <Dropdown
            trigger={
              <div className="flex h-11 min-w-[220px] items-center rounded-xl border border-border bg-white px-4 text-sm text-foreground shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
                {availableUsers.length ? "Add member" : "No more users"}
              </div>
            }
          >
            <UserDropdownContent
              loadingUsers={loadingUsers}
              availableUsers={availableUsers}
              onSelect={(user) => setSelectedUsers((prev) => [...prev, user])}
            />
          </Dropdown>
        </div>
      </div>

      {(submitError || loadError) ? (
        <p className="text-sm text-red-600">{submitError ?? loadError}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
