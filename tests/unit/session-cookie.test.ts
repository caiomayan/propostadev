import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "better-auth.session_token=revoked-token", origin: "http://localhost:3100" }),
  cookies: async () => ({ toString: () => "better-auth.session_token=rotated-token" }),
}));
vi.mock("@/lib/auth/config", () => ({ auth: { api: { getSession: mocks.getSession } } }));
import { getSession } from "../../src/lib/auth/session";

it("checks the rotated cookie after a Server Action instead of the original revoked token", async () => {
  mocks.getSession.mockResolvedValue({ user: { id: "current-user" } });
  await getSession();
  const passedHeaders: Headers = mocks.getSession.mock.calls[0][0].headers;
  expect(passedHeaders.get("cookie")).toBe("better-auth.session_token=rotated-token");
  expect(passedHeaders.get("origin")).toBe("http://localhost:3100");
});
