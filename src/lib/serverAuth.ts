import "server-only";
import { cookies } from "next/headers";

export type ServerUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_type?: string;
};

/**
 * Reads the accessToken httpOnly cookie and fetches the user from the backend.
 * Returns null if unauthenticated or if the token is expired.
 * Falls back gracefully — client-side AuthContext handles token refresh.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) return null;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const userData = await res.json();
    return {
      id: userData.id || userData.user_id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      user_type: userData.user_type,
    };
  } catch {
    return null;
  }
}
