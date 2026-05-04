import { ok } from "@/lib/api-response";
import type { CreateTeamInput, UpdateTeamInput } from "@/modules/team/team.dto";
import {
  createTeam,
  deleteTeamById,
  getTeamById,
  listTeams,
  updateTeamById,
} from "@/modules/team/team.service";

export async function listTeamsController(userId: string) {
  const teams = await listTeams(userId);
  return ok(teams);
}

export async function createTeamController(input: CreateTeamInput, userId: string) {
  const team = await createTeam(input, userId);
  return ok(team, 201);
}

export async function getTeamByIdController(id: string, userId: string, role: "user" | "admin") {
  const team = await getTeamById(id, userId, role);
  return ok(team);
}

export async function updateTeamByIdController(
  id: string,
  input: UpdateTeamInput,
  role: "user" | "admin"
) {
  const team = await updateTeamById(id, input, role);
  return ok(team);
}

export async function deleteTeamByIdController(id: string) {
  await deleteTeamById(id);
  return ok({ deleted: true });
}
