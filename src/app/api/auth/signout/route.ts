import { NextResponse } from "next/server";

export async function POST() {
  const headers = new Headers();

  // Clear both tokens
  headers.append("Set-Cookie", "accessToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict;");
  headers.append("Set-Cookie", "refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict;");

  return NextResponse.json({ message: "Logged out successfully" }, { status: 200, headers });
}
