import { isIP } from "node:net";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 10_000;
const PRUNE_SCAN_LIMIT = 200;

function nowMs() {
  return Date.now();
}

function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }

  const [a, b] = parts;

  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;

  return false;
}

function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    const mappedIPv4 = normalized.slice("::ffff:".length);
    if (isIP(mappedIPv4) === 4) {
      return isPrivateOrReservedIPv4(mappedIPv4);
    }
  }

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    normalized.startsWith("2001:db8") ||
    normalized.startsWith("ff")
  );
}

function isValidPublicIp(ipCandidate: string | null | undefined): boolean {
  if (!ipCandidate) return false;

  const ip = ipCandidate.trim();
  if (!ip) return false;

  const family = isIP(ip);
  if (family === 0) return false;
  if (family === 4) return !isPrivateOrReservedIPv4(ip);
  return !isPrivateOrReservedIPv6(ip);
}

function pruneExpiredBuckets(currentTime: number, limit: number) {
  let scanned = 0;
  for (const [key, bucket] of buckets) {
    if (scanned >= limit) break;
    scanned += 1;
    if (bucket.resetAt <= currentTime) {
      buckets.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (isValidPublicIp(cfIp)) {
    return cfIp as string;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (isValidPublicIp(realIp)) {
    return realIp as string;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const rightMostIp = ips.length > 0 ? ips[ips.length - 1] : null;
    if (isValidPublicIp(rightMostIp)) {
      return rightMostIp as string;
    }
  }

  return "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const currentTime = nowMs();

  let bucket = buckets.get(key);

  if (bucket && bucket.resetAt <= currentTime) {
    buckets.delete(key);
    bucket = undefined;
  }

  if (buckets.size >= MAX_BUCKETS) {
    pruneExpiredBuckets(currentTime, PRUNE_SCAN_LIMIT);
  }

  if (buckets.size >= MAX_BUCKETS && !bucket) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (!bucket) {
    buckets.set(key, {
      count: 1,
      resetAt: currentTime + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - currentTime) / 1000),
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000)),
  };
}
