import { getServerSession } from "next-auth";
import { requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseCreateIncident } from "@/modules/incident/incident.dto";
import {
  createIncidentController,
  listIncidentsController,
} from "@/modules/incident/incident.controller";

export async function GET() {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    return await listIncidentsController(user.id, user.role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const body = await request.json();
    const input = parseCreateIncident(body);
    return await createIncidentController(input, user.id, user.name ?? "Unknown");
  } catch (error) {
    return handleApiError(error);
  }
}
