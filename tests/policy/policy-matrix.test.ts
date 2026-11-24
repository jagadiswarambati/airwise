import { describe, it, expect } from 'vitest';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { deriveTimeSlots } from '../../src/domain/radar';
import { evaluatePolicy } from '../../src/domain/policy';
import {
  type HouseholdProfile,
  type AirSnapshot,
  type Mode,
  type CookingFuel,
  type BudgetTier,
  type DataFreshness,
  type Member,
  type HomeHeating,
  type RiskLevel,
} from '../../src/domain/types';
import { generateHourlySeries } from '../fixtures/sample-profiles';
import { assertAllPolicyInvariants } from './predicates';

/**
 * Policy Matrix Test Suite (CI Target: < 30s):
 * Asserts all policy invariants P-01 to P-22 with independent oracles across
 * pairwise dimension interactions, boundary breakpoints, all personas (including under-5 only),
 * and extreme PM2.5 levels.
 */
describe('Policy Matrix Invariant Suite (P-01 to P-22)', () => {
  // Dimension 1: Air Quality Level (PM2.5 values covering all bands + boundary breakpoints)
  const pm25Levels: Array<{ pm25: number; expectedBase: RiskLevel }> = [
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

  // Dimension 2: Household Vulnerability Personas
  const vulnerabilityPersonas: Array<{ label: string; members: Member[] }> = [
    {
      label: 'V0: Healthy adults',
      members: [{ id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] }],
    },
    {
      label: 'V1: Child 5-12',
      members: [
        { id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Child 5-12', ageGroup: '5-12', flags: [] },
      ],
    },
    {
      label: 'V2: Infant under 5 + adult',
      members: [
        { id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Infant under 5', ageGroup: 'u5', flags: [] },
      ],
    },
    {
      label: 'V2_ONLY: Under 5 only',
      members: [
        { id: 'm1', roleLabel: 'Infant under 5', ageGroup: 'u5', flags: [] },
        { id: 'm2', roleLabel: 'Infant under 5', ageGroup: 'u5', flags: [] },
      ],
    },
    {
      label: 'V3: Senior 65+',
      members: [{ id: 'm1', roleLabel: 'Adult 65+', ageGroup: '65+', flags: [] }],
    },
    {
      label: 'V4: Adult with asthma/COPD',
      members: [{ id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: ['asthma_copd'] }],
    },
    {
      label: 'V5: Mixed sensitive',
      members: [
        { id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
        { id: 'm2', roleLabel: 'Child 5-12', ageGroup: '5-12', flags: ['asthma_copd'] },
        { id: 'm3', roleLabel: 'Adult 65+', ageGroup: '65+', flags: ['heart'] },
      ],
    },
  ];

  // Dimension 3: Equipment Availability (6 combinations)
  const equipmentConfigs = [
    { purifier: false, windowAC: false, hvac: false },
    { purifier: true, windowAC: false, hvac: false },
    { purifier: false, windowAC: true, hvac: false },
    { purifier: true, windowAC: true, hvac: false },
    { purifier: false, windowAC: false, hvac: true },
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
    ['walk', 'cycle'],
  ];

  // Dimension 7: Cooking Fuel & Exhaust (8 combinations)
  const cookingConfigs: Array<{ fuel: CookingFuel; hasExhaust: boolean }> = [
    { fuel: 'lpg', hasExhaust: true },
    { fuel: 'lpg', hasExhaust: false },
    { fuel: 'electric', hasExhaust: true },
    { fuel: 'electric', hasExhaust: false },
    { fuel: 'biomass', hasExhaust: true },
    { fuel: 'biomass', hasExhaust: false },
    { fuel: 'other', hasExhaust: true },
    { fuel: 'other', hasExhaust: false },
  ];

  // Dimension 8: Schedule Flexibility (4 combinations)
  const scheduleConfigs = [
    { canShiftTime: false, canWorkRemotely: false },
    { canShiftTime: true, canWorkRemotely: false },
    { canShiftTime: false, canWorkRemotely: true },
    { canShiftTime: true, canWorkRemotely: true },
  ];

  // Dimension 9: Home Heating (P-22)
  const heatingConfigs: HomeHeating[] = ['none', 'electric', 'combustion'];

  function buildProfile(
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
        transitAvailable: modes.includes('bus') || modes.includes('metro_rail'),
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

  function buildSnapshot(pm25Val: number, freshness: DataFreshness): AirSnapshot {
    const hourly = generateHourlySeries(pm25Val);
    const fixedNow = new Date('2026-11-23T12:00:00.000Z');
    const fetchedAt =
      freshness === 'fresh'
        ? fixedNow.toISOString()
        : freshness === 'aging'
          ? new Date(fixedNow.getTime() - 5 * 3600 * 1000).toISOString()
          : freshness === 'stale'
            ? new Date(fixedNow.getTime() - 20 * 3600 * 1000).toISOString()
            : new Date(fixedNow.getTime() - 60 * 3600 * 1000).toISOString();

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

  it('asserts all policy invariants across crossed pairwise dimension sets with zero violations', () => {
    let testedCount = 0;

    // Cross PM2.5 levels, personas, and budget tiers directly
    for (const air of pm25Levels) {
      for (const persona of vulnerabilityPersonas) {
        for (const budget of budgetTiers) {
          // Pairwise cross secondary dimensions using orthogonal offset pairing
          for (let i = 0; i < equipmentConfigs.length; i++) {
            const equipment = equipmentConfigs[i];
            const freshness = freshnessTiers[(air.expectedBase + i) % freshnessTiers.length];
            const modes = commuteModes[(i + testedCount) % commuteModes.length];
            const cooking = cookingConfigs[(i + testedCount) % cookingConfigs.length];
            const schedule = scheduleConfigs[(i + testedCount) % scheduleConfigs.length];
            const heating = heatingConfigs[(i + testedCount) % heatingConfigs.length];
            const communityMode = testedCount % 2 === 1;

            const profile = buildProfile(
              persona,
              equipment,
              budget,
              modes,
              cooking,
              schedule,
              heating,
            );
            const snapshot = buildSnapshot(air.pm25, freshness);
            const slots = deriveTimeSlots(profile, snapshot.pm25.hourly);

            const policy = evaluatePolicy(profile, snapshot, slots, communityMode);
            const plan = buildDeterministicPlan(profile, snapshot, { communityMode });

            assertAllPolicyInvariants({
              profile,
              snapshot,
              slots,
              policy,
              plan,
              communityMode,
              expectedBase: air.expectedBase,
            });

            testedCount++;
          }
        }
      }
    }

    expect(testedCount).toBeGreaterThan(1000);
  });

  it('asserts P-22 combustion heating safety submatrix specifically (combustion vs electric vs none)', () => {
    const levels: RiskLevel[] = [0, 1, 2, 3, 4];
    const pmValues = [15, 45, 75, 105, 180];

    for (let l = 0; l < levels.length; l++) {
      const pm = pmValues[l];
      const snapshot = buildSnapshot(pm, 'fresh');

      for (const heating of heatingConfigs) {
        for (const cooking of cookingConfigs) {
          const profile = buildProfile(
            vulnerabilityPersonas[0],
            equipmentConfigs[0],
            'flexible',
            ['car'],
            cooking,
            scheduleConfigs[0],
            heating,
          );
          const slots = deriveTimeSlots(profile, snapshot.pm25.hourly);
          const policy = evaluatePolicy(profile, snapshot, slots, false);
          const plan = buildDeterministicPlan(profile, snapshot);

          assertAllPolicyInvariants({
            profile,
            snapshot,
            slots,
            policy,
            plan,
            communityMode: false,
            expectedBase: levels[l],
          });
        }
      }
    }
  });

  it('asserts under-5 only household respirator restriction (P-13)', () => {
    const u5Persona = vulnerabilityPersonas.find((p) => p.label === 'V2_ONLY: Under 5 only')!;
    for (const air of pm25Levels) {
      const snapshot = buildSnapshot(air.pm25, 'fresh');
      const profile = buildProfile(
        u5Persona,
        equipmentConfigs[0],
        'flexible',
        ['car'],
        cookingConfigs[0],
        scheduleConfigs[0],
        'none',
      );
      const slots = deriveTimeSlots(profile, snapshot.pm25.hourly);
      const policy = evaluatePolicy(profile, snapshot, slots);
      const plan = buildDeterministicPlan(profile, snapshot);

      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy,
        plan,
        communityMode: false,
        expectedBase: air.expectedBase,
      });

      // Explicit assert: PE-02 can never be approved or in top 3
      const candidateIds = policy.approvedCandidates.map((c) => c.action.id);
      expect(candidateIds).not.toContain('PE-02');
      expect(plan.topActionIds).not.toContain('PE-02');
    }
  });

  it('handles extreme PM2.5 boundary levels (0 to 1000 µg/m³) cleanly', () => {
    const extremeValues = [
      0, 1, 29.9, 30.0, 30.1, 59.9, 60.0, 60.1, 89.9, 90.0, 90.1, 119.9, 120.0, 120.1, 500, 1000,
    ];
    for (const pm of extremeValues) {
      const snapshot = buildSnapshot(pm, 'fresh');
      const profile = buildProfile(
        vulnerabilityPersonas[1],
        equipmentConfigs[0],
        'low',
        ['bus'],
        cookingConfigs[0],
        scheduleConfigs[0],
        'none',
      );
      const slots = deriveTimeSlots(profile, snapshot.pm25.hourly);
      const policy = evaluatePolicy(profile, snapshot, slots);
      const plan = buildDeterministicPlan(profile, snapshot);

      assertAllPolicyInvariants({
        profile,
        snapshot,
        slots,
        policy,
        plan,
        communityMode: false,
      });
    }
  });
});
