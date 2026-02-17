"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TicketCard } from "@/components/tickets/TicketCard";
import { cn } from "@/lib/utils";
import type { IncidentWithNames } from "@/modules/incident/incident.model";

export function SortableIncidentCard({ ticket }: { ticket: IncidentWithNames }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "ticket", status: ticket.status },
  });
  const detailHref = `/tickets/${ticket.id}?returnTo=%2Fboard`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: "none" }}
      className={cn("relative select-none", isDragging && "z-10")}
    >
      <Link
        href={detailHref}
        className={cn("block rounded-2xl", isDragging && "pointer-events-none")}
        aria-label={`Open ${ticket.title}`}
      >
        <TicketCard
          ticket={ticket}
          className={cn(
            "transition-[transform,box-shadow] duration-200",
            isDragging && "scale-[1.02] opacity-55 shadow-[0_26px_50px_-25px_rgba(15,23,42,0.6)]"
          )}
        />
      </Link>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-grab active:cursor-grabbing"
        aria-label="Drag ticket"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}
