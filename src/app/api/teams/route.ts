import { getServerSession } from "next-auth";
import { handleApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth.options";
import { parseCreateTeam } from "@/modules/team/team.dto";
import { createTeamController, listTeamsController } from "@/modules/team/team.controller";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    return await listTeamsController(session.user.id);
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
