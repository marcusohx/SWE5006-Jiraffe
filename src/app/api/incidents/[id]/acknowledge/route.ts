import { getServerSession } from "next-auth";
import { handleApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth.options";
import { parseIncidentId } from "@/modules/incident/incident.dto";
import { acknowledgeIncidentController } from "@/modules/incident/incident.controller";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await acknowledgeIncidentController(
      parsedId,
      session.user.id,
      session.user.name ?? "Unknown"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
