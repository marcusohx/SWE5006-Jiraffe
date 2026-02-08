import { handleApiError } from "@/lib/api-error";
import { parseCreateUser } from "@/modules/user/user.dto";
import { registerUserController } from "@/modules/user/user.controller";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseCreateUser(body);
    return await registerUserController(input);
  } catch (error) {
    return handleApiError(error);
  }
}
