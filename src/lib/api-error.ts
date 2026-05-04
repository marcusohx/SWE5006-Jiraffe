import { ZodError } from "zod";
import { HttpError } from "@/lib/http-error";
import { fail } from "@/lib/api-response";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid input";
    return fail(message, 400);
  }
  if (error instanceof HttpError) {
    return fail(error.message, error.status);
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const status = message.includes("unauthorized")
      ? 401
      : message.includes("forbidden")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;
    return fail(error.message, status);
  }
  return fail("Unexpected error", 500);
}
