import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongodb";
import type { CreateTeamInput, UpdateTeamInput } from "@/modules/team/team.dto";
import type { TeamWithMembers } from "@/modules/team/team.model";
import {
  createTeam as createTeamRepo,
  findTeamById,
  listTeams as listTeamsRepo,
  softDeleteTeamById,
  updateTeamById as updateTeamByIdRepo,
} from "@/modules/team/team.repository";
import { UserModel } from "@/modules/user/user.model";

function normalizeMemberIds(memberIds: string[]): string[] {
  return Array.from(new Set(memberIds));
}

async function ensureUsersExist(memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) {
    return;
  }

  const invalid = memberIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid.length > 0) {
    throw new Error("Invalid user id");
  }

  await connectMongo();
  const count = await UserModel.countDocuments({ _id: { $in: memberIds } });
  if (count !== memberIds.length) {
    throw new Error("One or more users not found");
  }
}

export async function listTeams(userId: string): Promise<TeamWithMembers[]> {
  return listTeamsRepo(userId);
}

export async function getTeamById(id: string): Promise<TeamWithMembers> {
  const team = await findTeamById(id);
  if (!team) {
    throw new Error("Team not found");
  }
  return team;
}

export async function createTeam(input: CreateTeamInput): Promise<TeamWithMembers> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Team name is required");
  }
  const description = input.description?.trim() ? input.description.trim() : null;
  const memberIds = normalizeMemberIds(input.memberIds ?? []);
  const isActive = input.isActive ?? true;

  await ensureUsersExist(memberIds);

  return createTeamRepo({
    name,
    description,
    memberIds,
    isActive,
  });
}

export async function updateTeamById(
  id: string,
  input: UpdateTeamInput
): Promise<TeamWithMembers> {
  if (Object.keys(input).length === 0) {
    throw new Error("No updates provided");
  }

  const updates: {
    name?: string;
    description?: string | null;
    memberIds?: string[];
    isActive?: boolean;
  } = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) {
      throw new Error("Team name is required");
    }
    updates.name = trimmed;
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() ? input.description.trim() : null;
  }

  if (input.memberIds !== undefined) {
    const memberIds = normalizeMemberIds(input.memberIds);
    await ensureUsersExist(memberIds);
    updates.memberIds = memberIds;
  }

  if (input.isActive !== undefined) {
    updates.isActive = input.isActive;
  }

  const team = await updateTeamByIdRepo(id, updates);
  if (!team) {
    throw new Error("Team not found");
  }

  return team;
}

export async function deleteTeamById(id: string): Promise<void> {
  const deleted = await softDeleteTeamById(id);
  if (!deleted) {
    throw new Error("Team not found");
  }
}
