import { logger } from "@/lib/logger";
import type { Activity } from "@/modules/activity/activity.model";
import {
  createActivity,
  listActivities,
  type CreateActivityInput,
} from "@/modules/activity/activity.repository";

export type { CreateActivityInput } from "@/modules/activity/activity.repository";

export async function logActivity(input: CreateActivityInput): Promise<void> {
  try {
    await createActivity(input);
  } catch (error) {
    logger.warn("Failed to log activity", {
      activityType: input.activityType,
      entityId: input.entityId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function listRecentActivities(
  teamIds: number[],
  limit = 20
): Promise<Activity[]> {
  return listActivities(teamIds, limit);
}
