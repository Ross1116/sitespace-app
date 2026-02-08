import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    // Call your backend with the token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      // Token expired — try refresh
      const refreshToken = cookieStore.get("refreshToken")?.value;

      if (!refreshToken) {
        const res = NextResponse.json(
          { message: "Not authenticated" },
          { status: 401 },
        );
        res.cookies.delete("accessToken");
        return res;
      }

      // Attempt refresh
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );

      if (!refreshRes.ok) {
        const res = NextResponse.json(
          { message: "Session expired" },
          { status: 401 },
        );
        res.cookies.delete("accessToken");
        res.cookies.delete("refreshToken");
        return res;
      }

      const tokens = await refreshRes.json();

      // Retry /auth/me with new token
      const retryRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!retryRes.ok) {
        const res = NextResponse.json(
          { message: "Auth failed" },
          { status: 401 },
        );
        res.cookies.delete("accessToken");
        res.cookies.delete("refreshToken");
        return res;
      }

      const userData = await retryRes.json();
      const res = NextResponse.json(userData);

      // Update cookies with new tokens
      res.cookies.set("accessToken", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      if (tokens.refresh_token) {
        res.cookies.set("refreshToken", tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      return res;
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Auth check failed" },
        { status: response.status },
      );
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
