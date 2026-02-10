import { computeBoardOrderForInsert } from "@/lib/board-order";
import type { IncidentStatus, IncidentWithNames } from "@/modules/incident/incident.model";

export const BOARD_COLUMNS: IncidentStatus[] = ["Open", "In Progress", "Closed"];

export type DropData = {
  type?: "column" | "ticket";
  status?: IncidentStatus;
};

export type DropTarget = {
  targetStatus: IncidentStatus;
  targetIndex: number;
};

export type MoveResult = {
  incidents: IncidentWithNames[];
  statusChanged: boolean;
  indexChanged: boolean;
  targetStatus: IncidentStatus;
  targetIndex: number;
};

function sortIncidentsByBoardOrder(a: IncidentWithNames, b: IncidentWithNames) {
  if (a.boardOrder !== b.boardOrder) {
    return a.boardOrder - b.boardOrder;
  }
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function groupByStatusSorted(incidents: IncidentWithNames[]): Record<IncidentStatus, IncidentWithNames[]> {
  const grouped: Record<IncidentStatus, IncidentWithNames[]> = {
    Open: [],
    "In Progress": [],
    Closed: [],
  };

  for (const incident of incidents) {
    grouped[incident.status].push(incident);
  }

  grouped.Open.sort(sortIncidentsByBoardOrder);
  grouped["In Progress"].sort(sortIncidentsByBoardOrder);
  grouped.Closed.sort(sortIncidentsByBoardOrder);

  return grouped;
}

function getStatusFromDrop(overId: string, overData: DropData | undefined, incidents: IncidentWithNames[]): IncidentStatus | null {
  if (overData?.status) {
    return overData.status;
  }

  const overIncident = incidents.find((incident) => incident.id === overId);
  return overIncident?.status ?? null;
}

function clampDeadZoneRatio(ratio: number) {
  if (ratio < 0) {
    return 0;
  }
  if (ratio > 0.9) {
    return 0.9;
  }
  return ratio;
}

function clampUnit(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function resolveDropTarget(input: {
  overId: string;
  overData?: DropData;
  incidents: IncidentWithNames[];
  activeId?: string;
  pointerY: number | null;
  overTop?: number;
  overHeight?: number;
  previousTarget?: DropTarget | null;
  deadZoneRatio?: number;
}): DropTarget | null {
  const {
    overId,
    overData,
    incidents,
    activeId,
    pointerY,
    overTop,
    overHeight,
    previousTarget,
    deadZoneRatio = 0.15,
  } = input;

  const targetStatus = getStatusFromDrop(overId, overData, incidents);
  if (!targetStatus) {
    return null;
  }

  const grouped = groupByStatusSorted(incidents);
  const targetTickets = grouped[targetStatus];

  if (overData?.type === "column") {
    // Exclude the dragged card — it is visually removed during drag,
    // so the column height corresponds to visibleCount cards.
    const visibleCount = activeId
      ? targetTickets.filter((t) => t.id !== activeId).length
      : targetTickets.length;

    if (pointerY !== null && overTop !== undefined && overHeight !== undefined && overHeight > 0) {
      const ratio = clampUnit((pointerY - overTop) / overHeight);
      const estimatedIndex = Math.round(ratio * visibleCount);
      return { targetStatus, targetIndex: estimatedIndex };
    }

    if (previousTarget?.targetStatus === targetStatus) {
      return { targetStatus, targetIndex: Math.max(0, Math.min(previousTarget.targetIndex, visibleCount)) };
    }
    return { targetStatus, targetIndex: visibleCount };
  }

  const hoveredIndex = targetTickets.findIndex((ticket) => ticket.id === overId);
  if (hoveredIndex === -1) {
    return { targetStatus, targetIndex: targetTickets.length };
  }

  if (pointerY === null || overTop === undefined || overHeight === undefined) {
    return { targetStatus, targetIndex: hoveredIndex };
  }

  const safeDeadZone = clampDeadZoneRatio(deadZoneRatio);
  const deadZoneHeight = overHeight * safeDeadZone;
  const midpoint = overTop + overHeight / 2;
  const upperBoundary = midpoint - deadZoneHeight / 2;
  const lowerBoundary = midpoint + deadZoneHeight / 2;

  if (pointerY < upperBoundary) {
    return { targetStatus, targetIndex: hoveredIndex };
  }

  if (pointerY > lowerBoundary) {
    return { targetStatus, targetIndex: hoveredIndex + 1 };
  }

  return { targetStatus, targetIndex: pointerY <= midpoint ? hoveredIndex : hoveredIndex + 1 };
}

function clampIndex(index: number, length: number): number {
  if (index < 0) {
    return 0;
  }
  if (index > length) {
    return length;
  }
  return index;
}

function findIndexById(rows: IncidentWithNames[], id: string): number {
  return rows.findIndex((row) => row.id === id);
}

export function computeNextBoardOrder(laneOrders: number[], targetIndex: number): number {
  return computeBoardOrderForInsert(laneOrders, targetIndex);
}

export function moveIncidentInMemory(input: {
  incidents: IncidentWithNames[];
  activeId: string;
  targetStatus: IncidentStatus;
  targetIndex: number;
}): MoveResult | null {
  const { incidents, activeId, targetStatus, targetIndex } = input;
  const groupedBefore = groupByStatusSorted(incidents);

  const activeIncident = incidents.find((incident) => incident.id === activeId);
  if (!activeIncident) {
    return null;
  }

  const sourceLane = groupedBefore[activeIncident.status];
  const sourceIndex = findIndexById(sourceLane, activeId);
  if (sourceIndex === -1) {
    return null;
  }

  const withoutActive = incidents.filter((incident) => incident.id !== activeId);
  const groupedWithoutActive = groupByStatusSorted(withoutActive);
  const targetLaneWithoutActive = groupedWithoutActive[targetStatus];

  const clampedTargetIndex = clampIndex(targetIndex, targetLaneWithoutActive.length);
  const nextBoardOrder = computeNextBoardOrder(
    targetLaneWithoutActive.map((incident) => incident.boardOrder),
    clampedTargetIndex
  );

  const movedIncident: IncidentWithNames = {
    ...activeIncident,
    status: targetStatus,
    boardOrder: nextBoardOrder,
  };

  const targetLane = [...targetLaneWithoutActive];
  targetLane.splice(clampedTargetIndex, 0, movedIncident);

  const groupedAfter: Record<IncidentStatus, IncidentWithNames[]> = {
    ...groupedWithoutActive,
    [targetStatus]: targetLane,
  };

  const finalIndex = findIndexById(groupedAfter[targetStatus], activeId);

  const statusChanged = targetStatus !== activeIncident.status;
  const indexChanged = statusChanged || finalIndex !== sourceIndex;

  const reorderedIncidents = BOARD_COLUMNS.flatMap((status) => groupedAfter[status]);

  return {
    incidents: reorderedIncidents,
    statusChanged,
    indexChanged,
    targetStatus,
    targetIndex: clampedTargetIndex,
  };
}
