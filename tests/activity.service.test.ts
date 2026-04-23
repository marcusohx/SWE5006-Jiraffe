import { beforeEach, describe, expect, it, vi } from "vitest";
import { listRecentActivities, logActivity } from "@/modules/activity/activity.service";
import { createActivity, listActivities } from "@/modules/activity/activity.repository";

vi.mock("@/modules/activity/activity.repository", () => ({
  createActivity: vi.fn(),
  listActivities: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

function makeActivity(overrides = {}) {
  return {
    id: "act-1",
    actorId: "user-1",
    actorName: "Alice",
    activityType: "incident_created" as const,
    entityType: "incident" as const,
    entityId: "inc-1",
    entityLabel: "INC-001",
    teamId: 1,
    description: "Created an incident",
    metadata: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeInput() {
  return {
    actorId: "user-1",
    actorName: "Alice",
    activityType: "incident_created" as const,
    entityType: "incident" as const,
    entityId: "inc-1",
    entityLabel: "INC-001",
    teamId: 1,
    description: "Created an incident",
  };
}

describe("activity.service — logActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls createActivity with the provided input", async () => {
    vi.mocked(createActivity).mockResolvedValue(makeActivity());

    await logActivity(makeInput());

    expect(createActivity).toHaveBeenCalledWith(makeInput());
  });

  it("does not throw when createActivity fails", async () => {
    vi.mocked(createActivity).mockRejectedValue(new Error("DB error"));

    await expect(logActivity(makeInput())).resolves.toBeUndefined();
  });

  it("logs a warning when createActivity fails", async () => {
    const { logger } = await import("@/lib/logger");
    vi.mocked(createActivity).mockRejectedValue(new Error("connection timeout"));

    await logActivity(makeInput());

    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to log activity",
      expect.objectContaining({
        activityType: "incident_created",
        entityId: "inc-1",
        error: "connection timeout",
      })
    );
  });

  it("handles non-Error exceptions gracefully", async () => {
    vi.mocked(createActivity).mockRejectedValue("string error");

    await expect(logActivity(makeInput())).resolves.toBeUndefined();
  });
});

describe("activity.service — listRecentActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns activities from repository", async () => {
    const activities = [makeActivity(), makeActivity({ id: "act-2", entityId: "inc-2" })];
    vi.mocked(listActivities).mockResolvedValue(activities);

    const result = await listRecentActivities([1, 2], 5);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("act-1");
  });

  it("passes teamIds and limit to the repository", async () => {
    vi.mocked(listActivities).mockResolvedValue([]);

    await listRecentActivities([3, 4], 10);

    expect(listActivities).toHaveBeenCalledWith([3, 4], 10);
  });

  it("uses default limit of 20 when not specified", async () => {
    vi.mocked(listActivities).mockResolvedValue([]);

    await listRecentActivities([1]);

    expect(listActivities).toHaveBeenCalledWith([1], 20);
  });

  it("returns empty array when repository returns none", async () => {
    vi.mocked(listActivities).mockResolvedValue([]);

    const result = await listRecentActivities([99]);

    expect(result).toEqual([]);
  });
});
