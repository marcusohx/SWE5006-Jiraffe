"use client";

import { Loader2, UserRoundX } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { capitalizeName } from "@/lib/utils";
import type { ApiError, ApiSuccess } from "@/types/api";

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type IncidentResponse = { id: string };

export function IncidentReassignControl({
  incidentId,
  currentAssigneeId,
  users,
  trigger,
  onReassigned,
}: {
  incidentId: string;
  currentAssigneeId: string;
  users: UserOption[];
  trigger?: ReactNode;
  onReassigned?: () => void;
}) {
  const router = useRouter();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableUsers = useMemo(
    () => users.filter((user) => user.id !== currentAssigneeId),
    [users, currentAssigneeId]
  );

  const handleReassign = async (assignedTo: string) => {
    setLoadingUserId(assignedTo);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      });
      const payload = (await response.json()) as ApiSuccess<IncidentResponse> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to reassign ticket." : payload.error);
      }
      window.dispatchEvent(new CustomEvent("incident-inbox-refresh"));
      router.refresh();
      onReassigned?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reassign ticket.");
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-1">
      <Dropdown
        align="right"
        trigger={
          trigger ?? (
            <Button asChild size="sm" variant="ghost">
              <span className="inline-flex items-center gap-2">
                <UserRoundX className="h-4 w-4" />
                Reassign
              </span>
            </Button>
          )
        }
      >
        {availableUsers.length === 0 ? (
          <DropdownItem disabled>No teammate available</DropdownItem>
        ) : (
          availableUsers.map((user) => (
            <DropdownItem
              key={user.id}
              disabled={Boolean(loadingUserId)}
              onClick={() => handleReassign(user.id)}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="truncate">{capitalizeName(user.name)}</span>
                {loadingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </span>
            </DropdownItem>
          ))
        )}
      </Dropdown>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
