import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Forward the request to your actual backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Set the token in a cookie for middleware
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `accessToken=${
        data.accessToken
      }; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}` // 24 hours
    );

    return NextResponse.json(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
