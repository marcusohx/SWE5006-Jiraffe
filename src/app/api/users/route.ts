import { getServerSession } from "next-auth";
import { assertAdmin, requireSessionUser } from "@/lib/authz";
import { handleApiError } from "@/lib/api-error";
import { authOptions } from "@/modules/auth/auth.options";
import { parseCreateUser } from "@/modules/user/user.dto";
import {
  createUserController,
  listUsersController,
} from "@/modules/user/user.controller";

export async function GET() {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    assertAdmin(user);
    return await listUsersController();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireSessionUser(await getServerSession(authOptions));
    assertAdmin(user);
    const body = await request.json();
    const input = parseCreateUser(body);
    return await createUserController(input);
  } catch (error) {
    return handleApiError(error);
  }
}
