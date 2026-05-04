import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";
import { HttpError } from "@/lib/http-error";
import { assertAdmin, assertSelfOrAdmin, requireSessionUser } from "@/lib/authz";

function makeSession(user: Partial<Session["user"]> | null): Session {
  return {
    user: user ?? undefined,
    expires: "2099-01-01T00:00:00.000Z",
  } as Session;
}

describe("requireSessionUser", () => {
  it("returns the session user when id is present", () => {
    const session = makeSession({ id: "u1", email: "a@example.com", name: "A", role: "user" });
    const user = requireSessionUser(session);
    expect(user.id).toBe("u1");
  });

  it("throws 401 when session is null", () => {
    expect(() => requireSessionUser(null)).toThrow(HttpError);
    expect(() => requireSessionUser(null)).toThrow("Unauthorized");
  });

  it("throws 401 when session.user is missing", () => {
    expect(() => requireSessionUser(makeSession(null))).toThrow(HttpError);
  });

  it("throws 401 when session.user.id is missing", () => {
    const session = makeSession({ email: "a@example.com" });
    expect(() => requireSessionUser(session)).toThrow("Unauthorized");
  });
});

describe("assertAdmin", () => {
  it("does not throw when role is admin", () => {
    expect(() => assertAdmin({ role: "admin" })).not.toThrow();
  });

  it("throws 403 when role is user", () => {
    expect(() => assertAdmin({ role: "user" })).toThrow(HttpError);
    expect(() => assertAdmin({ role: "user" })).toThrow("Forbidden");
  });
});

describe("assertSelfOrAdmin", () => {
  it("does not throw when role is admin (any target id)", () => {
    expect(() => assertSelfOrAdmin({ id: "u1", role: "admin" }, "u2")).not.toThrow();
  });

  it("does not throw when user id matches target id", () => {
    expect(() => assertSelfOrAdmin({ id: "u1", role: "user" }, "u1")).not.toThrow();
  });

  it("throws 403 when user is neither admin nor target", () => {
    expect(() => assertSelfOrAdmin({ id: "u1", role: "user" }, "u2")).toThrow(HttpError);
    expect(() => assertSelfOrAdmin({ id: "u1", role: "user" }, "u2")).toThrow("Forbidden");
  });
});
