import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("accessToken")?.value;

  // Define Public Paths (Landing Page, About, etc.)
  const isPublicPath = path === "/";

  // Define auth pages - these are in the (auth) route group
  const isAuthPage =
    path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password" || path === "/set-password";

  // All other routes are considered protected (dashboard routes)
  // Since we're using route groups, we don't need to check for specific paths
  const isProtectedRoute =
    !isPublicPath &&
    !isAuthPage &&
    !path.startsWith("/api") &&
    !path.includes("/_next") &&
    !path.includes("/favicon.ico");

  if (isProtectedRoute && !token) {
    // Redirect to login if trying to access protected route without token
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    // Redirect to home if trying to access auth pages while logged in
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

// Update the matcher to include all routes except static assets and API routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
