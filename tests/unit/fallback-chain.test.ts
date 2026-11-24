import { describe, expect, it, beforeEach } from 'vitest';
import { getAirSnapshot } from '../../src/data/fallback-chain';
import { airCache } from '../../src/data/cache';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { evaluatePolicy } from '../../src/domain/policy';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { type Location } from '../../src/domain/types';

describe('Fallback Chain & Honest Offline Behaviour (Decision A-32)', () => {
  const offlineLocation: Location = {
    label: 'Offline Test City',
    lat: 99.99,
    lon: 99.99,
    country: 'IN',
  };

  beforeEach(() => {
    airCache.clear();
  });

  it('returns cached snapshot with isFallback: true when live fetch fails but cache exists', async () => {
    const mockCached = {
      ...PRIYA_PROFILE,
      pm25: {
        now: 45.0,
        hourly: [{ time: new Date().toISOString(), pm25: 45.0 }],
      },
      trend: 'steady' as const,
      observedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      fetchedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      source: {
        id: 'open-meteo',
        name: 'Open-Meteo',
        dataType: 'modelled' as const,
        resolutionNote: 'CAMS forecast',
      },
      freshness: 'fresh' as const,
      utcOffsetSeconds: 19800,
    };
    airCache.set(offlineLocation.lat, offlineLocation.lon, mockCached);

    // In unit test environment, live fetch fails and triggers cache retrieval
    const result = await getAirSnapshot({
      location: offlineLocation,
      scenario: 'live',
      forceRefresh: true, // Bypass initial unexpired cache check to trigger live attempt
    });

    expect(result.sourceTier).toBe('cached');
    expect(result.isFallback).toBe(true);
    expect(result.snapshot.pm25.now).toBe(45.0);
    // Freshness should be recomputed from 4 hours age -> aging
    expect(result.snapshot.freshness).toBe('aging');
    expect(result.fallbackReason).toContain('Live air data fetch failed');
  });

  it('returns honest fallback with freshness none and pm25.now null when both live and cache fail', async () => {
    const result = await getAirSnapshot({
      location: offlineLocation,
      scenario: 'live',
    });

    // Never substitute a sample scenario automatically!
    expect(result.sourceTier).toBe('live');
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBe(
      "We couldn't reach the air data service. Using cautious defaults.",
    );
    expect(result.snapshot.freshness).toBe('none');
    expect(result.snapshot.pm25.now).toBeNull();
  });

  it('applies Rule P-04 cautious defaults on honest fallback: Caution level 2, ventilation & walking suppressed', () => {
    const fallbackSnapshot = {
      pm25: { now: null, hourly: [] },
      trend: 'unknown' as const,
      observedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      source: {
        id: 'fallback-none',
        name: 'Service Unavailable',
        dataType: 'modelled' as const,
        resolutionNote: 'Fallback',
      },
      freshness: 'none' as const,
      utcOffsetSeconds: 19800,
    };

    const policy = evaluatePolicy(PRIYA_PROFILE, fallbackSnapshot, [], false, 'IN');

    // Effective level 2 (Caution) or 3 for sensitive household
    expect(policy.baseLevel).toBe(2);
    // Suppresses window opening and walking
    expect(policy.forbiddenActionIds).toContain('IN-02');
    expect(policy.forbiddenActionIds).toContain('MO-07');
    expect(policy.flags.noData).toBe(true);

    const plan = buildDeterministicPlan(PRIYA_PROFILE, fallbackSnapshot);
    expect(plan).toBeDefined();
    expect(plan.topActionIds).toHaveLength(3);
    expect(plan.planConfidence).toBe('low');
  });
});
