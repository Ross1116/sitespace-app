import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now() + 60000; // 60s buffer, matches AuthContext
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("accessToken")?.value;
  const hasValidToken = !!token && !isTokenExpired(token);

  const isPublicPath = path === "/" || path === "/sentry-example-page";

  // 1. ALL Auth pages (Used to ensure these are NOT protected)
  const isAuthPage =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/set-password";

  // 2. STRICT Auth pages (Used to redirect logged-in users to Home)
  // We EXCLUDE set-password/reset-password here so users can access them even if a session exists.
  const isStrictAuthPage =
    path === "/login" || path === "/register" || path === "/forgot-password";

  // 3. Protected Routes (Dashboard, etc.)
  const isProtectedRoute =
    !isPublicPath &&
    !isAuthPage && // This ensures set-password is treated as public
    !path.startsWith("/api") &&
    !path.includes("/_next") &&
    !path.includes("/favicon.ico");

  // SCENARIO 1: Trying to access dashboard without a valid token -> Go to Login
  if (isProtectedRoute && !hasValidToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) response.cookies.delete("accessToken");
    return response;
  }

  // SCENARIO 2: Logged in user tries to go to Login/Register -> Go to Home
  if (isStrictAuthPage && hasValidToken) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // SCENARIO 3: Logged in user clicks "Set Password" link
  // We allow access, but we delete the OLD token to prevent session conflicts
  if ((path === "/set-password" || path === "/reset-password") && token) {
    const response = NextResponse.next();
    response.cookies.delete("accessToken"); // Log out the previous user automatically
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
