import { describe, it, expect, beforeEach } from 'vitest';
import {
  getClientIp,
  checkRateLimit,
  TokenBucketLimiter,
  getBucketCount,
  evictIdleBuckets,
  resetRateLimiter,
} from '../../api/_lib/rateLimit';

describe('Client IP Resolution & Anti-Spoofing (api/_lib/rateLimit.ts)', () => {
  it('branch 1: extracts client IP from platform-trusted x-real-ip header', () => {
    const headers = { 'x-real-ip': '203.0.113.10' };
    expect(getClientIp(headers)).toBe('203.0.113.10');
  });

  it('prioritizes x-real-ip over client-supplied x-forwarded-for', () => {
    const headers = {
      'x-forwarded-for': '198.51.100.1, 10.0.0.1',
      'x-real-ip': '203.0.113.99',
    };
    expect(getClientIp(headers)).toBe('203.0.113.99');
  });

  it('branch 2: correctly extracts from x-vercel-forwarded-for with several hops (selects last element)', () => {
    // Several proxy hops: client -> edge proxy 1 -> edge proxy 2
    const headers = {
      'x-vercel-forwarded-for': '1.1.1.1, 10.0.0.1, 172.16.0.1, 203.0.113.50',
    };
    expect(getClientIp(headers)).toBe('203.0.113.50');
  });

  it('branch 3: mitigates x-forwarded-for spoofing by selecting the last proxy-appended IP (spoofed prefix)', () => {
    // Attack scenario: Attacker sends 'x-forwarded-for: 1.2.3.4 (spoofed)', upstream edge appends actual client IP
    const headers = {
      'x-forwarded-for': '1.2.3.4, 10.20.30.40, 198.51.100.55',
    };
    expect(getClientIp(headers)).toBe('198.51.100.55');
  });

  it('handles array-based headers gracefully', () => {
    const headers = {
      'x-forwarded-for': ['10.0.0.1, 203.0.113.77'],
    };
    expect(getClientIp(headers)).toBe('203.0.113.77');
  });

  it('branch 4: returns unknown when no IP headers are present (none)', () => {
    expect(getClientIp({})).toBe('unknown');
    expect(getClientIp({ 'x-forwarded-for': '' })).toBe('unknown');
    expect(getClientIp({ 'x-real-ip': '   ' })).toBe('unknown');
  });

  it('convenience wrapper functions route to the default limiter instance', () => {
    resetRateLimiter();
    expect(getBucketCount()).toBe(0);

    const res = checkRateLimit('203.0.113.1', 'general');
    expect(res.allowed).toBe(true);
    expect(getBucketCount()).toBe(1);

    const evicted = evictIdleBuckets(Date.now() + 1000000, 5000);
    expect(evicted).toBe(1);
    expect(getBucketCount()).toBe(0);
  });
});

describe('Rate Limiter Memory Bounds & Idle Eviction (api/_lib/rateLimit.ts)', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('caps bucket map size at maxBuckets to prevent unbounded memory growth', () => {
    const limiter = new TokenBucketLimiter({ maxBuckets: 5 });

    // Insert 10 different IP addresses
    const now = 100000;
    for (let i = 1; i <= 10; i++) {
      const res = limiter.checkRateLimit(`10.0.0.${i}`, 'general', now);
      expect(res.allowed).toBe(true);
    }

    // Must never exceed the configured cap of 5
    expect(limiter.getBucketCount()).toBeLessThanOrEqual(5);
  });

  it('evicts idle entries when their idle time exceeds idle TTL', () => {
    const limiter = new TokenBucketLimiter({ maxBuckets: 10, idleTtlMs: 5000 });

    const startTime = 100000;
    limiter.checkRateLimit('192.168.1.1', 'general', startTime);
    limiter.checkRateLimit('192.168.1.2', 'general', startTime);
    expect(limiter.getBucketCount()).toBe(2);

    // After 6 seconds (> 5000ms idle TTL), idle entries should be evicted
    const later = startTime + 6000;
    const evicted = limiter.evictIdleBuckets(later, 5000);
    expect(evicted).toBe(2);
    expect(limiter.getBucketCount()).toBe(0);
  });

  it('automatically evicts idle entries on insertion when at capacity', () => {
    const limiter = new TokenBucketLimiter({ maxBuckets: 3, idleTtlMs: 2000 });

    const t0 = 1000;
    limiter.checkRateLimit('10.0.0.1', 'general', t0);
    limiter.checkRateLimit('10.0.0.2', 'general', t0);
    limiter.checkRateLimit('10.0.0.3', 'general', t0);
    expect(limiter.getBucketCount()).toBe(3);

    // Next request at t0 + 3000ms triggers automatic eviction of stale entries before adding new
    const t1 = t0 + 3000;
    limiter.checkRateLimit('10.0.0.4', 'general', t1);

    // Stale entries were purged; only the new one remains
    expect(limiter.getBucketCount()).toBe(1);
  });
});
