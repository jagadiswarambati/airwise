import { type Clock, systemClock } from '../../src/lib/clock';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

/**
 * DEFAULT_MAX_BUCKETS.
 */
export const DEFAULT_MAX_BUCKETS = 10000;
/**
 * DEFAULT_IDLE_TTL_MS.
 */
export const DEFAULT_IDLE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * RateLimitResult.
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * LimiterOptions.
 */
export interface LimiterOptions {
  maxBuckets?: number;
  idleTtlMs?: number;
  clock?: Clock;
}

/**
 * Token bucket rate limiter managing memory bounded per-client quotas.
 */
export class TokenBucketLimiter {
  private readonly maxBuckets: number;
  private readonly idleTtlMs: number;
  private readonly clock: Clock;
  private readonly buckets = new Map<string, Bucket>();

  constructor(options: LimiterOptions = {}) {
    this.maxBuckets = Math.max(1, options.maxBuckets ?? DEFAULT_MAX_BUCKETS);
    this.idleTtlMs = Math.max(1, options.idleTtlMs ?? DEFAULT_IDLE_TTL_MS);
    this.clock = options.clock ?? systemClock;
  }

  getBucketCount(): number {
    return this.buckets.size;
  }

  evictIdleBuckets(now?: number, idleTtlMs?: number): number {
    const currentTime = now ?? this.clock().getTime();
    const ttl = idleTtlMs ?? this.idleTtlMs;
    let evicted = 0;
    for (const [key, bucket] of this.buckets.entries()) {
      if (currentTime - bucket.lastRefill >= ttl) {
        this.buckets.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  private ensureCapacity(now: number): void {
    if (this.buckets.size >= this.maxBuckets) {
      this.evictIdleBuckets(now, this.idleTtlMs);
    }
    if (this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey !== undefined) {
        this.buckets.delete(oldestKey);
      }
    }
  }

  checkRateLimit(
    ip: string,
    endpoint: 'general' | 'plan' = 'general',
    nowOrClock?: number | Clock,
  ): RateLimitResult {
    const resolvedClock = nowOrClock ?? this.clock;
    const now = typeof resolvedClock === 'function' ? resolvedClock().getTime() : resolvedClock;
    const ratePerMin =
      endpoint === 'plan'
        ? 6
        : parseInt(process.env.RATE_LIMIT_PER_MIN || '20', 10) || 20;
    const burst = endpoint === 'plan' ? 2 : 5;

    const refillRatePerMs = ratePerMin / 60000;
    const key = `${endpoint}:${ip}`;

    let bucket = this.buckets.get(key);
    if (!bucket) {
      this.ensureCapacity(now);
      bucket = {
        tokens: burst,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    } else {
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

  reset(): void {
    this.buckets.clear();
  }
}

/**
 * Singleton default instance used by serverless API handlers.
 */
export const defaultRateLimiter = new TokenBucketLimiter();

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

/**
 * Token bucket rate limiter wrapper for default limiter instance.
 */
export function checkRateLimit(
  ip: string,
  endpoint: 'general' | 'plan' = 'general',
  nowOrClock: number | Clock = systemClock,
): RateLimitResult {
  return defaultRateLimiter.checkRateLimit(ip, endpoint, nowOrClock);
}

/**
 * Reset default rate limiter memory.
 */
export function resetRateLimiter(): void {
  defaultRateLimiter.reset();
}

/**
 * Returns current bucket count for the default limiter.
 */
export function getBucketCount(): number {
  return defaultRateLimiter.getBucketCount();
}

/**
 * Evicts idle buckets for the default limiter.
 */
export function evictIdleBuckets(now: number, idleTtlMs?: number): number {
  return defaultRateLimiter.evictIdleBuckets(now, idleTtlMs);
}
