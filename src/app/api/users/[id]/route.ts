import { getServerSession } from "next-auth";
import { assertAdmin, assertSelfOrAdmin, requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseUpdateUser, parseUserId } from "@/modules/user/user.dto";
import {
  deleteUserByIdController,
  getUserByIdController,
  updateUserByIdController,
} from "@/modules/user/user.controller";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const { id } = await params;
    const parsedId = parseUserId(id);
    assertSelfOrAdmin(user, parsedId);
    return await getUserByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    const { id } = await params;
    const parsedId = parseUserId(id);
    assertSelfOrAdmin(user, parsedId);
    const body = await request.json();
    const input = parseUpdateUser(body);
    return await updateUserByIdController(parsedId, input, {
      id: user.id,
      role: user.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    assertAdmin(user);
    const { id } = await params;
    const parsedId = parseUserId(id);
    return await deleteUserByIdController(parsedId);
  } catch (error) {
    return handleApiError(error);
  }
}
