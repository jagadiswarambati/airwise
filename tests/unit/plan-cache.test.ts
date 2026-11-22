import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildPlanCacheKey,
  getCachedPlan,
  setCachedPlan,
  clearPlanCache,
} from '../../src/ai/plan-cache';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { AIPlanOutput } from '../../src/ai/schema';

describe('AI Plan Cache (Decision A-29)', () => {
  beforeEach(() => {
    clearPlanCache();
  });

  const sampleOutput: AIPlanOutput = {
    schemaVersion: 1,
    headline: 'High smog day. Prioritize indoor rest.',
    topActionIds: ['IN-01', 'PE-03', 'PE-02'],
    timeline: [
      {
        slotId: 'commute-out',
        actionIds: ['PE-02'],
        note: 'Wear respirator on the road.',
      },
    ],
    explanations: {
      'IN-01': 'Keep windows closed.',
    },
    assumptions: ['Masks available'],
    planConfidence: 'medium',
    confidenceReason: 'Verified model',
  };

  it('generates deterministic cache keys incorporating profile, hour, and snapshot signature', () => {
    const snapshot1 = getSampleScenarioSnapshot('moderate');
    const key1 = buildPlanCacheKey(PRIYA_PROFILE, snapshot1);
    const key2 = buildPlanCacheKey(PRIYA_PROFILE, snapshot1);

    expect(key1).toBe(key2);
    expect(key1).toContain('v1.1.0');

    // Different snapshot produces different key
    const snapshot2 = getSampleScenarioSnapshot('severe');
    const key3 = buildPlanCacheKey(PRIYA_PROFILE, snapshot2);
    expect(key1).not.toBe(key3);
  });

  it('sets and retrieves plan from cache', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const key = buildPlanCacheKey(PRIYA_PROFILE, snapshot);

    expect(getCachedPlan(key)).toBeNull();

    setCachedPlan(key, sampleOutput);
    const cached = getCachedPlan(key);
    expect(cached).toEqual(sampleOutput);
  });

  it('expires cached plan after TTL', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const key = buildPlanCacheKey(PRIYA_PROFILE, snapshot);

    // Expired TTL (-1ms)
    setCachedPlan(key, sampleOutput, -1);
    expect(getCachedPlan(key)).toBeNull();
  });
});
