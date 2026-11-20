import { describe, it, expect } from 'vitest';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import {
  PRIYA_PROFILE,
  COMBUSTION_HEATING_PROFILE,
  createSnapshot,
} from '../fixtures/sample-profiles';

describe('Deterministic Plan Builder', () => {
  it('builds a complete, valid plan without AI or network connectivity', () => {
    const snapshot = createSnapshot(95); // High pollution (Level 3/4)
    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);

    expect(plan.source).toBe('deterministic');
    expect(plan.generatedAt).toBeDefined();
    expect(plan.headline.length).toBeGreaterThan(0);
    expect(plan.topActionIds).toHaveLength(3);
    expect(plan.topActions).toHaveLength(3);
    expect(plan.timeline).toHaveLength(6);
    expect(plan.planConfidence).toBe('medium');
    expect(plan.assumptions.length).toBeGreaterThan(0);
  });

  it('selects top 3 actions adhering to Decision A-11 composition precedence', () => {
    const snapshot = createSnapshot(130); // Level 4 Severe
    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);

    // Urgent mustInclude actions (IN-01: Closed windows, PE-03: Indoor play) must be in top 3
    expect(plan.topActionIds).toContain('IN-01');
    expect(plan.topActionIds).toContain('PE-03');
    // All 3 IDs must be distinct
    const uniqueIds = new Set(plan.topActionIds);
    expect(uniqueIds.size).toBe(3);
  });

  it('populates daily timeline across all 6 slots', () => {
    const snapshot = createSnapshot(70);
    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);

    const slotIds = plan.timeline.map((t) => t.slotId);
    expect(slotIds).toEqual([
      'early-morning',
      'commute-out',
      'daytime',
      'commute-back',
      'evening',
      'night',
    ]);

    for (const slot of plan.timeline) {
      expect(slot.actions.length).toBeGreaterThan(0);
    }
  });

  it('builds a fallback plan using cautious defaults when no data is available (P-04)', () => {
    const noDataSnapshot = createSnapshot(null, 'none');
    const plan = buildDeterministicPlan(PRIYA_PROFILE, noDataSnapshot);

    expect(plan.flags.fallbackPlan).toBe(true);
    expect(plan.planConfidence).toBe('low');
    expect(plan.topActionIds.length).toBe(3);
  });

  it('enforces combustion safety (P-22) in plan building', () => {
    const snapshot = createSnapshot(100);
    const plan = buildDeterministicPlan(COMBUSTION_HEATING_PROFILE, snapshot);

    // Never includes gap sealing IN-04
    expect(plan.topActionIds).not.toContain('IN-04');
    for (const slot of plan.timeline) {
      expect(slot.actionIds).not.toContain('IN-04');
    }
    // Fixed CO caveat present on window closing
    const in01Action = plan.topActions.find((a) => a.action.id === 'IN-01');
    if (in01Action) {
      expect(in01Action.fixedDisclaimers?.some((d) => d.includes('carbon monoxide') || d.includes('combustion'))).toBe(true);
    }
  });

  it('is completely deterministic: identical inputs produce identical plans', () => {
    const snapshot = createSnapshot(85);
    const planA = buildDeterministicPlan(PRIYA_PROFILE, snapshot, { generatedAt: '2026-11-20T10:00:00Z' });
    const planB = buildDeterministicPlan(PRIYA_PROFILE, snapshot, { generatedAt: '2026-11-20T10:00:00Z' });

    expect(planA).toEqual(planB);
  });
});
