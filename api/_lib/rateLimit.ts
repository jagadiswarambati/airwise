import { type Clock, systemClock } from '../../src/lib/clock';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Extracts client IP from trusted request headers.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const first = raw.split(',')[0].trim();
    if (first) return first;
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return (Array.isArray(realIp) ? realIp[0] : realIp).trim();
  }

  return 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Token bucket rate limiter per client IP.
 * Defaults:
 * - General endpoints (air, geocode): 20 req/min, burst 5 (configurable via RATE_LIMIT_PER_MIN)
 * - Plan endpoint: 6 req/min, burst 2
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
 * Reset rate limit memory (useful for isolated unit testing).
 */
export function resetRateLimiter(): void {
  buckets.clear();
}
