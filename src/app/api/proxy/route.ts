import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getToken() {
  const cookieStore = await cookies();
  return {
    access: cookieStore.get("accessToken")?.value,
    refresh: cookieStore.get("refreshToken")?.value,
  };
}

async function tryRefresh(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token?: string } | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const PUBLIC_AUTH_PATHS = [
  "/auth/forgot-password",
  "/auth/reset-password",
];

async function proxyToBackend(
  request: Request,
  method: string,
): Promise<NextResponse> {
  const url = new URL(request.url);
  const apiPath = url.searchParams.get("path");

  if (!apiPath || !apiPath.startsWith("/") || apiPath.includes("..")) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

  const isPublic = PUBLIC_AUTH_PATHS.some((p) => apiPath.startsWith(p));
  const tokens = await getToken();

  if (!tokens.access && !isPublic) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Build target URL
  const params = new URLSearchParams(url.searchParams);
  params.delete("path");
  const query = params.toString();
  const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}${apiPath}${query ? `?${query}` : ""}`;

  // Build fetch options
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (tokens.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  const fetchOpts: RequestInit = { method, headers };

  if (!["GET", "HEAD", "DELETE"].includes(method)) {
    try {
      const body = await request.text();
      if (body) fetchOpts.body = body;
    } catch {
      /* no body */
    }
  }

  // First attempt
  let response = await fetch(targetUrl, fetchOpts);

  // If 401, try refresh once
  if (response.status === 401 && tokens.refresh) {
    const newTokens = await tryRefresh(tokens.refresh);

    if (newTokens) {
      headers.Authorization = `Bearer ${newTokens.access_token}`;
      response = await fetch(targetUrl, { ...fetchOpts, headers });

      // Return response with updated cookies
      const data = await response.json().catch(() => null);
      const res = NextResponse.json(data, { status: response.status });

      res.cookies.set("accessToken", newTokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      if (newTokens.refresh_token) {
        res.cookies.set("refreshToken", newTokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      return res;
    }

    // Refresh failed — clear everything
    const res = NextResponse.json(
      { message: "Session expired" },
      { status: 401 },
    );
    res.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
    res.cookies.set("refreshToken", "", { path: "/", maxAge: 0 });
    return res;
  }

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}

export async function GET(req: Request) {
  return proxyToBackend(req, "GET");
}
export async function POST(req: Request) {
  return proxyToBackend(req, "POST");
}
export async function PUT(req: Request) {
  return proxyToBackend(req, "PUT");
}
export async function PATCH(req: Request) {
  return proxyToBackend(req, "PATCH");
}
export async function DELETE(req: Request) {
  return proxyToBackend(req, "DELETE");
}
