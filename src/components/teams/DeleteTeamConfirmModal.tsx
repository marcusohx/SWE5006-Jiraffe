"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { TeamWithMembers } from "@/modules/team/team.model";

export function DeleteTeamConfirmModal({
  open,
  team,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: {
  open: boolean;
  team: TeamWithMembers | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Team">
      <div className="space-y-4">
        <p className="text-sm text-[color:var(--color-muted)]">
          Delete <span className="font-semibold text-[color:var(--color-foreground)]">{team?.name}</span>? This
          action cannot be undone.
        </p>
        {team ? <p className="text-xs text-[color:var(--color-muted)]">Team ID: {team.teamId}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={isDeleting || !team}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
