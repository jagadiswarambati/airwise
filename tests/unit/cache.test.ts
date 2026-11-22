import { describe, expect, it, beforeEach } from 'vitest';
import { airCache, AIR_CACHE_TTL_MS } from '../../src/data/cache';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';

describe('Client Air Cache & Freshness Lifecycle', () => {
  const testLat = 28.61;
  const testLon = 77.21;

  beforeEach(() => {
    airCache.clear();
  });

  it('stores and retrieves fresh snapshot within TTL', () => {
    const snapshot = getSampleScenarioSnapshot('clear');
    airCache.set(testLat, testLon, snapshot);

    expect(airCache.isExpired(testLat, testLon)).toBe(false);

    const cached = airCache.get(testLat, testLon);
    expect(cached).not.toBeNull();
    expect(cached?.pm25.now).toBe(snapshot.pm25.now);
    expect(cached?.freshness).toBe('fresh');
  });

  it('preserves cached entry after TTL expiration and marks as expired for refetch', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    airCache.set(testLat, testLon, snapshot);

    // 20 minutes later (past 15-minute TTL)
    const futureTime = Date.now() + AIR_CACHE_TTL_MS + 5 * 60 * 1000;

    expect(airCache.isExpired(testLat, testLon, futureTime)).toBe(true);

    // Crucial: get() does NOT delete the entry or return null
    const expiredReading = airCache.get(testLat, testLon, futureTime);
    expect(expiredReading).not.toBeNull();
    expect(expiredReading?.pm25.now).toBe(snapshot.pm25.now);
  });

  it('recomputes freshness to aging and stale based on elapsed clock time', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const fetchedAtEpoch = new Date(snapshot.fetchedAt).getTime();
    airCache.set(testLat, testLon, snapshot);

    // 5 hours after fetchedAt -> Aging per Decision A-06 (> 3h and <= 12h)
    const agingTime = fetchedAtEpoch + 5 * 3600 * 1000;
    const agingSnapshot = airCache.get(testLat, testLon, agingTime);
    expect(agingSnapshot?.freshness).toBe('aging');

    // 16 hours after fetchedAt -> Stale per Decision A-06 (> 12h and <= 48h)
    const staleTime = fetchedAtEpoch + 16 * 3600 * 1000;
    const staleSnapshot = airCache.get(testLat, testLon, staleTime);
    expect(staleSnapshot?.freshness).toBe('stale');

    // 50 hours after fetchedAt -> None (> 48h)
    const noneTime = fetchedAtEpoch + 50 * 3600 * 1000;
    const noneSnapshot = airCache.get(testLat, testLon, noneTime);
    expect(noneSnapshot?.freshness).toBe('none');
  });

  it('persists and returns utcOffsetSeconds with the snapshot', () => {
    const snapshot = getSampleScenarioSnapshot('severe');
    snapshot.utcOffsetSeconds = 19800;
    airCache.set(testLat, testLon, snapshot);

    const retrieved = airCache.get(testLat, testLon);
    expect(retrieved?.utcOffsetSeconds).toBe(19800);
  });
});
