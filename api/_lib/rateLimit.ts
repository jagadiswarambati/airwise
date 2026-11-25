import { type Clock, systemClock } from '../../src/lib/clock';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export const DEFAULT_MAX_BUCKETS = 10000;
export const DEFAULT_IDLE_TTL_MS = 10 * 60 * 1000; // 10 minutes (buckets fully refill within seconds/minutes)

let maxBucketsConfig = DEFAULT_MAX_BUCKETS;
let idleTtlMsConfig = DEFAULT_IDLE_TTL_MS;

const buckets = new Map<string, Bucket>();

/**
 * Configure rate limiter limits (useful for testing bounded capacity & eviction).
 */
export function configureRateLimiter(options?: { maxBuckets?: number; idleTtlMs?: number }): void {
  if (options?.maxBuckets !== undefined) {
    maxBucketsConfig = Math.max(1, options.maxBuckets);
  }
  if (options?.idleTtlMs !== undefined) {
    idleTtlMsConfig = Math.max(1, options.idleTtlMs);
  }
}

/**
 * Returns current bucket count in memory.
 */
export function getBucketCount(): number {
  return buckets.size;
}

/**
 * Evicts idle buckets whose last refill occurred longer than idleTtlMs ago.
 * Returns the number of evicted entries.
 */
export function evictIdleBuckets(now: number, idleTtlMs: number = idleTtlMsConfig): number {
  let evicted = 0;
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill >= idleTtlMs) {
      buckets.delete(key);
      evicted++;
    }
  }
  return evicted;
}

/**
 * Extracts client IP from trusted request headers.
 *
 * Per Vercel documentation (https://vercel.com/docs/headers/request-headers#x-real-ip),
 * 'x-real-ip' is set by the Vercel Edge Network representing the client's public IP address.
 * When evaluating multi-hop 'x-forwarded-for' headers, each proxy appends to the comma-separated
 * list; taking the last element mitigates client-spoofed prefix IPs.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const realIp = headers['x-real-ip'];
  if (realIp) {
    const raw = Array.isArray(realIp) ? realIp[0] : realIp;
    const trimmed = raw.trim();
    if (trimmed) return trimmed;
  }

  const vercelForwarded = headers['x-vercel-forwarded-for'];
  if (vercelForwarded) {
    const raw = Array.isArray(vercelForwarded) ? vercelForwarded[0] : vercelForwarded;
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

function ensureCapacity(now: number): void {
  if (buckets.size >= maxBucketsConfig) {
    evictIdleBuckets(now, idleTtlMsConfig);
  }
  if (buckets.size >= maxBucketsConfig) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey !== undefined) {
      buckets.delete(oldestKey);
    }
  }
}

/**
 * Token bucket rate limiter per client IP.
 * Defaults:
 * - General endpoints (air, geocode): 20 req/min, burst 5 (configurable via RATE_LIMIT_PER_MIN)
 * - Plan endpoint: 6 req/min, burst 2
 *
 * Enforces memory safety:
 * - Capped at maxBuckets to prevent unbounded memory growth.
 * - Evicts idle entries exceeding idleTtlMs on insertion.
 * - If still at capacity, evicts the oldest entry (FIFO / LRU style).
 */
export function checkRateLimit(
  ip: string,
  endpoint: 'general' | 'plan' = 'general',
  nowOrClock: number | Clock = systemClock,
): RateLimitResult {
  const now = typeof nowOrClock === 'function' ? nowOrClock().getTime() : nowOrClock;
  const ratePerMin =
    endpoint === 'plan'
      ? 6
      : parseInt(process.env.RATE_LIMIT_PER_MIN || '20', 10) || 20;
  const burst = endpoint === 'plan' ? 2 : 5;

  const refillRatePerMs = ratePerMin / 60000;
  const key = `${endpoint}:${ip}`;

  let bucket = buckets.get(key);
  if (!bucket) {
    ensureCapacity(now);
    bucket = {
      tokens: burst,
      lastRefill: now,
    };
    buckets.set(key, bucket);
  } else {
    // Refill tokens based on elapsed time
    const elapsed = Math.max(0, now - bucket.lastRefill);
    bucket.tokens = Math.min(burst, bucket.tokens + elapsed * refillRatePerMs);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true };
  }

  const deficit = 1 - bucket.tokens;
  const retryAfterSeconds = Math.ceil(deficit / (refillRatePerMs * 1000));
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, retryAfterSeconds),
  };
}

/**
 * Reset rate limit memory and restore default configuration.
 */
export function resetRateLimiter(): void {
  buckets.clear();
  maxBucketsConfig = DEFAULT_MAX_BUCKETS;
  idleTtlMsConfig = DEFAULT_IDLE_TTL_MS;
}
