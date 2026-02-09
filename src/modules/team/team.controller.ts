import { ok } from "@/lib/api-response";
import type { CreateTeamInput, UpdateTeamInput } from "@/modules/team/team.dto";
import {
  createTeam,
  deleteTeamById,
  getTeamById,
  listTeams,
  updateTeamById,
} from "@/modules/team/team.service";

export async function listTeamsController() {
  const teams = await listTeams();
  return ok(teams);
}

export async function createTeamController(input: CreateTeamInput) {
  const team = await createTeam(input);
  return ok(team, 201);
}

export async function getTeamByIdController(id: string) {
  const team = await getTeamById(id);
  return ok(team);
}

export async function updateTeamByIdController(id: string, input: UpdateTeamInput) {
  const team = await updateTeamById(id, input);
  return ok(team);
}

export async function deleteTeamByIdController(id: string) {
  await deleteTeamById(id);
  return ok({ deleted: true });
}