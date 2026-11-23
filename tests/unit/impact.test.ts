import { describe, it, expect } from 'vitest';
import { buildImpactStatement, calculateAvoidedVkm } from '../../src/domain/impact';
import {
  calculateExposureConfidence,
  calculateEmissionsConfidence,
} from '../../src/domain/confidence';
import { ACTION_CATALOG } from '../../src/domain/catalog/actions';
import { PRIYA_PROFILE, createSnapshot } from '../fixtures/sample-profiles';
import { HouseholdProfile } from '../../src/domain/types';

describe('Dual-Axis Impact Engine', () => {
  it('returns both Exposure and Emissions axes independently for every action', () => {
    const snapshot = createSnapshot(75);

    for (const action of ACTION_CATALOG) {
      const statement = buildImpactStatement(action, PRIYA_PROFILE, snapshot);

      // Verify Exposure axis
      expect(statement.exposure).toBeDefined();
      expect(['reduces', 'neutral', 'increases', 'conditional', 'unknown']).toContain(
        statement.exposure.direction,
      );
      expect(['Measured', 'Estimated', 'Recommended']).toContain(statement.exposure.label);
      expect(['high', 'medium', 'low']).toContain(statement.exposure.confidence);
      expect(statement.exposure.note.length).toBeGreaterThan(0);

      // Verify Emissions axis
      expect(statement.emissions).toBeDefined();
      expect(['reduces', 'neutral', 'increases', 'conditional', 'unknown']).toContain(
        statement.emissions.direction,
      );
      expect(['Measured', 'Estimated', 'Recommended']).toContain(statement.emissions.label);
      expect(['high', 'medium', 'low']).toContain(statement.emissions.confidence);
      expect(statement.emissions.note.length).toBeGreaterThan(0);

      // Assumptions and doesNotChange
      expect(Array.isArray(statement.assumptions)).toBe(true);
      expect(statement.assumptions.length).toBeGreaterThan(0);
      expect(statement.doesNotChange.length).toBeGreaterThan(0);
      expect(statement.explanation.length).toBeGreaterThan(0);
    }
  });

  describe('Formula E1 Avoidance Calculations (IMPACT_METHODOLOGY §5)', () => {
    it('calculates vehicle-kilometers avoided for carpool (MO-03) and remote work (MO-05)', () => {
      // Priya: 12 km one way, 5 trips/week
      // Carpool: 12 * 2 * min(5, 2) * (1 - 1/2) = 24 * 2 * 0.5 = 24 vkm
      const carpoolVkm = calculateAvoidedVkm('MO-03', PRIYA_PROFILE);
      expect(carpoolVkm).toBe(24);

      // Remote work 1 day: 12 * 2 * 1 = 24 vkm
      const remoteVkm = calculateAvoidedVkm('MO-05', PRIYA_PROFILE);
      expect(remoteVkm).toBe(24);
    });

    it('respects custom occupancy for carpool (between 2 and 5)', () => {
      // 12 * 2 * 2 * (1 - 1/3) = 48 * (2/3) = 32 vkm
      const vkm3 = calculateAvoidedVkm('MO-03', PRIYA_PROFILE, 3);
      expect(vkm3).toBe(32);

      // 12 * 2 * 2 * (1 - 1/4) = 48 * 0.75 = 36 vkm
      const vkm4 = calculateAvoidedVkm('MO-03', PRIYA_PROFILE, 4);
      expect(vkm4).toBe(36);
    });

    it('handles boundary inputs: oneWayKm = 100, tripsPerWeek = 14', () => {
      const boundaryProfile: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: {
          ...PRIYA_PROFILE.travel,
          oneWayKm: 100,
          tripsPerWeek: 14,
        },
      };

      // Carpool: 100 * 2 * 2 * (1 - 1/2) = 200 vkm
      expect(calculateAvoidedVkm('MO-03', boundaryProfile)).toBe(200);
      // Remote: 100 * 2 * 1 = 200 vkm
      expect(calculateAvoidedVkm('MO-05', boundaryProfile)).toBe(200);
    });

    it('suppresses / returns undefined for invalid distances (<= 0 or > 100)', () => {
      const zeroKm: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, oneWayKm: 0 },
      };
      expect(calculateAvoidedVkm('MO-03', zeroKm)).toBeUndefined();

      const negKm: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, oneWayKm: -5 },
      };
      expect(calculateAvoidedVkm('MO-03', negKm)).toBeUndefined();

      const overKm: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, oneWayKm: 101 },
      };
      expect(calculateAvoidedVkm('MO-03', overKm)).toBeUndefined();
    });

    it('suppresses / returns undefined for invalid trips (<= 0, > 14, non-integer)', () => {
      const zeroTrips: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, tripsPerWeek: 0 },
      };
      expect(calculateAvoidedVkm('MO-03', zeroTrips)).toBeUndefined();

      const overTrips: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, tripsPerWeek: 15 },
      };
      expect(calculateAvoidedVkm('MO-03', overTrips)).toBeUndefined();

      const decimalTrips: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, tripsPerWeek: 3.5 },
      };
      expect(calculateAvoidedVkm('MO-03', decimalTrips)).toBeUndefined();
    });

    it('suppresses / returns undefined for non-motorised modes', () => {
      const activeCommuter: HouseholdProfile = {
        ...PRIYA_PROFILE,
        travel: { ...PRIYA_PROFILE.travel, modes: ['walk', 'cycle'] },
      };
      expect(calculateAvoidedVkm('MO-03', activeCommuter)).toBeUndefined();
      expect(calculateAvoidedVkm('MO-05', activeCommuter)).toBeUndefined();
    });

    it('strictly returns undefined for qualitative actions MO-04, MO-06, MO-07', () => {
      expect(calculateAvoidedVkm('MO-04', PRIYA_PROFILE)).toBeUndefined();
      expect(calculateAvoidedVkm('MO-06', PRIYA_PROFILE)).toBeUndefined();
      expect(calculateAvoidedVkm('MO-07', PRIYA_PROFILE)).toBeUndefined();
    });
  });

  describe('Decision A-31 Dual-Axis Confidence Calculation', () => {
    it('lowers exposure confidence to low when air data is stale (P-03)', () => {
      const staleSnapshot = createSnapshot(80, 'stale');
      const purifierAction = ACTION_CATALOG.find((a) => a.id === 'IN-05')!;
      const statement = buildImpactStatement(purifierAction, PRIYA_PROFILE, staleSnapshot);

      expect(statement.exposure.confidence).toBe('low');
    });

    it('does NOT lower emissions confidence when air data is stale (A-31)', () => {
      const staleSnapshot = createSnapshot(80, 'stale');
      const carpoolAction = ACTION_CATALOG.find((a) => a.id === 'MO-03')!;
      const statement = buildImpactStatement(carpoolAction, PRIYA_PROFILE, staleSnapshot);

      // Air data freshness does not apply to emissions confidence
      // Self-reported valid inputs: min(evidence=high, inputTier=self-reported(medium)) = medium
      expect(statement.emissions.confidence).toBe('medium');
    });

    it('caps emissions confidence at low if profile inputs are missing', () => {
      expect(calculateEmissionsConfidence('high', 'missing')).toBe('low');
      expect(calculateEmissionsConfidence('high', 'self-reported')).toBe('medium');
    });

    it('computes exposure confidence correctly per tier table', () => {
      expect(calculateExposureConfidence('high', 'fresh', 'observed')).toBe('high');
      expect(calculateExposureConfidence('high', 'fresh', 'modelled')).toBe('medium');
      expect(calculateExposureConfidence('high', 'stale', 'observed')).toBe('low');
      expect(calculateExposureConfidence('low', 'fresh', 'observed')).toBe('low');
    });
  });

  it('demonstrates that exposure reduction does not imply emissions reduction', () => {
    const snapshot = createSnapshot(80);
    const maskAction = ACTION_CATALOG.find((a) => a.id === 'PE-02')!;
    const statement = buildImpactStatement(maskAction, PRIYA_PROFILE, snapshot);

    expect(statement.exposure.direction).toBe('reduces');
    expect(statement.emissions.direction).toBe('neutral');
    expect(statement.doesNotChange.toLowerCase()).toContain('does not reduce');
  });
});
