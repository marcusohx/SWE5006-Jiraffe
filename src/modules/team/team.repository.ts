import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongodb";
import { capitalizeName } from "@/lib/utils";
import type {
  CreateTeamRepositoryInput,
  TeamMember,
  TeamWithMembers,
  UpdateTeamRepositoryInput,
} from "@/modules/team/team.model";
import {
  CounterModel,
  TeamModel,
  UserTeamModel,
  type TeamDocument,
  type UserTeamDocument,
} from "@/modules/team/team.model";
import "@/modules/user/user.model";

function mapTeam(doc: TeamDocument, members: TeamMember[]): TeamWithMembers {
  return {
    id: doc._id.toString(),
    teamId: doc.team_id,
    name: doc.team_name,
    description: doc.description ?? null,
    isActive: doc.is_active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    members,
  };
}

function mapMember(doc: UserTeamDocument): TeamMember {
  const rawUser = doc.user_id as unknown as Record<string, any> | null;
  return {
    userId: rawUser?._id?.toString() ?? "",
    name: capitalizeName(rawUser?.name ?? "Unknown"),
    email: rawUser?.email ?? "",
    role: doc.role ?? "member",
  };
}

async function listTeamMembers(teamIds: number[]): Promise<Map<number, TeamMember[]>> {
  if (teamIds.length === 0) {
    return new Map();
  }

  const docs = await UserTeamModel.find({ team_id: { $in: teamIds } }).populate({
    path: "user_id",
    select: "name email",
  });

  const map = new Map<number, TeamMember[]>();
  docs.forEach((doc) => {
    const teamId = doc.team_id;
    const members = map.get(teamId) ?? [];
    members.push(mapMember(doc));
    map.set(teamId, members);
  });

  return map;
}

async function getNextTeamId(): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { name: "team_id" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (!counter) {
    throw new Error("Failed to allocate team id");
  }

  if (counter.seq <= 1) {
    const maxTeam = await TeamModel.findOne().sort({ team_id: -1 }).select("team_id");
    const maxTeamId = maxTeam?.team_id ?? 0;
    if (maxTeamId >= counter.seq) {
      const bumped = await CounterModel.findOneAndUpdate(
        { name: "team_id" },
        { $set: { seq: maxTeamId + 1 } },
        { new: true }
      );
      if (bumped) {
        return bumped.seq;
      }
    }
  }

  return counter.seq;
}

async function addMembersToTeam(teamId: number, memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) {
    return;
  }

  const docs = memberIds.map((userId) => ({
    team_id: teamId,
    user_id: new mongoose.Types.ObjectId(userId),
    role: "member",
  }));

  try {
    await UserTeamModel.insertMany(docs, { ordered: false });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      return;
    }
    throw error;
  }
}

async function setTeamMembers(teamId: number, memberIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(memberIds));
  const existing = await UserTeamModel.find({ team_id: teamId });
  const existingIds = new Set(existing.map((doc) => doc.user_id.toString()));

  const toAdd = uniqueIds.filter((id) => !existingIds.has(id));
  const toRemove = existing.filter((doc) => !uniqueIds.includes(doc.user_id.toString()));

  if (toRemove.length > 0) {
    await UserTeamModel.deleteMany({ _id: { $in: toRemove.map((doc) => doc._id) } });
  }

  await addMembersToTeam(teamId, toAdd);
}

export async function listTeams(): Promise<TeamWithMembers[]> {
  await connectMongo();
  const teams = await TeamModel.find().sort({ createdAt: -1 });
  const teamIds = teams.map((team) => team.team_id);
  const memberMap = await listTeamMembers(teamIds);
  return teams.map((team) => mapTeam(team, memberMap.get(team.team_id) ?? []));
}

export async function createTeam(
  data: CreateTeamRepositoryInput
): Promise<TeamWithMembers> {
  await connectMongo();

  let created: TeamDocument | null = null;
  let teamId = 0;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    teamId = await getNextTeamId();
    try {
      created = await TeamModel.create({
        team_id: teamId,
        team_name: data.name,
        description: data.description ?? null,
        is_active: data.isActive ?? true,
      });
      break;
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 11000 && attempt < 2) {
        continue;
      }
      throw error;
    }
  }

  if (!created) {
    throw new Error("Failed to create team");
  }

  await addMembersToTeam(teamId, data.memberIds);

  const memberMap = await listTeamMembers([teamId]);
  return mapTeam(created, memberMap.get(teamId) ?? []);
}

export async function findTeamById(id: string): Promise<TeamWithMembers | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const team = await TeamModel.findById(id);
  if (!team) {
    return null;
  }
  const memberMap = await listTeamMembers([team.team_id]);
  return mapTeam(team, memberMap.get(team.team_id) ?? []);
}

export async function updateTeamById(
  id: string,
  updates: UpdateTeamRepositoryInput
): Promise<TeamWithMembers | null> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const mongoUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) mongoUpdates.team_name = updates.name;
  if (updates.description !== undefined) mongoUpdates.description = updates.description;
  if (updates.isActive !== undefined) mongoUpdates.is_active = updates.isActive;

  const updated = await TeamModel.findByIdAndUpdate(
    id,
    { $set: mongoUpdates },
    { new: true }
  );

  if (!updated) {
    return null;
  }

  if (updates.memberIds !== undefined) {
    await setTeamMembers(updated.team_id, updates.memberIds);
  }

  const memberMap = await listTeamMembers([updated.team_id]);
  return mapTeam(updated, memberMap.get(updated.team_id) ?? []);
}

export async function softDeleteTeamById(id: string): Promise<boolean> {
  await connectMongo();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const updated = await TeamModel.findByIdAndUpdate(
    id,
    { $set: { is_active: false } },
    { new: true }
  );

  return Boolean(updated);
}
