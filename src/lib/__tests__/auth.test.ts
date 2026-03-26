// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

async function signToken(payload: object, expiresAt: Date) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    const { getSession } = await import("../auth");
    mockCookieStore.get.mockReturnValue(undefined);

    expect(await getSession()).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const { getSession } = await import("../auth");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await signToken({ userId: "user-1", email: "test@example.com", expiresAt }, expiresAt);
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session?.userId).toBe("user-1");
    expect(session?.email).toBe("test@example.com");
  });

  test("returns null for a tampered token", async () => {
    const { getSession } = await import("../auth");
    mockCookieStore.get.mockReturnValue({ value: "tampered.jwt.token" });

    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const { getSession } = await import("../auth");
    const expiredAt = new Date(Date.now() - 1000);
    const token = await signToken({ userId: "user-1", email: "test@example.com" }, expiredAt);
    mockCookieStore.get.mockReturnValue({ value: token });

    expect(await getSession()).toBeNull();
  });
});

describe("createSession", () => {
  test("sets a cookie named auth-token", async () => {
    const { createSession } = await import("../auth");
    await createSession("user-1", "user@example.com");

    const [name] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
  });

  test("sets correct cookie options", async () => {
    const { createSession } = await import("../auth");
    await createSession("user-1", "user@example.com");

    const [, , options] = mockCookieStore.set.mock.calls[0];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie expires in ~7 days", async () => {
    const { createSession } = await import("../auth");
    const before = Date.now();
    await createSession("user-1", "user@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("token contains correct userId and email", async () => {
    const { createSession } = await import("../auth");
    await createSession("user-42", "test@example.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("test@example.com");
  });

  test("token is signed with HS256", async () => {
    const { createSession } = await import("../auth");
    await createSession("user-1", "user@example.com");

    const token: string = mockCookieStore.set.mock.calls[0][1];
    const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
    expect(header.alg).toBe("HS256");
  });
});
