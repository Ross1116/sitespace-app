/** Converts a backend-relative URL (e.g. /api/files/uuid/preview) into a
 *  browser-accessible proxy URL (/api/proxy?path=/files/uuid/preview). */
export function toProxyUrl(backendUrl: string): string {
  const path = backendUrl.replace(/^\/api/, "");
  return `/api/proxy?path=${encodeURIComponent(path)}`;
}

export const SITE_PLAN_ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export const SITE_PLAN_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

/** Returns a user-facing error string if the file is invalid, null if OK. */
export function validateSitePlanFile(file: File): string | null {
  if (file.size > SITE_PLAN_MAX_BYTES) return "File must be under 20 MB";
  if (!SITE_PLAN_ALLOWED_TYPES.includes(file.type as (typeof SITE_PLAN_ALLOWED_TYPES)[number]))
    return "Only PDF, PNG, or JPG files are allowed";
  return null;
}
