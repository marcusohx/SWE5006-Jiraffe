import { handleApiError } from "@/lib/api-error";
import { parseTeamId, parseUpdateTeam } from "@/modules/team/team.dto";
import {
  deleteTeamByIdController,
  getTeamByIdController,
  updateTeamByIdController,
} from "@/modules/team/team.controller";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseTeamId(id);
    return await getTeamByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseTeamId(id);
    const body = await request.json();
    const input = parseUpdateTeam(body);
    return await updateTeamByIdController(parsedId, input);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseTeamId(id);
    return await deleteTeamByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}
