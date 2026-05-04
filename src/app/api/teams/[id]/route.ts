import { getServerSession } from "next-auth";
import { assertAdmin, requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseTeamId, parseUpdateTeam } from "@/modules/team/team.dto";
import {
  deleteTeamByIdController,
  getTeamByIdController,
  updateTeamByIdController,
} from "@/modules/team/team.controller";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const { id } = await params;
    const parsedId = parseTeamId(id);
    return await getTeamByIdController(parsedId, user.id, user.role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    assertAdmin(user);
    const { id } = await params;
    const parsedId = parseTeamId(id);
    const body = await request.json();
    const input = parseUpdateTeam(body);
    return await updateTeamByIdController(parsedId, input, user.role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    assertAdmin(user);
    const { id } = await params;
    const parsedId = parseTeamId(id);
    return await deleteTeamByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}
