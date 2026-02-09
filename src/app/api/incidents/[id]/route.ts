import { handleApiError } from "@/lib/api-error";
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
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    const body = await request.json();
    const input = parseUpdateIncident(body);
    return await updateIncidentByIdController(parsedId, input);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseIncidentId(id);
    return await deleteIncidentByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}
