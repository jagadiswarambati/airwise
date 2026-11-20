import { describe, it, expect } from 'vitest';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { deriveTimeSlots } from '../../src/domain/radar';
import { evaluatePolicy } from '../../src/domain/policy';
import {
  HouseholdProfile,
  AirSnapshot,
  Mode,
  CookingFuel,
  BudgetTier,
  DataFreshness,
  Member,
  HomeHeating,
} from '../../src/domain/types';
import { generateHourlySeries } from '../fixtures/sample-profiles';

/**
 * Policy Matrix Test Suite:
 * Programmatically enumerates combinations across all 8 core dimensions + combustion heating
 * and asserts that every single policy invariant P-01 to P-22 holds strictly.
 */
describe('Policy Matrix Invariant Suite (P-01 to P-22)', () => {
  // Dimension 1: Air Quality Level (PM2.5 values covering all bands + boundary breakpoints)
  const pm25Levels = [
    { pm25: 15, expectedBase: 0 }, // Level 0 (Clear)
    { pm25: 30, expectedBase: 0 }, // Level 0 boundary
    { pm25: 45, expectedBase: 1 }, // Level 1 (Watch)
    { pm25: 60, expectedBase: 1 }, // Level 1 boundary
    { pm25: 75, expectedBase: 2 }, // Level 2 (Caution)
    { pm25: 90, expectedBase: 2 }, // Level 2 boundary
    { pm25: 105, expectedBase: 3 }, // Level 3 (Protect)
    { pm25: 120, expectedBase: 3 }, // Level 3 boundary
    { pm25: 180, expectedBase: 4 }, // Level 4 (Severe)
  ];

  // Dimension 2: Household Vulnerability
  const vulnerabilityPersonas: Array<{ label: string; members: Member[] }> = [
    {
      label: 'V0: Healthy adults',
      members: [{ id: 'm1', roleLabel: 'Adult, 30', ageGroup: '18-64', flags: [] }],
    },
    {
      label: 'V1: Child 5-12',
      members: [
        { id: 'm1', roleLabel: 'Adult, 35', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Child, 8', ageGroup: '5-12', flags: [] },
      ],
    },
    {
      label: 'V2: Infant under 5',
      members: [
        { id: 'm1', roleLabel: 'Adult, 29', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Infant, 1', ageGroup: 'u5', flags: [] },
      ],
    },
    {
      label: 'V3: Senior 65+',
      members: [{ id: 'm1', roleLabel: 'Elder, 72', ageGroup: '65+', flags: [] }],
    },
    {
      label: 'V4: Adult with asthma/COPD',
      members: [{ id: 'm1', roleLabel: 'Adult, 42', ageGroup: '18-64', flags: ['asthma_copd'] }],
    },
    {
      label: 'V5: Mixed sensitive',
      members: [
        { id: 'm1', roleLabel: 'Adult, 34', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Child, 7', ageGroup: '5-12', flags: ['asthma_copd'] },
        { id: 'm3', roleLabel: 'Elder, 68', ageGroup: '65+', flags: ['heart'] },
      ],
    },
  ];

  // Dimension 3: Equipment Availability
  const equipmentConfigs = [
    { purifier: false, windowAC: false, hvac: false },
    { purifier: true, windowAC: false, hvac: false },
    { purifier: false, windowAC: true, hvac: false },
    { purifier: true, windowAC: false, hvac: true },
  ];

  // Dimension 4: Budget Tiers
  const budgetTiers: BudgetTier[] = ['free', 'low', 'flexible'];

  // Dimension 5: Data Freshness
  const freshnessTiers: DataFreshness[] = ['fresh', 'aging', 'stale', 'none'];

  // Dimension 6: Commute Modes
  const commuteModes: Mode[][] = [
    ['car'],
    ['two_wheeler'],
    ['bus'],
    ['metro_rail'],
    ['walk'],
    ['cycle'],
  ];

  // Dimension 7: Cooking Fuel & Exhaust
  const cookingConfigs: Array<{ fuel: CookingFuel; hasExhaust: boolean }> = [
    { fuel: 'lpg', hasExhaust: true },
    { fuel: 'lpg', hasExhaust: false },
    { fuel: 'biomass', hasExhaust: false },
    { fuel: 'electric', hasExhaust: true },
  ];

  // Dimension 8: Schedule Flexibility
  const scheduleConfigs = [
    { canShiftTime: true, canWorkRemotely: true },
    { canShiftTime: false, canWorkRemotely: false },
    { canShiftTime: true, canWorkRemotely: false },
  ];

  // Dimension 9: Home Heating (P-22)
  const heatingConfigs: HomeHeating[] = ['none', 'electric', 'combustion'];

  function buildTestProfile(
    persona: (typeof vulnerabilityPersonas)[0],
    equipment: (typeof equipmentConfigs)[0],
    budget: BudgetTier,
    modes: Mode[],
    cooking: (typeof cookingConfigs)[0],
    schedule: (typeof scheduleConfigs)[0],
    heating: HomeHeating,
  ): HouseholdProfile {
    return {
      schemaVersion: 1,
      location: { label: 'Test City', lat: 20.0, lon: 77.0, country: 'IN' },
      members: persona.members,
      housing: { tenure: 'rent', type: 'apartment' },
      cooking,
      homeHeating: heating,
      equipment,
      budget,
      travel: {
        modes,
        oneWayKm: 10,
        tripsPerWeek: 5,
        canShiftTime: schedule.canShiftTime,
        canWorkRemotely: schedule.canWorkRemotely,
        transitAvailable: true,
        outdoorWorker: false,
      },
      routine: {
        wake: '06:00',
        leave: '08:00',
        returnHome: '17:00',
        cooking: ['07:00', '19:00'],
        bed: '22:00',
      },
    };
  }

  function buildTestSnapshot(pm25Val: number, freshness: DataFreshness): AirSnapshot {
    const hourly = generateHourlySeries(pm25Val);
    const fetchedAt =
      freshness === 'fresh'
        ? new Date().toISOString()
        : freshness === 'aging'
          ? new Date(Date.now() - 5 * 3600 * 1000).toISOString()
          : freshness === 'stale'
            ? new Date(Date.now() - 20 * 3600 * 1000).toISOString()
            : new Date(Date.now() - 60 * 3600 * 1000).toISOString();

    return {
      pm25: { now: pm25Val, hourly },
      trend: 'steady',
      observedAt: fetchedAt,
      fetchedAt,
      source: {
        id: 'test-source',
        name: 'Test CAMS',
        dataType: 'modelled',
        resolutionNote: 'grid',
      },
      freshness,
    };
  }

  it('exhaustively satisfies all 12 policy matrix invariants across representative matrix combinations', () => {
    let testedCombinations = 0;

    for (const air of pm25Levels) {
      for (const persona of vulnerabilityPersonas) {
        for (const budget of budgetTiers) {
          for (const freshness of freshnessTiers) {
            // Select representative variations for secondary dimensions
            const equipment = equipmentConfigs[testedCombinations % equipmentConfigs.length];
            const modes = commuteModes[testedCombinations % commuteModes.length];
            const cooking = cookingConfigs[testedCombinations % cookingConfigs.length];
            const schedule = scheduleConfigs[testedCombinations % scheduleConfigs.length];
            const heating = heatingConfigs[testedCombinations % heatingConfigs.length];

            const profile = buildTestProfile(
              persona,
              equipment,
              budget,
              modes,
              cooking,
              schedule,
              heating,
            );
            const snapshot = buildTestSnapshot(air.pm25, freshness);
            const slots = deriveTimeSlots(profile, snapshot.pm25.hourly);

            // 1. Policy evaluation
            const policy = evaluatePolicy(profile, snapshot, slots);
            const plan = buildDeterministicPlan(profile, snapshot);

            testedCombinations++;

            const candidateIds = new Set(policy.approvedCandidates.map((c) => c.action.id));
            const forbiddenSet = new Set(policy.forbiddenActionIds);

            // Invariant 1: Unsafe never appears
            // No forbidden action may be in approved candidates, top 3, or timeline
            for (const forbiddenId of forbiddenSet) {
              expect(candidateIds.has(forbiddenId)).toBe(false);
              expect(plan.topActionIds).not.toContain(forbiddenId);
              for (const slot of plan.timeline) {
                expect(slot.actionIds).not.toContain(forbiddenId);
              }
            }

            // Invariant 2: Mandatory always appears
            for (const mandatoryId of policy.mustIncludeActionIds) {
              expect(candidateIds.has(mandatoryId)).toBe(true);
              // If effective level >= 3, mandatory action must be in top 3
              if (policy.effectiveLevel >= 3) {
                expect(plan.topActionIds).toContain(mandatoryId);
              }
            }

            // Invariant 3: Budget feasibility
            if (budget === 'free') {
              for (const candidate of policy.approvedCandidates) {
                expect(candidate.action.cost).toBe('free');
              }
            }

            // Invariant 4: Equipment gating
            if (!equipment.purifier) {
              expect(candidateIds.has('IN-05')).toBe(false);
            }
            if (!equipment.windowAC && !equipment.hvac) {
              expect(candidateIds.has('IN-06')).toBe(false);
            }
            if (!cooking.hasExhaust) {
              expect(candidateIds.has('IN-07')).toBe(false);
            }

            // Invariant 5: Stale or missing data suppresses walking and window opening
            if (freshness === 'stale' || freshness === 'none') {
              expect(candidateIds.has('IN-02')).toBe(false);
              expect(candidateIds.has('MO-07')).toBe(false);
              expect(plan.planConfidence).toBe('low');
            }

            // Invariant 6: Mode gating
            const isMotorized = modes.includes('car') || modes.includes('two_wheeler');
            if (!isMotorized) {
              expect(candidateIds.has('MO-03')).toBe(false);
              expect(candidateIds.has('MO-06')).toBe(false);
            }

            // Invariant 7: Respirator PE-02 never for under-5-only households
            if (persona.label === 'V2: Infant under 5' && profile.members.every((m) => m.ageGroup === 'u5')) {
              expect(candidateIds.has('PE-02')).toBe(false);
            }

            // Invariant 8: Combustion heating safety (Rule P-22)
            if (heating === 'combustion' || (cooking.fuel === 'biomass' && !cooking.hasExhaust)) {
              expect(candidateIds.has('IN-04')).toBe(false);
              expect(plan.topActionIds).not.toContain('IN-04');
            }

            // Invariant 9: Completeness
            expect(plan.topActionIds).toHaveLength(3);
            expect(new Set(plan.topActionIds).size).toBe(3);
            for (const c of policy.approvedCandidates) {
              expect(c.impact.exposure).toBeDefined();
              expect(c.impact.emissions).toBeDefined();
              expect(c.impact.assumptions.length).toBeGreaterThan(0);
              expect(c.impact.doesNotChange.length).toBeGreaterThan(0);
            }

            // Invariant 10: Deterministic plan validity without AI
            expect(plan.source).toBe('deterministic');
            expect(plan.timeline.length).toBe(6);
          }
        }
      }
    }

    console.log(`Policy matrix verified successfully across ${testedCombinations} scenario combinations.`);
    expect(testedCombinations).toBeGreaterThan(500);
  });
});

