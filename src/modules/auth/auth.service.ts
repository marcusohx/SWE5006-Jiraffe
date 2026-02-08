import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/modules/user/user.repository";
import type { UserAuthRecord } from "@/modules/user/user.model";

export async function authenticateWithPassword(
  email: string,
  password: string
): Promise<UserAuthRecord | null> {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    return null;
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}
