import { getServerSession } from "next-auth";
import { handleApiError } from "@/lib/api-error";
import { fail } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth.options";
import { parseIncidentId, parseUpdateIncident } from "@/modules/incident/incident.dto";
import {
  deleteIncidentByIdController,
  getIncidentByIdController,
  updateIncidentByIdController,
} from "@/modules/incident/incident.controller";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await getIncidentByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    const body = await request.json();
    const input = parseUpdateIncident(body);
    return await updateIncidentByIdController(parsedId, input, session.user.id, session.user.name ?? "Unknown");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await deleteIncidentByIdController(parsedId, session.user.id, session.user.name ?? "Unknown");
  } catch (error) {
    return handleApiError(error);
  }
}
