import { getServerSession } from "next-auth";
import { requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseIncidentId, parseReassignIncident } from "@/modules/incident/incident.dto";
import { reassignIncidentController } from "@/modules/incident/incident.controller";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));

    const { id } = await params;
    const parsedId = parseIncidentId(id);
    const body = await request.json();
    const input = parseReassignIncident(body);

    return await reassignIncidentController(
      parsedId,
      input.assignedTo,
      user.id,
      user.name ?? "Unknown",
      user.role
    );
  } catch (error) {
    return handleApiError(error);
  }
}
