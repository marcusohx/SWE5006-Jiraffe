import { getServerSession } from "next-auth";
import { requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseCreateTeam } from "@/modules/team/team.dto";
import { createTeamController, listTeamsController } from "@/modules/team/team.controller";

export async function GET() {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    return await listTeamsController(user.id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const body = await request.json();
    const input = parseCreateTeam(body);
    return await createTeamController(input, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
