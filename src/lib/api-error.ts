import { ZodError } from "zod";
import { fail } from "@/lib/api-response";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid input";
    return fail(message, 400);
  }
  if (error instanceof Error) {
    const status = error.message.toLowerCase().includes("not found") ? 404 : 400;
    return fail(error.message, status);
  }
  return fail("Unexpected error", 500);
}
