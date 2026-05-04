import type { Session } from "next-auth";
import { HttpError } from "@/lib/http-error";

export type SessionUser = Session["user"];

export function requireSessionUser(session: Session | null): SessionUser {
  if (!session?.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }
  return session.user;
}

export function assertAdmin(user: Pick<SessionUser, "role">): void {
  if (user.role !== "admin") {
    throw new HttpError(403, "Forbidden");
  }
}

export function assertSelfOrAdmin(
  user: Pick<SessionUser, "id" | "role">,
  targetUserId: string
): void {
  if (user.role === "admin" || user.id === targetUserId) {
    return;
  }
  throw new HttpError(403, "Forbidden");
}
