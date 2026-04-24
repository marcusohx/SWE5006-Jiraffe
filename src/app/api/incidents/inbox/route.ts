import { getServerSession } from "next-auth";
import { handleApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth.options";
import { listIncidentInboxController } from "@/modules/incident/incident.controller";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    return await listIncidentInboxController(session.user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
