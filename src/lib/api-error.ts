import { ZodError } from "zod";
import { HttpError } from "@/lib/http-error";
import { fail } from "@/lib/api-response";

const STATUS_KEYWORDS: ReadonlyArray<{ keyword: string; status: number }> = [
  { keyword: "unauthorized", status: 401 },
  { keyword: "forbidden", status: 403 },
  { keyword: "not found", status: 404 },
];

function inferStatusFromMessage(message: string): number {
  const lower = message.toLowerCase();
  const match = STATUS_KEYWORDS.find((entry) => lower.includes(entry.keyword));
  return match?.status ?? 400;
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid input";
    return fail(message, 400);
  }
  if (error instanceof HttpError) {
    return fail(error.message, error.status);
  }
  if (error instanceof Error) {
    return fail(error.message, inferStatusFromMessage(error.message));
  }
  return fail("Unexpected error", 500);
}
