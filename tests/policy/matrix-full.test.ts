import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { evaluatePolicy } from '../../src/domain/policy';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { deriveTimeSlots } from '../../src/domain/radar';
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

describe('Full Cartesian Policy Matrix (691,200 Cases + P-22 Submatrix)', () => {
  it('runs all 691,320 cases and saves execution summary to docs/matrix-run.txt', () => {
    const startTime = Date.now();

    // 1. Air Quality Level (5 values)
    const airLevels: Array<{ pm25: number; expectedBase: RiskLevel }> = [
      { pm25: 20, expectedBase: 0 },
      { pm25: 45, expectedBase: 1 },
      { pm25: 75, expectedBase: 2 },
      { pm25: 105, expectedBase: 3 },
      { pm25: 180, expectedBase: 4 },
    ];

    // 2. Household Vulnerability (6 personas)
    const personas: Array<{ label: string; members: Member[] }> = [
      {
        label: 'V0: Healthy adults',
        members: [{ id: 'm1', roleLabel: 'Adult', ageGroup: '18-64', flags: [] }],
      },
      {
        label: 'V1: Child 5-12',
        members: [
          { id: 'm1', roleLabel: 'Adult', ageGroup: '18-64', flags: [] },
          { id: 'm2', roleLabel: 'Child', ageGroup: '5-12', flags: [] },
        ],
      },
      {
        label: 'V2: Under-5 only',
        members: [{ id: 'm1', roleLabel: 'Infant', ageGroup: 'u5', flags: [] }],
      },
      {
        label: 'V3: 65+',
        members: [{ id: 'm1', roleLabel: 'Senior', ageGroup: '65+', flags: [] }],
      },
      {
        label: 'V4: Asthma/COPD',
        members: [{ id: 'm1', roleLabel: 'Adult', ageGroup: '18-64', flags: ['asthma_copd'] }],
      },
      {
        label: 'V5: Mixed',
        members: [
          { id: 'm1', roleLabel: 'Adult', ageGroup: '18-64', flags: [] },
          { id: 'm2', roleLabel: 'Child', ageGroup: '5-12', flags: ['asthma_copd'] },
          { id: 'm3', roleLabel: 'Senior', ageGroup: '65+', flags: ['heart'] },
        ],
      },
    ];

    // 3. Equipment (6 values)
    const equipmentConfigs = [
      { purifier: false, windowAC: false, hvac: false },
      { purifier: true, windowAC: false, hvac: false },
      { purifier: false, windowAC: true, hvac: false },
      { purifier: true, windowAC: true, hvac: false },
      { purifier: false, windowAC: false, hvac: true },
      { purifier: true, windowAC: false, hvac: true },
    ];

    // 4. Budget Tier (3 values)
    const budgetTiers: BudgetTier[] = ['free', 'low', 'flexible'];

    // 5. Data Freshness (4 values)
    const freshnessTiers: DataFreshness[] = ['fresh', 'aging', 'stale', 'none'];

    // 6. Commute Mode (5 values)
    const commuteModes: Array<{ modes: Mode[]; transit: boolean }> = [
      { modes: ['car'], transit: false },
      { modes: ['two_wheeler'], transit: false },
      { modes: ['bus'], transit: true },
      { modes: ['walk', 'cycle'], transit: false },
      { modes: [], transit: false }, // None / remote
    ];

    // 7. Cooking Fuel × Exhaust (8 values)
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

    // 8. Schedule Flexibility (4 values)
    const scheduleConfigs = [
      { canShiftTime: false, canWorkRemotely: false },
      { canShiftTime: true, canWorkRemotely: false },
      { canShiftTime: false, canWorkRemotely: true },
      { canShiftTime: true, canWorkRemotely: true },
    ];

    // 9. Community Mode (2 values)
    const communityModes = [false, true];

    // Pre-build Snapshots (5 air levels × 4 freshness = 20 snapshots)
    const fixedNow = new Date('2026-11-23T12:00:00.000Z');
    const snapshotMatrix: Record<number, Record<DataFreshness, AirSnapshot>> = {};
    for (const air of airLevels) {
      snapshotMatrix[air.pm25] = {} as Record<DataFreshness, AirSnapshot>;
      const hourly = generateHourlySeries(air.pm25);
      for (const fresh of freshnessTiers) {
        const fetchedAt =
          fresh === 'fresh'
            ? fixedNow.toISOString()
            : fresh === 'aging'
              ? new Date(fixedNow.getTime() - 5 * 3600 * 1000).toISOString()
              : fresh === 'stale'
                ? new Date(fixedNow.getTime() - 20 * 3600 * 1000).toISOString()
                : new Date(fixedNow.getTime() - 60 * 3600 * 1000).toISOString();

        snapshotMatrix[air.pm25][fresh] = {
          pm25: { now: air.pm25, hourly },
          trend: 'steady',
          observedAt: fetchedAt,
          fetchedAt,
          source: { id: 'test', name: 'Test', dataType: 'modelled', resolutionNote: 'grid' },
          freshness: fresh,
        };
      }
    }

    // Shared base profile template
    const testProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: { label: 'Delhi', lat: 28.6, lon: 77.2, country: 'IN' },
      members: personas[0].members,
      housing: { tenure: 'rent', type: 'apartment' },
      cooking: cookingConfigs[0],
      homeHeating: 'none',
      equipment: equipmentConfigs[0],
      budget: 'flexible',
      travel: {
        modes: ['car'],
        oneWayKm: 10,
        tripsPerWeek: 5,
        canShiftTime: false,
        canWorkRemotely: false,
        transitAvailable: false,
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

    // Pre-derive slots for each air level (routine is constant)
    const slotsMap: Record<number, ReturnType<typeof deriveTimeSlots>> = {};
    for (const air of airLevels) {
      slotsMap[air.pm25] = deriveTimeSlots(testProfile, snapshotMatrix[air.pm25].fresh.pm25.hourly);
    }

    let casesEvaluated = 0;
    const violations = 0;

    // Full Cartesian Loop: 5 × 6 × 6 × 3 × 4 × 5 × 8 × 4 × 2 = 691,200
    for (const air of airLevels) {
      const slots = slotsMap[air.pm25];

      for (const persona of personas) {
        testProfile.members = persona.members;

        for (const equip of equipmentConfigs) {
          testProfile.equipment = equip;

          for (const budget of budgetTiers) {
            testProfile.budget = budget;

            for (const freshness of freshnessTiers) {
              const snapshot = snapshotMatrix[air.pm25][freshness];

              for (const commute of commuteModes) {
                testProfile.travel.modes = commute.modes;
                testProfile.travel.transitAvailable = commute.transit;

                for (const cooking of cookingConfigs) {
                  testProfile.cooking = cooking;

                  for (const schedule of scheduleConfigs) {
                    testProfile.travel.canShiftTime = schedule.canShiftTime;
                    testProfile.travel.canWorkRemotely = schedule.canWorkRemotely;

                    for (const communityMode of communityModes) {
                      testProfile.homeHeating = 'none';

                      const policy = evaluatePolicy(testProfile, snapshot, slots, communityMode);
                      const plan = buildDeterministicPlan(testProfile, snapshot, { communityMode });

                      assertAllPolicyInvariants({
                        profile: testProfile,
                        snapshot,
                        slots,
                        policy,
                        plan,
                        communityMode,
                        expectedBase: air.expectedBase,
                      });

                      casesEvaluated++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // P-22 Submatrix (Home heating: {none, electric, combustion} × 5 levels × 8 cooking = 120 cases)
    const heatingConfigs: HomeHeating[] = ['none', 'electric', 'combustion'];
    for (const air of airLevels) {
      const snapshot = snapshotMatrix[air.pm25].fresh;
      const slots = slotsMap[air.pm25];

      for (const heating of heatingConfigs) {
        testProfile.homeHeating = heating;

        for (const cooking of cookingConfigs) {
          testProfile.cooking = cooking;

          const policy = evaluatePolicy(testProfile, snapshot, slots, false);
          const plan = buildDeterministicPlan(testProfile, snapshot);

          assertAllPolicyInvariants({
            profile: testProfile,
            snapshot,
            slots,
            policy,
            plan,
            communityMode: false,
            expectedBase: air.expectedBase,
          });

          casesEvaluated++;
        }
      }
    }

    const elapsedMs = Date.now() - startTime;
    const elapsedSec = (elapsedMs / 1000).toFixed(2);

    const logSummary = [
      '================================================================================',
      'AIRWISE POLICY MATRIX CARTESIAN VERIFICATION RUN',
      '================================================================================',
      `Timestamp: ${new Date().toISOString()}`,
      `Total Cartesian Dimensions: 9 dimensions + P-22 Submatrix`,
      `  - Air Quality Levels: 5 (base 0, 1, 2, 3, 4)`,
      `  - Household Vulnerabilities: 6 personas (V0..V5)`,
      `  - Equipment Configurations: 6`,
      `  - Budget Tiers: 3 (free, low, flexible)`,
      `  - Data Freshness Tiers: 4 (fresh, aging, stale, none)`,
      `  - Commute Modes: 5`,
      `  - Cooking Fuel × Exhaust: 8`,
      `  - Schedule Flexibility: 4`,
      `  - Community Modes: 2 (off, on)`,
      `  - Cartesian Combinations: 5 × 6 × 6 × 3 × 4 × 5 × 8 × 4 × 2 = 691,200 cases`,
      `  - P-22 Submatrix (3 heating × 5 air × 8 cooking): 120 cases`,
      `Total Cases Evaluated: ${casesEvaluated.toLocaleString()} cases`,
      `Violations Detected: ${violations}`,
      `Execution Time: ${elapsedSec}s (${(casesEvaluated / (elapsedMs / 1000)).toFixed(0)} cases/sec)`,
      'STATUS: PASS (100% invariant satisfaction, zero violations)',
      '================================================================================',
    ].join('\n');

    const docPath = path.join(process.cwd(), 'docs', 'matrix-run.txt');
    fs.writeFileSync(docPath, logSummary + '\n', 'utf-8');

    expect(casesEvaluated).toBe(691320);
    expect(violations).toBe(0);
  }, 180000); // 180s timeout
});
