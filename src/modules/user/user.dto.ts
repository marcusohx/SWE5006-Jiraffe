import { z } from "zod";
import type { UserRole } from "@/modules/user/user.model";

export const userIdSchema = z.string().min(1, "User id is required");

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["user", "admin"]).optional(),
  password: z.string().min(8).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema> & {
  role?: UserRole;
};

export type UpdateUserInput = z.infer<typeof updateUserSchema> & {
  role?: UserRole;
};

export function parseCreateUser(input: unknown): CreateUserInput {
  return createUserSchema.parse(input);
}

export function parseUpdateUser(input: unknown): UpdateUserInput {
  return updateUserSchema.parse(input);
}

export function parseUserId(input: unknown): string {
  return userIdSchema.parse(input);
}
