import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.detail || "Authentication failed" },
        { status: response.status }
      );
    }

    const headers = new Headers();

    // Store both access + refresh tokens (HTTP-only)
    headers.append(
      "Set-Cookie",
      `accessToken=${data.access_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24};`
    );
    headers.append(
      "Set-Cookie",
      `refreshToken=${data.refresh_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7};`
    );

    return NextResponse.json(
      {
        user_id: data.user_id,
        role: data.role,
        expires_in: data.expires_in,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Signin route error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
