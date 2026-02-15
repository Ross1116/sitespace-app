import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const SIGNIN_LIMIT = 10;
const SIGNIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const ip = getClientIp(request);
    const limiter = checkRateLimit(
      `auth:signin:${ip}:${email.toLowerCase()}`,
      SIGNIN_LIMIT,
      SIGNIN_WINDOW_MS,
    );

    if (!limiter.allowed) {
      return NextResponse.json(
        {
          message: "Too many sign-in attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limiter.retryAfterSeconds),
            "X-RateLimit-Remaining": String(limiter.remaining),
          },
        },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "detail" in data
          ? String((data as { detail?: unknown }).detail || "Authentication failed")
          : "Authentication failed";

      return NextResponse.json(
        { message },
        { status: response.status },
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { message: "Invalid response from authentication service" },
        { status: 502 },
      );
    }

    const accessToken = (data as { access_token?: unknown }).access_token;
    const refreshToken = (data as { refresh_token?: unknown }).refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { message: "Invalid token response from authentication service" },
        { status: 502 },
      );
    }

    const res = NextResponse.json(
      {
        user_id: (data as { user_id?: unknown }).user_id,
        role: (data as { role?: unknown }).role,
        email: (data as { email?: unknown }).email,
        first_name: (data as { first_name?: unknown }).first_name,
        last_name: (data as { last_name?: unknown }).last_name,
      },
      { status: 200 },
    );

    //  Both tokens as HTTP-only cookies
    res.cookies.set("accessToken", String(accessToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    res.cookies.set("refreshToken", String(refreshToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
