import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

import { fail, ok } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/utils";
import { logger } from "@/lib/logger";

// ---- api-response ----

describe("api-response — ok", () => {
  it("returns success:true with data and default status 200", () => {
    const res = ok({ id: "1" }) as { body: unknown; status: number };
    expect(res.body).toEqual({ success: true, data: { id: "1" } });
    expect(res.status).toBe(200);
  });

  it("uses custom status when provided", () => {
    const res = ok("created", 201) as { body: unknown; status: number };
    expect(res.status).toBe(201);
  });

  it("works with null data", () => {
    const res = ok(null) as { body: unknown; status: number };
    expect(res.body).toEqual({ success: true, data: null });
  });
});

describe("api-response — fail", () => {
  it("returns success:false with error and default status 400", () => {
    const res = fail("Bad input") as { body: unknown; status: number };
    expect(res.body).toEqual({ success: false, error: "Bad input" });
    expect(res.status).toBe(400);
  });

  it("uses custom status when provided", () => {
    const res = fail("not found", 404) as { body: unknown; status: number };
    expect(res.status).toBe(404);
  });

  it("uses 500 for server errors", () => {
    const res = fail("internal", 500) as { body: unknown; status: number };
    expect(res.status).toBe(500);
  });
});

// ---- api-error ----

function makeZodError(message: string) {
  const result = z.string().min(1, message).safeParse("");
  if (!result.success) return result.error;
  throw new Error("Expected ZodError");
}

describe("handleApiError — ZodError", () => {
  it("returns 400 with the first ZodError message", () => {
    const err = makeZodError("Field is required");
    const res = handleApiError(err) as { body: unknown; status: number };
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Field is required" });
  });
});

describe("handleApiError — Error", () => {
  it("returns 404 when message includes 'not found'", () => {
    const res = handleApiError(new Error("Team not found")) as { body: unknown; status: number };
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Team not found" });
  });

  it("returns 400 for generic Error", () => {
    const res = handleApiError(new Error("Something went wrong")) as { body: unknown; status: number };
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Something went wrong" });
  });

  it("is case-insensitive for 'not found' check", () => {
    const res = handleApiError(new Error("User Not Found")) as { body: unknown; status: number };
    expect(res.status).toBe(404);
  });
});

describe("handleApiError — unknown", () => {
  it("returns 500 for a string error", () => {
    const res = handleApiError("raw string error") as { body: unknown; status: number };
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: "Unexpected error" });
  });

  it("returns 500 for null", () => {
    const res = handleApiError(null) as { body: unknown; status: number };
    expect(res.status).toBe(500);
  });

  it("returns 500 for plain object", () => {
    const res = handleApiError({ code: 11000 }) as { body: unknown; status: number };
    expect(res.status).toBe(500);
  });
});

// ---- formatRelativeTime ----

const ago = (ms: number) => new Date(Date.now() - ms);

const SEC = 1000;
const MIN = 60 * SEC;
const HR = 60 * MIN;
const DAY = 24 * HR;

describe("formatRelativeTime", () => {
  it("returns 'Just now' for under 60 seconds", () => {
    expect(formatRelativeTime(ago(30 * SEC))).toBe("Just now");
  });

  it("returns '1 minute ago' for exactly 1 minute", () => {
    expect(formatRelativeTime(ago(60 * SEC))).toBe("1 minute ago");
  });

  it("returns 'N minutes ago' for under an hour", () => {
    expect(formatRelativeTime(ago(30 * MIN))).toBe("30 minutes ago");
  });

  it("returns '1 hour ago' for exactly 1 hour", () => {
    expect(formatRelativeTime(ago(60 * MIN))).toBe("1 hour ago");
  });

  it("returns 'N hours ago' for under a day", () => {
    expect(formatRelativeTime(ago(5 * HR))).toBe("5 hours ago");
  });

  it("returns 'Yesterday' for exactly 1 day", () => {
    expect(formatRelativeTime(ago(DAY))).toBe("Yesterday");
  });

  it("returns 'N days ago' for under a week", () => {
    expect(formatRelativeTime(ago(3 * DAY))).toBe("3 days ago");
  });

  it("returns 'N weeks ago' for under a month", () => {
    expect(formatRelativeTime(ago(14 * DAY))).toBe("2 weeks ago");
  });

  it("returns formatted date for over a month", () => {
    const result = formatRelativeTime(ago(40 * DAY));
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("accepts an ISO string as input", () => {
    expect(formatRelativeTime(ago(10 * SEC).toISOString())).toBe("Just now");
  });
});

// ---- logger ----

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.info logs message without meta", () => {
    logger.info("hello");
    expect(console.log).toHaveBeenCalledWith("[info] hello");
  });

  it("logger.info logs message with meta", () => {
    logger.info("hello", { key: "value" });
    expect(console.log).toHaveBeenCalledWith("[info] hello", { key: "value" });
  });

  it("logger.warn logs message without meta", () => {
    logger.warn("warning");
    expect(console.warn).toHaveBeenCalledWith("[warn] warning");
  });

  it("logger.warn logs message with meta", () => {
    logger.warn("warning", { code: 42 });
    expect(console.warn).toHaveBeenCalledWith("[warn] warning", { code: 42 });
  });

  it("logger.error logs message without meta", () => {
    logger.error("error occurred");
    expect(console.error).toHaveBeenCalledWith("[error] error occurred");
  });

  it("logger.error logs message with meta", () => {
    logger.error("error", { stack: "trace" });
    expect(console.error).toHaveBeenCalledWith("[error] error", { stack: "trace" });
  });
});
