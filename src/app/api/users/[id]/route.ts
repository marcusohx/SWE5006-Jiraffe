import { handleApiError } from "@/lib/api-error";
import { parseUpdateUser, parseUserId } from "@/modules/user/user.dto";
import {
  deleteUserByIdController,
  getUserByIdController,
  updateUserByIdController,
} from "@/modules/user/user.controller";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const id = parseUserId(params.id);
    return await getUserByIdController(id);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const id = parseUserId(params.id);
    const body = await request.json();
    const input = parseUpdateUser(body);
    return await updateUserByIdController(id, input);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const id = parseUserId(params.id);
    return await deleteUserByIdController(id);
  } catch (error) {
    return handleApiError(error);
  }
}
