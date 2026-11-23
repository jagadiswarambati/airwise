import { describe, it, expect } from 'vitest';
import { decideVentilation } from '../../src/domain/ventilation';
import { deriveTimeSlots } from '../../src/domain/radar';
import { PRIYA_PROFILE, createSnapshot } from '../fixtures/sample-profiles';

describe('Ventilation Decision Engine (Rules P-05, P-06, P-07)', () => {
  it('P-07: mandates Keep Closed at effective level >= 3 (Protect/Severe)', () => {
    const snapshot = createSnapshot(100); // Level 3
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);
    const decision = decideVentilation({
      snapshot,
      effectiveLevel: 3,
      slots,
    });

    expect(decision.verdict).toBe('closed');
    expect(decision.reasonCode).toBe('HIGH_OUTDOOR_POLLUTION');
    expect(decision.explanation).toContain('Keep windows and exterior doors closed');
    expect(decision.uncertainty).toBeDefined();
  });

  it('P-05: recommends Ventilate (Open) when effective level <= 1 and data is fresh', () => {
    const snapshot = createSnapshot(25); // Level 0 (Clear)
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);
    const decision = decideVentilation({
      snapshot,
      effectiveLevel: 0,
      slots,
    });

    expect(decision.verdict).toBe('open');
    expect(decision.reasonCode).toBe('SAFE_OUTDOOR_CONDITIONS');
    expect(decision.explanation).toContain('Windows can be opened');
  });

  it('P-06: identifies brief ventilation window at effective level 2 if a clean window exists', () => {
    // Generate snapshot where afternoon is temporarily clean
    const snapshot = createSnapshot(50); // Base moderate
    // Artificially inject a clean dip at hour 14
    snapshot.pm25.hourly[14].pm25 = 20;

    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);
    // Mark one slot clean
    slots[2].forecastLevel = 1;

    const decision = decideVentilation({
      snapshot,
      effectiveLevel: 2,
      slots,
    });

    expect(decision.verdict).toBe('brief');
    expect(decision.reasonCode).toBe('BRIEF_WINDOW_QUALIFIED');
    expect(decision.atHour).toBeDefined();
    expect(decision.explanation).toContain('brief 15–20 minute ventilation window');
  });

  it('P-03 / P-04: defaults to Keep Closed when data is stale or missing', () => {
    const staleSnapshot = createSnapshot(20, 'stale');
    const slots = deriveTimeSlots(PRIYA_PROFILE, staleSnapshot.pm25.hourly);
    const decision = decideVentilation({
      snapshot: staleSnapshot,
      effectiveLevel: 1,
      slots,
    });

    expect(decision.verdict).toBe('closed');
    expect(decision.reasonCode).toBe('STALE_OR_MISSING_DATA');
  });
});
