"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import {
  type CollisionDetection,
  closestCenter,
  pointerWithin,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";
import type { ApiError, ApiSuccess } from "@/types/api";
import { IncidentBoardColumn, IncidentDragOverlayCard } from "./IncidentBoardColumn";
import {
  BOARD_COLUMNS,
  groupByStatusSorted,
  moveIncidentInMemory,
  resolveDropTarget,
  type DropData,
  type DropTarget,
} from "./board-dnd-utils";

type DragResult = {
  incidents: IncidentWithNames[];
  updates: { status?: IncidentStatus; boardOrder?: number };
};

function resolveFinalDragResult(
  snapshot: IncidentWithNames[],
  activeId: string,
  cachedTarget: DropTarget
): DragResult | null {
  const finalMove = moveIncidentInMemory({ incidents: snapshot, activeId, targetStatus: cachedTarget.targetStatus, targetIndex: cachedTarget.targetIndex });
  if (!finalMove) return null;

  const originalIncident = snapshot.find((i) => i.id === activeId);
  const finalIncident = finalMove.incidents.find((i) => i.id === activeId);
  if (!originalIncident || !finalIncident) return null;

  const statusChanged = finalIncident.status !== originalIncident.status;
  const orderChanged = finalIncident.boardOrder !== originalIncident.boardOrder;
  if (!statusChanged && !orderChanged) return null;

  const updates: { status?: IncidentStatus; boardOrder?: number } = {};
  if (statusChanged) updates.status = finalIncident.status;
  if (orderChanged) updates.boardOrder = finalIncident.boardOrder;

  return { incidents: finalMove.incidents, updates };
}

const columnDescriptions: Record<IncidentStatus, string> = {
  Open: "Triaged and awaiting assignment.",
  "In Progress": "Actively being worked on by the team.",
  Closed: "Resolved and communicated to stakeholders.",
};

function readActivatorPointerY(nativeEvent: Event): number | null {
  if (nativeEvent instanceof PointerEvent || nativeEvent instanceof MouseEvent) {
    return nativeEvent.clientY;
  }
  if (nativeEvent instanceof TouchEvent) {
    return nativeEvent.touches[0]?.clientY ?? nativeEvent.changedTouches[0]?.clientY ?? null;
  }
  return null;
}

function readLivePointerY(event: DragOverEvent | DragEndEvent, startPointerY: number | null): number | null {
  if (startPointerY !== null) {
    return startPointerY + event.delta.y;
  }

  const translated = event.active.rect.current.translated;
  if (translated) {
    return translated.top + translated.height / 2;
  }

  const initial = event.active.rect.current.initial;
  if (initial) {
    return initial.top + initial.height / 2;
  }

  return null;
}

export function IncidentBoard({ initialIncidents }: { initialIncidents: IncidentWithNames[] }) {
  const [incidents, setIncidents] = useState<IncidentWithNames[]>(initialIncidents);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<DropTarget | null>(null);

  const incidentsRef = useRef<IncidentWithNames[]>(initialIncidents);
  const dragSnapshotRef = useRef<IncidentWithNames[] | null>(null);
  const dragStartPointerYRef = useRef<number | null>(null);
  const lastPlacementKeyRef = useRef<string | null>(null);
  const lastDropTargetRef = useRef<DropTarget | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const collisionDetection: CollisionDetection = (args) => {
    const preferTickets = (collisions: ReturnType<CollisionDetection>) => {
      const filtered = collisions.filter((c) => c.id !== args.active.id);
      if (filtered.length === 0) return collisions;

      const tickets = filtered.filter((c) => {
        const container = args.droppableContainers.find((item) => item.id === c.id);
        return container?.data.current?.type === "ticket";
      });
      return tickets.length > 0 ? tickets : filtered;
    };

    // Phase 1: pointerWithin constrains to the column the pointer is inside,
    // solving empty-column drops where closestCenter picks distant tickets.
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
      return preferTickets(pointerHits);
    }

    // Phase 2: fallback to closestCenter when pointer is in a gap between cards.
    return preferTickets(closestCenter(args));
  };

  useEffect(() => {
    queueMicrotask(() => {
      setIncidents(initialIncidents);
      incidentsRef.current = initialIncidents;
    });
  }, [initialIncidents]);

  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  const grouped = useMemo(() => groupByStatusSorted(incidents), [incidents]);
  const visibleGrouped = useMemo(() => {
    if (!draggingId) {
      return grouped;
    }

    return {
      Open: grouped.Open.filter((incident) => incident.id !== draggingId),
      "In Progress": grouped["In Progress"].filter((incident) => incident.id !== draggingId),
      Closed: grouped.Closed.filter((incident) => incident.id !== draggingId),
    };
  }, [draggingId, grouped]);
  const draggingTicket = useMemo(
    () => incidents.find((incident) => incident.id === draggingId) ?? null,
    [draggingId, incidents]
  );

  const onDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setDraggingId(activeId);
    setError(null);
    setPreviewTarget(null);
    dragSnapshotRef.current = incidentsRef.current;
    dragStartPointerYRef.current = readActivatorPointerY(event.activatorEvent);
    lastPlacementKeyRef.current = null;
    lastDropTargetRef.current = null;
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }

    const overData = over.data.current as DropData | undefined;
    const dropTarget = resolveDropTarget({
      overId,
      overData,
      incidents: incidentsRef.current,
      activeId,
      pointerY: readLivePointerY(event, dragStartPointerYRef.current),
      overTop: over.rect.top,
      overHeight: over.rect.height,
      previousTarget: lastDropTargetRef.current,
      deadZoneRatio: 0.15,
    });

    if (!dropTarget) {
      return;
    }

    const placementKey = `${activeId}:${dropTarget.targetStatus}:${dropTarget.targetIndex}`;
    if (placementKey === lastPlacementKeyRef.current) {
      return;
    }

    lastPlacementKeyRef.current = placementKey;
    lastDropTargetRef.current = dropTarget;
    setPreviewTarget((prev) =>
      prev?.targetStatus === dropTarget.targetStatus && prev?.targetIndex === dropTarget.targetIndex ? prev : dropTarget
    );
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    const snapshot = dragSnapshotRef.current;
    const cachedTarget = lastDropTargetRef.current;

    setDraggingId(null);
    setPreviewTarget(null);
    dragStartPointerYRef.current = null;
    lastPlacementKeyRef.current = null;
    lastDropTargetRef.current = null;

    if (!snapshot) return;

    if (!over || !cachedTarget) {
      incidentsRef.current = snapshot;
      setIncidents(snapshot);
      dragSnapshotRef.current = null;
      return;
    }

    const dragResult = resolveFinalDragResult(snapshot, activeId, cachedTarget);
    const nextIncidents = dragResult ? dragResult.incidents : snapshot;
    incidentsRef.current = nextIncidents;
    setIncidents(nextIncidents);

    if (!dragResult) {
      dragSnapshotRef.current = null;
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/incidents/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dragResult.updates),
      });
      const payload = (await response.json()) as ApiSuccess<IncidentWithNames> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to update ticket order." : payload.error);
      }

      setIncidents((current) => current.map((incident) => (incident.id === activeId ? payload.data : incident)));
    } catch (e) {
      incidentsRef.current = snapshot;
      setIncidents(snapshot);
      setError(e instanceof Error ? e.message : "Unable to move ticket.");
    } finally {
      dragSnapshotRef.current = null;
    }
  };

  const onDragCancel = () => {
    const snapshot = dragSnapshotRef.current;
    setDraggingId(null);
    setPreviewTarget(null);
    dragStartPointerYRef.current = null;
    lastPlacementKeyRef.current = null;
    lastDropTargetRef.current = null;

    if (snapshot) {
      incidentsRef.current = snapshot;
      setIncidents(snapshot);
    }
    dragSnapshotRef.current = null;
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {BOARD_COLUMNS.map((status) => (
            <IncidentBoardColumn
              key={status}
              status={status}
              description={columnDescriptions[status]}
              tickets={visibleGrouped[status]}
              draggingId={draggingId}
              totalCount={grouped[status].length}
              previewTargetIndex={previewTarget?.targetStatus === status ? previewTarget.targetIndex : null}
            />
          ))}
        </div>

        <DragOverlay>{draggingTicket ? <IncidentDragOverlayCard ticket={draggingTicket} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
