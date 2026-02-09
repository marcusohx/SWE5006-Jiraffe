import { handleApiError } from "@/lib/api-error";
import { parseUpdateUser, parseUserId } from "@/modules/user/user.dto";
import {
  deleteUserByIdController,
  getUserByIdController,
  updateUserByIdController,
} from "@/modules/user/user.controller";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseUserId(id);
    return await getUserByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseUserId(id);
    const body = await request.json();
    const input = parseUpdateUser(body);
    return await updateUserByIdController(parsedId, input);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsedId = parseUserId(id);
    return await deleteUserByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}
