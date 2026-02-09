import { handleApiError } from "@/lib/api-error";
import { parseCreateTeam } from "@/modules/team/team.dto";
import { createTeamController, listTeamsController } from "@/modules/team/team.controller";

export async function GET() {
  try {
    return await listTeamsController();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseCreateTeam(body);
    return await createTeamController(input);
  } catch (error) {
    return handleApiError(error);
  }
}