"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";
import { IncidentDropPlaceholder } from "./IncidentDropPlaceholder";
import { SortableIncidentCard } from "./SortableIncidentCard";

type IncidentBoardColumnProps = {
  status: IncidentStatus;
  description: string;
  tickets: IncidentWithNames[];
  draggingId: string | null;
  totalCount?: number;
  previewTargetIndex?: number | null;
};

export function IncidentBoardColumn({
  status,
  description,
  tickets,
  draggingId,
  totalCount,
  previewTargetIndex,
}: IncidentBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "column", status },
  });

  const shouldShowPreview = draggingId !== null && previewTargetIndex !== null && previewTargetIndex !== undefined;
  const safePreviewIndex = Math.max(0, Math.min(previewTargetIndex ?? -1, tickets.length));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{status}</h2>
          <Badge variant="info">{totalCount ?? tickets.length}</Badge>
        </div>
        <p className="mt-2 text-xs text-[color:var(--color-muted)]">{description}</p>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-24 rounded-2xl border border-dashed border-transparent p-2 transition-colors",
          isOver && "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]/35"
        )}
      >
        <SortableContext items={tickets.map((ticket) => ticket.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tickets.map((ticket, index) => (
              <div key={ticket.id} className="space-y-3">
                {shouldShowPreview && safePreviewIndex === index ? <IncidentDropPlaceholder /> : null}
                <SortableIncidentCard ticket={ticket} />
              </div>
            ))}

            {shouldShowPreview && safePreviewIndex === tickets.length ? <IncidentDropPlaceholder /> : null}

            {tickets.length === 0 && draggingId && !shouldShowPreview ? (
              <div className="rounded-xl border border-dashed border-[color:var(--color-border)] p-4 text-xs text-[color:var(--color-muted)]">
                Drop ticket here
              </div>
            ) : null}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function IncidentDragOverlayCard({ ticket }: { ticket: IncidentWithNames }) {
  return <TicketCard ticket={ticket} className="opacity-85 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.6)]" />;
}
