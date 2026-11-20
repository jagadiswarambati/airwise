import { describe, it, expect } from 'vitest';
import { buildImpactStatement, calculateAvoidedVkm } from '../../src/domain/impact';
import { ACTION_CATALOG } from '../../src/domain/catalog/actions';
import { PRIYA_PROFILE, createSnapshot } from '../fixtures/sample-profiles';

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

  it('Formula E1: calculates vehicle-kilometers avoided for carpool (MO-03) and remote work (MO-05)', () => {
    // Priya: 12 km one way, 5 trips/week
    // Carpool: 12 * 2 * min(5,2) * (1 - 1/2) = 24 * 2 * 0.5 = 24 vkm
    const carpoolVkm = calculateAvoidedVkm('MO-03', PRIYA_PROFILE);
    expect(carpoolVkm).toBe(24);

    // Remote work 1 day: 12 * 2 * 1 = 24 vkm
    const remoteVkm = calculateAvoidedVkm('MO-05', PRIYA_PROFILE);
    expect(remoteVkm).toBe(24);
  });

  it('lowers exposure confidence to low when data is stale (P-03)', () => {
    const staleSnapshot = createSnapshot(80, 'stale');
    const purifierAction = ACTION_CATALOG.find((a) => a.id === 'IN-05')!;
    const statement = buildImpactStatement(purifierAction, PRIYA_PROFILE, staleSnapshot);

    expect(statement.exposure.confidence).toBe('low');
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
