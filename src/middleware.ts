import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  // Only validate state-changing requests to API routes
  if (!MUTATION_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // If Origin header is present, it must match the Host
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { message: "Forbidden" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  // No Origin — fall back to Referer
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return NextResponse.json(
          { message: "Forbidden" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }
  }

  // Neither Origin nor Referer — allow through.
  // SameSite: lax cookies already prevent cross-origin cookie attachment,
  // and Content-Type: application/json can't be sent by HTML forms.
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
