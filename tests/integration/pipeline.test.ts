import { describe, it, expect } from 'vitest';
import { getSampleScenarioSnapshot, getAirSnapshot } from '../../src/data/fallback-chain';
import { buildTrustModel } from '../../src/data/trust';
import { computeBaseLevel, computeEffectiveLevel } from '../../src/domain/levels';
import { deriveTimeSlots } from '../../src/domain/radar';
import { evaluatePolicy } from '../../src/domain/policy';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { decideVentilation } from '../../src/domain/ventilation';
import { evaluateMobilityPolicy } from '../../src/domain/mobility';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { HouseholdProfile } from '../../src/domain/types';
import { getProfile, saveProfile, deleteProfile, PRIYA_PRESET } from '../../src/state/profileStore';

describe('Deterministic Pipeline Integration Suite (Part 1)', () => {
  it('runs complete pipeline for Clear scenario', async () => {
    const snapshot = getSampleScenarioSnapshot('clear');
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly, 'IN');

    const baseLevel = computeBaseLevel(snapshot.pm25.now, 'IN');
    expect(baseLevel).toBe(0);

    const effectiveLevel = computeEffectiveLevel(baseLevel, PRIYA_PROFILE.members);
    // Priya has child (7) with asthma + elder (68) -> P-02 bump: 0 -> 1
    expect(effectiveLevel).toBe(1);

    const policy = evaluatePolicy(PRIYA_PROFILE, snapshot, slots, false, 'IN');
    expect(policy.approvedCandidates.length).toBeGreaterThanOrEqual(3);
    expect(policy.forbiddenActionIds).not.toContain('PE-01');

    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
    expect(plan.source).toBe('deterministic');
    expect(plan.topActionIds).toHaveLength(3);
    expect(plan.timeline).toHaveLength(6);

    const trust = buildTrustModel(snapshot, plan.planConfidence, plan.confidenceReason, 'sample', true, 'Sample scenario active');
    expect(trust.isFallback).toBe(true);
    expect(trust.dataTypeBadge).toBe('Demo data');

    // Dual-axis impact assertions on every candidate action
    for (const cand of policy.approvedCandidates) {
      expect(cand.impact.exposure.direction).toBeDefined();
      expect(cand.impact.exposure.label).toBeDefined();
      expect(cand.impact.exposure.confidence).toBeDefined();
      expect(cand.impact.emissions.direction).toBeDefined();
      expect(cand.impact.emissions.label).toBeDefined();
      expect(cand.impact.assumptions.length).toBeGreaterThan(0);
    }
  });

  it('runs complete pipeline for Moderate scenario', async () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const baseLevel = computeBaseLevel(snapshot.pm25.now, 'IN');
    const effectiveLevel = computeEffectiveLevel(baseLevel, PRIYA_PROFILE.members);
    expect(effectiveLevel).toBeGreaterThanOrEqual(2);

    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
    expect(plan.topActionIds).toHaveLength(3);
    expect(plan.planConfidence).toBe('medium');
  });

  it('runs complete pipeline for Severe scenario and asserts Severe Mode invariants', async () => {
    const snapshot = getSampleScenarioSnapshot('severe');
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly, 'IN');

    const baseLevel = computeBaseLevel(snapshot.pm25.now, 'IN');
    const effectiveLevel = computeEffectiveLevel(baseLevel, PRIYA_PROFILE.members);
    expect(effectiveLevel).toBe(4);

    const policy = evaluatePolicy(PRIYA_PROFILE, snapshot, slots, false, 'IN');
    // P-01: outdoor exercise forbidden
    expect(policy.forbiddenActionIds).toContain('MO-07');
    // P-07: windows closed
    expect(policy.forbiddenActionIds).toContain('IN-02');
    // Mandatory IN-01 & PE-03
    expect(policy.mustIncludeActionIds).toContain('IN-01');
    expect(policy.mustIncludeActionIds).toContain('PE-03');

    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
    expect(plan.flags.severeMode).toBe(true);
    // Urgent mustInclude in top 3
    expect(plan.topActionIds).toContain('IN-01');
  });

  it('runs complete pipeline for Stale data and suppresses uncertain outdoor actions', async () => {
    const snapshot = getSampleScenarioSnapshot('stale');
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly, 'IN');
    const policy = evaluatePolicy(PRIYA_PROFILE, snapshot, slots, false, 'IN');

    // P-03 / P-04: walking and window opening suppressed
    expect(policy.forbiddenActionIds).toContain('MO-07');
    expect(policy.forbiddenActionIds).toContain('IN-02');

    const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
    expect(plan.planConfidence).toBe('low');
  });

  it('handles offline / network failure gracefully via sample fallback with no blank screen', async () => {
    const res = await getAirSnapshot({
      location: { label: 'Offline Loc', lat: 999, lon: 999, country: 'IN' },
      scenario: 'live',
    });

    expect(res.snapshot).toBeDefined();
    expect(res.isFallback).toBe(true);

    const plan = buildDeterministicPlan(PRIYA_PROFILE, res.snapshot);
    expect(plan).toBeDefined();
    expect(plan.topActionIds).toHaveLength(3);
  });

  it('handles missing or minimal profile fields with safe defaults', () => {
    const minimalProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Delhi, India', lat: 28.61, lon: 77.21, country: 'IN' },
      members: [{ id: 'm1', roleLabel: 'Adult, 30', ageGroup: '18-64', flags: [] }],
      housing: { tenure: 'rent', type: 'apartment' },
      cooking: { fuel: 'lpg', hasExhaust: false },
      homeHeating: 'none',
      equipment: { purifier: false, windowAC: false, hvac: false },
      budget: 'free',
      travel: {
        modes: ['walk'],
        oneWayKm: 2,
        tripsPerWeek: 5,
        canShiftTime: false,
        canWorkRemotely: false,
        transitAvailable: false,
        outdoorWorker: false,
      },
      routine: {
        wake: '07:00',
        leave: '08:30',
        returnHome: '17:30',
        cooking: ['19:00'],
        bed: '22:30',
      },
    };

    const snapshot = getSampleScenarioSnapshot('moderate');
    const plan = buildDeterministicPlan(minimalProfile, snapshot);
    expect(plan).toBeDefined();
    expect(plan.topActionIds).toHaveLength(3);
    expect(plan.flags.lowCostMode).toBe(true);
  });

  it('verifies ventilation decision engine in integration pipeline', () => {
    const clearSnap = getSampleScenarioSnapshot('clear');
    const clearSlots = deriveTimeSlots(PRIYA_PROFILE, clearSnap.pm25.hourly, 'IN');
    const clearVent = decideVentilation({ snapshot: clearSnap, effectiveLevel: 0, slots: clearSlots });
    expect(clearVent.verdict).toBe('open');

    const severeSnap = getSampleScenarioSnapshot('severe');
    const severeSlots = deriveTimeSlots(PRIYA_PROFILE, severeSnap.pm25.hourly, 'IN');
    const severeVent = decideVentilation({ snapshot: severeSnap, effectiveLevel: 4, slots: severeSlots });
    expect(severeVent.verdict).toBe('closed');
  });

  it('verifies mobility policy in integration pipeline', () => {
    const clearSnap = getSampleScenarioSnapshot('clear');
    const clearSlots = deriveTimeSlots(PRIYA_PROFILE, clearSnap.pm25.hourly, 'IN');
    const walkingProfile: HouseholdProfile = {
      ...PRIYA_PROFILE,
      travel: {
        ...PRIYA_PROFILE.travel,
        modes: ['walk'],
        oneWayKm: 1,
      },
    };
    const mobClear = evaluateMobilityPolicy(walkingProfile, 1, clearSnap.freshness, clearSlots, true);
    expect(mobClear.actionIds).toContain('MO-07');

    const severeSnap = getSampleScenarioSnapshot('severe');
    const severeSlots = deriveTimeSlots(PRIYA_PROFILE, severeSnap.pm25.hourly, 'IN');
    const mobSevere = evaluateMobilityPolicy(walkingProfile, 4, severeSnap.freshness, severeSlots, true);
    expect(mobSevere.actionIds).not.toContain('MO-07');
    expect(mobSevere.forbiddenActionIds).toContain('MO-07');
  });

  it('recovers safely from corrupt or missing LocalStorage', () => {
    deleteProfile();
    const fallbackProfile = getProfile();
    expect(fallbackProfile).toBeNull();

    // After saving Priya preset
    saveProfile(PRIYA_PRESET);
    const loaded = getProfile();
    expect(loaded).toBeDefined();
    expect(loaded?.budget).toBe('low');
  });
});
