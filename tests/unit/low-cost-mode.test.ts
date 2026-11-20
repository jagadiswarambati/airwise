import { describe, it, expect } from 'vitest';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE, HEALTHY_ADULT_PROFILE } from '../fixtures/sample-profiles';
import { HouseholdProfile } from '../../src/domain/types';

describe('Low-Cost Protection Mode (Decision A-13)', () => {
  it('activates low-cost mode for Priya (low budget + no purifier)', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);

    expect(plan.flags.lowCostMode).toBe(true);
    // Priya has low budget -> no medium or high cost actions in top 3
    for (const cand of plan.topActions) {
      expect(cand.action.cost).not.toBe('medium');
    }
  });

  it('activates low-cost mode for free budget households', () => {
    const freeProfile: HouseholdProfile = {
      ...HEALTHY_ADULT_PROFILE,
      budget: 'free',
      equipment: { purifier: true, windowAC: false, hvac: false }, // even with purifier
    };

    const snapshot = getSampleScenarioSnapshot('moderate');
    const plan = buildDeterministicPlan(freeProfile, snapshot);
    expect(plan.flags.lowCostMode).toBe(true);
    for (const cand of plan.topActions) {
      expect(cand.action.cost).toBe('free');
    }
  });

  it('does not activate low-cost mode for flexible budget households with equipment', () => {
    const flexibleProfile: HouseholdProfile = {
      ...HEALTHY_ADULT_PROFILE,
      budget: 'flexible',
      equipment: { purifier: true, windowAC: true, hvac: false },
    };

    const snapshot = getSampleScenarioSnapshot('moderate');
    const plan = buildDeterministicPlan(flexibleProfile, snapshot);
    expect(plan.flags.lowCostMode).toBe(false);
  });
});
