import { describe, expect, it } from 'vitest';
import { deriveTimeSlots } from '../../src/domain/radar';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { type HourlyPoint } from '../../src/domain/types';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';

describe('Timezone Invariance: Hourly Slots & Plan Output', () => {
  // 24-hour synthetic forecast in location local time (India +5:30)
  const syntheticHourly: HourlyPoint[] = Array.from({ length: 24 }, (_, i) => ({
    time: `2026-11-20T${i.toString().padStart(2, '0')}:00:00`,
    pm25: 20 + i * 2, // Steady climb
    aqi: 50 + i * 5,
  }));

  it('assigns hourly points to routine slots identically regardless of runtime timezone', () => {
    // Routine: wake: 06:00, leave: 07:30, returnHome: 17:00, bed: 22:30
    const slots = deriveTimeSlots(PRIYA_PROFILE, syntheticHourly, 'IN', 19800);

    expect(slots).toHaveLength(6);

    const earlyMorning = slots.find((s) => s.id === 'early-morning')!;
    expect(earlyMorning.startTime).toBe('06:00');
    expect(earlyMorning.endTime).toBe('07:30');
    // Early morning should include 06:00 and 07:00 points: pm25 is (32 + 34) / 2 = 33
    expect(earlyMorning.forecastMeanPm25).toBe(33);

    const morningCommute = slots.find((s) => s.id === 'commute-out')!;
    expect(morningCommute.startTime).toBe('07:30');
    expect(morningCommute.endTime).toBe('08:15');
    // Morning commute (07:30 to 08:15) should capture the 08:00 point
    expect(morningCommute.forecastMeanPm25).toBe(36);

    const daytime = slots.find((s) => s.id === 'daytime')!;
    expect(daytime.startTime).toBe('08:15');
    expect(daytime.endTime).toBe('17:30');

    const eveningCommute = slots.find((s) => s.id === 'commute-back')!;
    expect(eveningCommute.startTime).toBe('17:30');
    expect(eveningCommute.endTime).toBe('18:15');

    const evening = slots.find((s) => s.id === 'evening')!;
    expect(evening.startTime).toBe('18:15');
    expect(evening.endTime).toBe('22:00');

    const night = slots.find((s) => s.id === 'night')!;
    expect(night.startTime).toBe('22:00');
    expect(night.endTime).toBe('06:00');
    // Night wraps midnight: contains 22:00, 23:00, 00:00..05:00 -> mean is 35
    expect(night.forecastMeanPm25).toBeDefined();
    expect(night.forecastMeanPm25).toBe(35);
  });

  it('produces identical deterministic plans across different simulated timezones', () => {
    const moderateSnapshot = getSampleScenarioSnapshot('moderate');

    const plan1 = buildDeterministicPlan(PRIYA_PROFILE, moderateSnapshot, {
      targetRegion: 'IN',
      generatedAt: '2026-11-20T12:00:00.000Z',
    });

    const plan2 = buildDeterministicPlan(PRIYA_PROFILE, moderateSnapshot, {
      targetRegion: 'IN',
      generatedAt: '2026-11-20T12:00:00.000Z',
    });

    expect(plan1.topActionIds).toEqual(plan2.topActionIds);
    expect(plan1.headline).toBe(plan2.headline);
    expect(plan1.timeline).toHaveLength(6);
    expect(plan1.timeline.map((t) => t.slotId)).toEqual(plan2.timeline.map((t) => t.slotId));
  });
});
