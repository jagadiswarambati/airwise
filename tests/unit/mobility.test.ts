import { describe, it, expect } from 'vitest';
import { evaluateMobilityPolicy } from '../../src/domain/mobility';
import { deriveTimeSlots } from '../../src/domain/radar';
import {
  PRIYA_PROFILE,
  HEALTHY_ADULT_PROFILE,
  createSnapshot,
} from '../fixtures/sample-profiles';

describe('Mobility Policy Engine (Rules P-08, P-16, P-17, P-18, A-25)', () => {
  it('P-08: forbids walking/cycling (MO-07) when effective level >= 2', () => {
    const snapshot = createSnapshot(70); // Caution
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);
    const result = evaluateMobilityPolicy(PRIYA_PROFILE, 2, 'fresh', slots, true);

    expect(result.forbiddenActionIds).toContain('MO-07');
    expect(result.actionIds).not.toContain('MO-07');
    expect(result.explanations['MO-07']).toContain('not suitable today');
  });

  it('P-08 / A-22: suppresses walking/cycling (MO-07) when daylight is undefined', () => {
    const snapshot = createSnapshot(25); // Clear
    const slots = deriveTimeSlots(HEALTHY_ADULT_PROFILE, snapshot.pm25.hourly);
    const result = evaluateMobilityPolicy(HEALTHY_ADULT_PROFILE, 0, 'fresh', slots, false, undefined);

    expect(result.forbiddenActionIds).toContain('MO-07');
    expect(result.actionIds).not.toContain('MO-07');
    expect(result.explanations['MO-07']).toContain('daylight conditions cannot be confirmed');
  });

  it('P-08 / A-22: suppresses walking/cycling (MO-07) when outside daylight hours', () => {
    const snapshot = createSnapshot(25); // Clear
    const slots = deriveTimeSlots(HEALTHY_ADULT_PROFILE, snapshot.pm25.hourly);
    const daylight = { sunrise: '2026-11-20T06:00:00Z', sunset: '2026-11-20T18:00:00Z' };
    const nightTime = '2026-11-20T21:30:00Z'; // 9:30 PM
    const result = evaluateMobilityPolicy(HEALTHY_ADULT_PROFILE, 0, 'fresh', slots, false, daylight, nightTime);

    expect(result.forbiddenActionIds).toContain('MO-07');
    expect(result.actionIds).not.toContain('MO-07');
    expect(result.explanations['MO-07']).toContain('outside daylight hours');
  });

  it('P-08 / A-22: permits walking/cycling (MO-07) when air is Clear/Watch, data is fresh, and during daylight hours', () => {
    const snapshot = createSnapshot(25); // Clear
    const slots = deriveTimeSlots(HEALTHY_ADULT_PROFILE, snapshot.pm25.hourly);
    const daylight = { sunrise: '2026-11-20T06:00:00Z', sunset: '2026-11-20T18:00:00Z' };
    const dayTime = '2026-11-20T11:00:00Z'; // 11:00 AM
    const result = evaluateMobilityPolicy(HEALTHY_ADULT_PROFILE, 0, 'fresh', slots, false, daylight, dayTime);

    expect(result.actionIds).toContain('MO-07');
    expect(result.forbiddenActionIds).not.toContain('MO-07');
  });

  it('P-16: evaluates commute shift (MO-01) against delta >= 5 µg/m³ AND >= 15%', () => {
    const snapshot = createSnapshot(90);
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);

    // Set commute out to 100, and early morning to 80 (delta = 20 µg/m³, 20% drop)
    const morningCommute = slots.find((s) => s.id === 'commute-out');
    const earlyMorning = slots.find((s) => s.id === 'early-morning');
    if (morningCommute) morningCommute.forecastMeanPm25 = 100;
    if (earlyMorning) earlyMorning.forecastMeanPm25 = 80;

    const result = evaluateMobilityPolicy(PRIYA_PROFILE, 3, 'fresh', slots, true);
    expect(result.commuteShiftFeasible).toBe(true);
    expect(result.actionIds).toContain('MO-01');
    expect(result.forecastDifferenceUgm3).toBe(20);
  });

  it('P-17: offers remote work (MO-05) only when canWorkRemotely is true', () => {
    const snapshot = createSnapshot(90);
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);

    // Priya can work remotely
    const priyaResult = evaluateMobilityPolicy(PRIYA_PROFILE, 3, 'fresh', slots, true);
    expect(priyaResult.actionIds).toContain('MO-05');

    // Adult cannot work remotely
    const adultResult = evaluateMobilityPolicy(HEALTHY_ADULT_PROFILE, 3, 'fresh', slots, false);
    expect(adultResult.actionIds).not.toContain('MO-05');
  });

  it('A-25: excludes public transit (MO-02) for sensitive members at effective level >= 3', () => {
    const snapshot = createSnapshot(95);
    const slots = deriveTimeSlots(PRIYA_PROFILE, snapshot.pm25.hourly);

    // Priya's household has sensitive child & elder at level 3
    const result = evaluateMobilityPolicy(PRIYA_PROFILE, 3, 'fresh', slots, true);
    expect(result.forbiddenActionIds).toContain('MO-02');
    expect(result.actionIds).not.toContain('MO-02');
    expect(result.explanations['MO-02']).toContain('unshielded waiting at outdoor stops');
  });
});

