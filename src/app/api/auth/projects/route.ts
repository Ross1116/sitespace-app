import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { reportError } from "@/lib/monitoring";

type AuthTokens = {
  access: string | null;
  refresh: string | null;
};

type AuthenticatedUser = {
  id: string;
  role: string;
};

const UPSTREAM_TIMEOUT_MS = 5_000;

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function getTokens(): Promise<AuthTokens> {
  const cookieStore = await cookies();
  return {
    access: cookieStore.get("accessToken")?.value ?? null,
    refresh: cookieStore.get("refreshToken")?.value ?? null,
  };
}

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error(
        `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms`,
      );
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchCurrentUser(
  accessToken: string,
): Promise<Response> {
  return fetchWithTimeout(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

async function tryRefresh(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token?: string } | null> {
  try {
    const response = await fetchWithTimeout(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    if (!response.ok) return null;
    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw error;
    }

    reportError(error, "Auth projects route: token refresh failed", "server");
    return null;
  }
}

function parseAuthenticatedUser(payload: unknown): AuthenticatedUser | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const rawId = record.id ?? record.user_id;
  const rawRole = record.role;

  const id =
    typeof rawId === "string"
      ? rawId.trim()
      : typeof rawId === "number"
        ? String(rawId)
        : "";
  const role = typeof rawRole === "string" ? rawRole.trim() : "";

  if (!id || !role) return null;
  return { id, role };
}

function buildProjectsUrl(user: AuthenticatedUser, request: Request): string {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "100";
  const skip = url.searchParams.get("skip") ?? "0";

  if (user.role === "subcontractor") {
    const params = new URLSearchParams({
      limit,
      skip,
    });
    return `${process.env.NEXT_PUBLIC_API_URL}/subcontractors/${encodeURIComponent(user.id)}/projects?${params.toString()}`;
  }

  const params = new URLSearchParams({
    my_projects: "true",
    limit,
    skip,
  });
  return `${process.env.NEXT_PUBLIC_API_URL}/projects/?${params.toString()}`;
}

function unauthorizedResponse(message: string): NextResponse {
  const response = NextResponse.json({ message }, { status: 401 });
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}

export async function GET(request: Request) {
  try {
    const tokens = await getTokens();
    let refreshedTokens: { access_token: string; refresh_token?: string } | null =
      null;
    let accessToken = tokens.access;
    let refreshToken = tokens.refresh;

    if (!accessToken) {
      if (!refreshToken) {
        return NextResponse.json(
          { message: "Not authenticated" },
          { status: 401 },
        );
      }

      refreshedTokens = await tryRefresh(refreshToken);
      if (!refreshedTokens) {
        return unauthorizedResponse("Session expired");
      }

      accessToken = refreshedTokens.access_token;
      refreshToken = refreshedTokens.refresh_token ?? refreshToken;
    }

    let currentUserResponse = await fetchCurrentUser(accessToken);
    if (currentUserResponse.status === 401 && refreshToken) {
      refreshedTokens = await tryRefresh(refreshToken);
      if (!refreshedTokens) {
        return unauthorizedResponse("Session expired");
      }

      accessToken = refreshedTokens.access_token;
      refreshToken = refreshedTokens.refresh_token ?? refreshToken;
      currentUserResponse = await fetchCurrentUser(accessToken);
    }

    if (!currentUserResponse.ok) {
      return NextResponse.json(
        { message: "Auth check failed" },
        { status: currentUserResponse.status },
      );
    }

    const userPayload = await currentUserResponse.json();
    const user = parseAuthenticatedUser(userPayload);

    if (!user) {
      return NextResponse.json(
        { message: "Invalid authenticated user payload" },
        { status: 502 },
      );
    }

    const projectsResponse = await fetchWithTimeout(buildProjectsUrl(user, request), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!projectsResponse.ok) {
      return NextResponse.json(
        { message: "Failed to load projects" },
        { status: projectsResponse.status },
      );
    }

    const payload = await projectsResponse.json();
    const response = NextResponse.json(payload);

    if (refreshedTokens) {
      response.cookies.set("accessToken", refreshedTokens.access_token, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24,
      });

      if (refreshedTokens.refresh_token) {
        response.cookies.set("refreshToken", refreshedTokens.refresh_token, {
          ...COOKIE_BASE,
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { message: "Authentication service timed out. Please try again." },
        { status: 504 },
      );
    }

    reportError(error, "Auth projects route: unexpected error", "server");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
