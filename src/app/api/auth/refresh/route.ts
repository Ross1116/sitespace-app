import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const refreshToken = (await cookies()).get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ message: data.detail || "Token refresh failed" }, { status: response.status });
  }

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `accessToken=${data.access_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24};`
  );

  return NextResponse.json(
    { access_token: data.access_token, expires_in: data.expires_in },
    { status: 200, headers }
  );
}
