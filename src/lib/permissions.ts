export type RoleLike = string | null | undefined;

export function normalizeRole(role: RoleLike): string {
  return (role ?? "").toLowerCase().trim();
}

export function isTvRole(role: RoleLike): boolean {
  return normalizeRole(role) === "tv";
}

export function isTvUser(
  user: { role?: RoleLike } | null | undefined,
): boolean {
  return isTvRole(user?.role);
}

export const TV_ALLOWED_PATH_PREFIXES = [
  "/multicalendar",
  "/bookings",
] as const;

export function isTvAllowedPath(pathname: string): boolean {
  return TV_ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
