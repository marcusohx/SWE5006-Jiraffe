import { getServerSession } from "next-auth";
import { requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
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
    const user = requireSessionUser(await getServerSession(authOptions));
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await getIncidentByIdController(parsedId, user.id, user.role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    const body = await request.json();
    const input = parseUpdateIncident(body);
    return await updateIncidentByIdController(parsedId, input, user.id, user.name ?? "Unknown", user.role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await deleteIncidentByIdController(parsedId, user.id, user.name ?? "Unknown", user.role);
  } catch (error) {
    return handleApiError(error);
  }
}
