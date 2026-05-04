import { HttpError } from "@/lib/http-error";
import bcrypt from "bcryptjs";
import type { CreateUserInput, UpdateUserInput } from "@/modules/user/user.dto";
import type { User } from "@/modules/user/user.model";
import {
  createUser as createUserRepo,
  deleteUserById as deleteUserByIdRepo,
  findUserByEmail,
  findUserById,
  listUsers as listUsersRepo,
  updateUserById as updateUserByIdRepo,
} from "@/modules/user/user.repository";

const DEFAULT_ROLE = "user" as const;

function toPublicUser(user: Awaited<ReturnType<typeof findUserById>>): User | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers(): Promise<User[]> {
  return listUsersRepo();
}

export async function getUserById(id: string): Promise<User> {
  const user = await findUserById(id);
  const publicUser = toPublicUser(user);
  if (!publicUser) {
    throw new Error("User not found");
  }
  return publicUser;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const normalizedEmail = input.email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await createUserRepo({
    email: normalizedEmail,
    name: input.name,
    role: input.role ?? DEFAULT_ROLE,
    passwordHash,
  });

  return toPublicUser(created) as User;
}

export async function registerUser(input: CreateUserInput): Promise<User> {
  return createUser({ ...input, role: DEFAULT_ROLE });
}

export async function updateUserById(
  id: string,
  input: UpdateUserInput,
  actor: { id: string; role: "user" | "admin" }
): Promise<User> {
  if (actor.role !== "admin" && input.role !== undefined) {
    throw new HttpError(403, "Forbidden");
  }

  const updates: {
    name?: string;
    role?: "user" | "admin";
    passwordHash?: string;
  } = {};

  if (input.name) {
    updates.name = input.name;
  }
  if (input.role) {
    updates.role = input.role;
  }
  if (input.password) {
    updates.passwordHash = await bcrypt.hash(input.password, 10);
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  const updated = await updateUserByIdRepo(id, updates);
  const publicUser = toPublicUser(updated);
  if (!publicUser) {
    throw new Error("User not found");
  }
  return publicUser;
}

export async function deleteUserById(id: string): Promise<void> {
  const deleted = await deleteUserByIdRepo(id);
  if (!deleted) {
    throw new Error("User not found");
  }
}
