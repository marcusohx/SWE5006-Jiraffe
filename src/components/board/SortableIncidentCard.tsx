"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketCard } from "@/components/tickets/TicketCard";
import { cn } from "@/lib/utils";
import type { IncidentWithNames } from "@/modules/incident/incident.model";

export function SortableIncidentCard({ ticket }: { ticket: IncidentWithNames }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "ticket", status: ticket.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: "none" }}
      className={cn("select-none", isDragging && "z-10")}
      {...attributes}
      {...listeners}
    >
      <TicketCard
        ticket={ticket}
        className={cn(
          "transition-[transform,box-shadow] duration-200",
          isDragging && "scale-[1.02] opacity-55 shadow-[0_26px_50px_-25px_rgba(15,23,42,0.6)]"
        )}
      />
    </div>
  );
}
