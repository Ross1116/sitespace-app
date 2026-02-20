export type TelemetryEmailMode = "none" | "hash";

export function getTelemetryEmailMode(): TelemetryEmailMode {
  // Intentionally public so it can be configured at build/runtime in the browser.
  // Values:
  // - "none" (default): do not send any email-derived identifier
  // - "hash": send a deterministic SHA-256 hash of the email (not the raw email)
  const raw = (process.env.NEXT_PUBLIC_TELEMETRY_EMAIL_MODE || "none")
    .toString()
    .trim()
    .toLowerCase();

  return raw === "hash" ? "hash" : "none";
}

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function hashEmailForTelemetry(email: string | null | undefined) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;

  // Prefer WebCrypto in the browser (secure + built-in). Fall back to Node crypto.
  const webCrypto = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (webCrypto?.subtle) {
    const data = new TextEncoder().encode(normalized);
    const digest = await webCrypto.subtle.digest("SHA-256", data);
    return toHex(digest);
  }

  // Next.js can also execute code on the server during SSR; keep a safe fallback.
  const { createHash } = await import("crypto");
  return createHash("sha256").update(normalized).digest("hex");
}
