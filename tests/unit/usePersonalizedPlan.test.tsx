import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPersonalizedPlan } from '../../src/ai/client';
import { clearPlanCache } from '../../src/ai/plan-cache';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { deriveTimeSlots } from '../../src/domain/radar';
import { evaluatePolicy } from '../../src/domain/policy';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

describe('usePersonalizedPlan & Client Safety Authority Flow', () => {
  const snapshot = getSampleScenarioSnapshot('moderate');
  const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly, 'IN');
  const deterministicPlan = buildDeterministicPlan(PRIYA_PROFILE, snapshot, { targetRegion: 'IN' });
  const policyResult = evaluatePolicy(PRIYA_PROFILE, snapshot, slots, false, 'IN');

  beforeEach(() => {
    clearPlanCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders deterministic plan immediately and returns personalized plan on valid API response', async () => {
    const mockPlanOutput = {
      schemaVersion: 1,
      headline: 'Prioritize indoor sealing for asthmatic child during evening peak.',
      topActionIds: ['IN-01', 'PE-02', 'IN-02'],
      timeline: [
        {
          slotId: 'evening',
          actionIds: ['IN-01'],
          note: 'Seal doors and windows as particulate levels rise.',
        },
      ],
      explanations: {
        'IN-01': 'Shields respiratory symptoms during stagnation.',
      },
      assumptions: ['Household has masks ready.'],
      planConfidence: 'medium',
      confidenceReason: 'Verified forecast alignment.',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          plan: mockPlanOutput,
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getPersonalizedPlan(
      deterministicPlan,
      snapshot,
      PRIYA_PROFILE,
      slots,
      policyResult,
    );

    expect(result.isAIPersonalized).toBe(true);
    expect(result.plan.source).toBe('ai');
    expect(result.plan.topActionIds).toEqual(['IN-01', 'PE-02', 'IN-02']);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should be served from memory cache without new fetch
    const cachedResult = await getPersonalizedPlan(
      deterministicPlan,
      snapshot,
      PRIYA_PROFILE,
      slots,
      policyResult,
    );
    expect(cachedResult.isAIPersonalized).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No new network call
  });

  it('falls back safely to deterministic plan when API returns fallback or error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: false,
          fallback: true,
          message: 'LLM disabled or unavailable',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getPersonalizedPlan(
      deterministicPlan,
      snapshot,
      PRIYA_PROFILE,
      slots,
      policyResult,
    );

    expect(result.isAIPersonalized).toBe(false);
    expect(result.plan.source).toBe('deterministic');
    expect(result.plan.topActionIds).toEqual(deterministicPlan.topActionIds);
  });

  it('falls back safely to deterministic plan when API response violates client validation', async () => {
    const invalidOutput = {
      schemaVersion: 1,
      headline: 'Invalid response with hallucinated action ID.',
      topActionIds: ['IN-01', 'PE-02', 'UNAPPROVED_EXPLIOT_ID'],
      timeline: [],
      explanations: {},
      assumptions: [],
      planConfidence: 'medium',
      confidenceReason: 'Test',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          plan: invalidOutput,
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getPersonalizedPlan(
      deterministicPlan,
      snapshot,
      PRIYA_PROFILE,
      slots,
      policyResult,
    );

    // Client is safety authority: rejects invalid response and keeps deterministic plan
    expect(result.isAIPersonalized).toBe(false);
    expect(result.plan.source).toBe('deterministic');
    expect(result.statusMessage).toContain('Client rejected AI plan');
  });

  it('falls back safely to deterministic plan on fetch abort / timeout', async () => {
    const controller = new AbortController();
    controller.abort();

    const mockFetch = vi.fn().mockRejectedValue(new DOMException('The user aborted a request.', 'AbortError'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await getPersonalizedPlan(
      deterministicPlan,
      snapshot,
      PRIYA_PROFILE,
      slots,
      policyResult,
      controller.signal,
    );

    expect(result.isAIPersonalized).toBe(false);
    expect(result.plan.source).toBe('deterministic');
    expect(result.statusMessage).toContain('timed out');
  });
});
