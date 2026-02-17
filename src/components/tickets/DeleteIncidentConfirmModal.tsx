"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatIncidentCode } from "@/lib/utils";
import type { IncidentWithNames } from "@/modules/incident/incident.model";

export function DeleteIncidentConfirmModal({
  open,
  incident,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: {
  open: boolean;
  incident: IncidentWithNames | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Ticket">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Delete <span className="font-semibold text-foreground">{incident?.title}</span>? This
          action cannot be undone.
        </p>
        {incident ? (
          <p className="text-xs text-muted">Ticket ID: {formatIncidentCode(incident.incidentId)}</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={isDeleting || !incident}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
