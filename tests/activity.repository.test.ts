import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActivity, listActivities } from "@/modules/activity/activity.repository";

const {
  connectMongo,
  activityCreate,
  activityFind,
} = vi.hoisted(() => ({
  connectMongo: vi.fn(),
  activityCreate: vi.fn(),
  activityFind: vi.fn(),
}));

vi.mock("@/lib/db/mongodb", () => ({ connectMongo }));

vi.mock("@/modules/activity/activity.model", () => ({
  ActivityModel: {
    create: activityCreate,
    find: activityFind,
  },
}));

const FAKE_ID = "67dc66fd6f57fd4fce4d8548";

function makeActivityDoc(overrides = {}) {
  return {
    _id: { toString: () => FAKE_ID },
    actor_id: { toString: () => "actor-id-1" },
    actor_name: "Alice",
    activity_type: "incident_created",
    entity_type: "incident",
    entity_id: "inc-1",
    entity_label: "INC-001",
    team_id: 1,
    description: "Created an incident",
    metadata: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    toObject: () => ({
      _id: { toString: () => FAKE_ID },
      actor_id: { toString: () => "actor-id-1" },
      actor_name: "Alice",
      activity_type: "incident_created",
      entity_type: "incident",
      entity_id: "inc-1",
      entity_label: "INC-001",
      team_id: 1,
      description: "Created an incident",
      metadata: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }),
    ...overrides,
  };
}

function makeInput() {
  return {
    actorId: "actor-id-1",
    actorName: "Alice",
    activityType: "incident_created" as const,
    entityType: "incident" as const,
    entityId: "inc-1",
    entityLabel: "INC-001",
    teamId: 1,
    description: "Created an incident",
    metadata: null,
  };
}

describe("activity.repository — createActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("creates and returns a mapped activity", async () => {
    const doc = makeActivityDoc();
    activityCreate.mockResolvedValue(doc);

    const result = await createActivity(makeInput());

    expect(result.id).toBe(FAKE_ID);
    expect(result.actorId).toBe("actor-id-1");
    expect(result.actorName).toBe("Alice");
    expect(result.activityType).toBe("incident_created");
    expect(result.entityType).toBe("incident");
    expect(result.entityId).toBe("inc-1");
    expect(result.teamId).toBe(1);
    expect(result.description).toBe("Created an incident");
    expect(result.metadata).toBeNull();
  });

  it("passes correct fields to ActivityModel.create", async () => {
    const doc = makeActivityDoc();
    activityCreate.mockResolvedValue(doc);

    await createActivity(makeInput());

    expect(activityCreate).toHaveBeenCalledWith({
      actor_id: "actor-id-1",
      actor_name: "Alice",
      activity_type: "incident_created",
      entity_type: "incident",
      entity_id: "inc-1",
      entity_label: "INC-001",
      team_id: 1,
      description: "Created an incident",
      metadata: null,
    });
  });

  it("defaults metadata to null when not provided", async () => {
    const input = makeInput();
    const doc = makeActivityDoc();
    activityCreate.mockResolvedValue(doc);

    await createActivity(input);

    expect(activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: null })
    );
  });

  it("passes metadata when provided", async () => {
    const input = { ...makeInput(), metadata: { key: "value" } };
    const doc = makeActivityDoc();
    activityCreate.mockResolvedValue(doc);

    await createActivity(input);

    expect(activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { key: "value" } })
    );
  });
});

describe("activity.repository — listActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMongo.mockResolvedValue(undefined);
  });

  it("returns empty array when teamIds is empty", async () => {
    const result = await listActivities([], 10);

    expect(result).toEqual([]);
    expect(activityFind).not.toHaveBeenCalled();
  });

  it("returns mapped activities for given teamIds", async () => {
    const doc = {
      _id: { toString: () => FAKE_ID },
      actor_id: { toString: () => "actor-id-1" },
      actor_name: "Alice",
      activity_type: "incident_updated",
      entity_type: "incident",
      entity_id: "inc-2",
      entity_label: "INC-002",
      team_id: 2,
      description: "Updated an incident",
      metadata: null,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    };

    activityFind.mockReturnValue({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([doc]) }) }),
    });

    const result = await listActivities([2], 5);

    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe("inc-2");
    expect(result[0].teamId).toBe(2);
  });

  it("queries with correct team_id filter", async () => {
    activityFind.mockReturnValue({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
    });

    await listActivities([1, 3], 20);

    expect(activityFind).toHaveBeenCalledWith({ team_id: { $in: [1, 3] } });
  });

  it("respects the limit parameter", async () => {
    const limitMock = vi.fn().mockReturnValue({ lean: () => Promise.resolve([]) });
    activityFind.mockReturnValue({
      sort: () => ({ limit: limitMock }),
    });

    await listActivities([1], 7);

    expect(limitMock).toHaveBeenCalledWith(7);
  });
});
