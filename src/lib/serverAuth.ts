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

const AUTH_ME_TIMEOUT_MS = 3000;

/**
 * Reads the accessToken httpOnly cookie and fetches the user from the backend.
 * Returns null if unauthenticated or if the token is expired.
 * Falls back gracefully; client-side AuthContext handles token refresh.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_ME_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) return null;

    const userData = await res.json();
    const rawId = userData.id ?? userData.user_id;
    const id =
      typeof rawId === "string"
        ? rawId.trim()
        : typeof rawId === "number"
          ? String(rawId)
          : "";

    if (!id) {
      throw new Error("serverAuth: /auth/me response missing user id");
    }

    const email = typeof userData.email === "string" ? userData.email : "";
    if (!email) {
      throw new Error("serverAuth: /auth/me response missing email");
    }

    return {
      id,
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      user_type: userData.user_type,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(
        `serverAuth: /auth/me request timed out after ${AUTH_ME_TIMEOUT_MS}ms`,
        err,
      );
      return null;
    }

    console.error("serverAuth: failed to resolve server user", err);
    return null;
  }
}
