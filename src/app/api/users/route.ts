import { handleApiError } from "@/lib/api-error";
import { parseCreateUser } from "@/modules/user/user.dto";
import {
  createUserController,
  listUsersController,
} from "@/modules/user/user.controller";

export async function GET() {
  try {
    return await listUsersController();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseCreateUser(body);
    return await createUserController(input);
  } catch (error) {
    return handleApiError(error);
  }
}
