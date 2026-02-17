import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { reportError } from "@/lib/monitoring";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // Tell backend to invalidate (best-effort)
  if (accessToken) {
    void fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }).catch((error: unknown) => {
      reportError(
        error,
        "auth/signout route: backend logout request failed",
        "server",
      );
    });
  }

  const res = NextResponse.json({ message: "Logged out" }, { status: 200 });

  res.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
