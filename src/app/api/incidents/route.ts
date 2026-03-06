import { getServerSession } from "next-auth";
import { handleApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth.options";
import { parseCreateIncident } from "@/modules/incident/incident.dto";
import {
  createIncidentController,
  listIncidentsController,
} from "@/modules/incident/incident.controller";

export async function GET() {
  try {
    return await listIncidentsController();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    const body = await request.json();
    const input = parseCreateIncident(body);
    return await createIncidentController(input, session.user.id, session.user.name ?? "Unknown");
  } catch (error) {
    return handleApiError(error);
  }
}
