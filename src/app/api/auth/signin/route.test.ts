import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkRateLimitMock, getClientIpMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  getClientIpMock: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIp: getClientIpMock,
}));

import { POST } from "@/app/api/auth/signin/route";

describe("POST /api/auth/signin", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://example.test";
    checkRateLimitMock.mockReset();
    getClientIpMock.mockReset();
    getClientIpMock.mockReturnValue("203.0.113.10");
    checkRateLimitMock.mockReturnValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 60,
    });
    global.fetch = vi.fn();
  });

  it("returns 400 for invalid input", async () => {
    const req = new Request("http://localhost/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email: "bad", password: "" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBeTruthy();
    expect(checkRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimitMock.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    });

    const req = new Request("http://localhost/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.message).toContain("Too many sign-in attempts");
    expect(res.headers.get("Retry-After")).toBe("120");
  });

  it("returns 502 when auth service returns non-object JSON", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        status: 200,
        json: async () => null,
      },
    );

    const req = new Request("http://localhost/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.message).toBe("Invalid response from authentication service");
  });

  it("sets secure httpOnly cookies on successful sign-in", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "access123",
          refresh_token: "refresh123",
          user_id: "u1",
          role: "manager",
          email: "user@example.com",
          first_name: "Jane",
          last_name: "Doe",
        }),
      },
    );

    const req = new Request("http://localhost/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();
    const setCookie = res.headers.get("set-cookie") || "";

    expect(res.status).toBe(200);
    expect(body.email).toBe("user@example.com");
    expect(setCookie).toContain("accessToken=");
    expect(setCookie).toContain("HttpOnly");
  });
});
