import { getServerSession } from "next-auth";
import { requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseIncidentId } from "@/modules/incident/incident.dto";
import { acknowledgeIncidentController } from "@/modules/incident/incident.controller";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));

    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await acknowledgeIncidentController(
      parsedId,
      user.id,
      user.name ?? "Unknown",
      user.role
    );
  } catch (error) {
    return handleApiError(error);
  }
}
