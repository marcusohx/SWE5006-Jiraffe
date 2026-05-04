import { ok } from "@/lib/api-response";
import type { CreateUserInput, UpdateUserInput } from "@/modules/user/user.dto";
import {
  createUser,
  deleteUserById,
  getUserById,
  listUsers,
  registerUser,
  updateUserById,
} from "@/modules/user/user.service";

export async function listUsersController() {
  const users = await listUsers();
  return ok(users);
}

export async function createUserController(input: CreateUserInput) {
  const user = await createUser(input);
  return ok(user, 201);
}

export async function registerUserController(input: CreateUserInput) {
  const user = await registerUser(input);
  return ok(user, 201);
}

export async function getUserByIdController(id: string) {
  const user = await getUserById(id);
  return ok(user);
}

export async function updateUserByIdController(
  id: string,
  input: UpdateUserInput,
  actor: { id: string; role: "user" | "admin" }
) {
  const user = await updateUserById(id, input, actor);
  return ok(user);
}

export async function deleteUserByIdController(id: string) {
  await deleteUserById(id);
  return ok({ deleted: true });
}
