import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { reportError } from "@/lib/monitoring";

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
  } catch (error: unknown) {
    reportError(error, "proxy route: token refresh request failed", "server");
    return null;
  }
}

/** Build a NextResponse from a backend Response, preserving binary content.
 *  Optionally sets cookies on the resulting response (used after token refresh). */
async function buildNextResponse(
  response: Response,
  cookiesToSet?: Array<Parameters<NextResponse["cookies"]["set"]>>,
): Promise<NextResponse> {
  const respContentType = response.headers.get("content-type") || "";
  const isBinary =
    respContentType.startsWith("image/") ||
    respContentType.startsWith("application/pdf") ||
    respContentType.includes("octet-stream");

  let res: NextResponse;

  if (isBinary) {
    const buffer = await response.arrayBuffer();
    const responseHeaders: Record<string, string> = {
      "Content-Type": respContentType,
    };
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) responseHeaders["Cache-Control"] = cacheControl;
    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition)
      responseHeaders["Content-Disposition"] = contentDisposition;
    res = new NextResponse(buffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } else {
    const data = await response.json().catch(() => null);
    res = NextResponse.json(data, { status: response.status });
  }

  if (cookiesToSet) {
    for (const args of cookiesToSet) {
      res.cookies.set(...args);
    }
  }

  return res;
}

const PUBLIC_AUTH_PATHS = ["/auth/forgot-password", "/auth/reset-password"];

const PUBLIC_AUTH_LIMIT = 8;
const PUBLIC_AUTH_WINDOW_MS = 15 * 60 * 1000;

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
  const isPublicMutation =
    isPublic && ["POST", "PUT", "PATCH"].includes(method);
  const tokens = await getToken();

  if (isPublicMutation) {
    const ip = getClientIp(request);
    const limiter = checkRateLimit(
      `auth:public:${ip}:${apiPath}`,
      PUBLIC_AUTH_LIMIT,
      PUBLIC_AUTH_WINDOW_MS,
    );

    if (!limiter.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limiter.retryAfterSeconds),
            "X-RateLimit-Remaining": String(limiter.remaining),
          },
        },
      );
    }
  }

  if (!tokens.access && !isPublic) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Build target URL
  const params = new URLSearchParams(url.searchParams);
  params.delete("path");
  const query = params.toString();
  const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}${apiPath}${query ? `?${query}` : ""}`;

  // Detect multipart uploads to pass through correctly
  const incomingContentType = request.headers.get("content-type") || "";
  const isMultipart = incomingContentType.includes("multipart/form-data");

  // Build fetch options
  const headers: Record<string, string> = {
    "Content-Type": isMultipart ? incomingContentType : "application/json",
  };
  if (tokens.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  const fetchOpts: RequestInit = { method, headers };

  if (!["GET", "HEAD", "DELETE"].includes(method)) {
    if (isMultipart) {
      try {
        fetchOpts.body = await request.arrayBuffer();
      } catch (error: unknown) {
        reportError(
          error,
          "proxy route: failed to read multipart request body",
          "server",
        );
        return NextResponse.json(
          { message: "Failed to read request body" },
          { status: 400 },
        );
      }
    } else {
      try {
        const body = await request.text();
        if (body) fetchOpts.body = body;
      } catch (error: unknown) {
        reportError(
          error,
          "proxy route: failed to read request body",
          "server",
        );
        /* no body */
      }
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

      const cookieBase = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };
      const cookiesToSet: Array<Parameters<NextResponse["cookies"]["set"]>> = [
        ["accessToken", newTokens.access_token, { ...cookieBase, maxAge: 60 * 60 * 24 }],
      ];
      if (newTokens.refresh_token) {
        cookiesToSet.push([
          "refreshToken",
          newTokens.refresh_token,
          { ...cookieBase, maxAge: 60 * 60 * 24 * 7 },
        ]);
      }

      return buildNextResponse(response, cookiesToSet);
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

  return buildNextResponse(response);
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
