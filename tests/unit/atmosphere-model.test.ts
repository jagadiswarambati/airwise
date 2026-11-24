import { describe, it, expect } from 'vitest';
import {
  computeDayPhase,
  computeCelestialPosition,
  computeDiscRingOpacity,
  computeHazeOpacities,
  computeSpecks,
  computeWindStreaks,
  computeAtmosphereModel,
} from '../../src/ui/atmosphere/model';
import { getLocalHour } from '../../src/domain/time';

describe('Atmosphere Model (tests/unit/atmosphere-model.test.ts)', () => {
  describe('computeDayPhase', () => {
    it('returns "day" for hours 6 to 16 inclusive', () => {
      for (let h = 6; h <= 16; h++) {
        expect(computeDayPhase(h), `Hour ${h} should be day`).toBe('day');
      }
    });

    it('returns "dusk" for dawn (5) and sunset hours (17, 18)', () => {
      expect(computeDayPhase(5)).toBe('dusk');
      expect(computeDayPhase(17)).toBe('dusk');
      expect(computeDayPhase(18)).toBe('dusk');
    });

    it('returns "night" for late night (19-23) and early morning (0-4)', () => {
      for (const h of [19, 20, 21, 22, 23, 0, 1, 2, 3, 4]) {
        expect(computeDayPhase(h), `Hour ${h} should be night`).toBe('night');
      }
    });

    it('works correctly with getLocalHour with timezone offsets', () => {
      // 2026-05-15T00:30:00Z + 19800 seconds (Asia/Kolkata +5:30) = 06:00 local time -> day
      const localH = getLocalHour('2026-05-15T00:30:00Z', 19800);
      expect(localH).toBe(6);
      expect(computeDayPhase(localH)).toBe('day');
    });
  });

  describe('computeCelestialPosition', () => {
    it('computes sun arc during daytime (06:00 to 18:00)', () => {
      const posMorning = computeCelestialPosition(6, 'day');
      expect(posMorning.celestial).toBe('sun');
      expect(posMorning.sunXPct).toBeGreaterThanOrEqual(10);
      expect(posMorning.sunYPct).toBeGreaterThanOrEqual(20);

      const posNoon = computeCelestialPosition(12, 'day');
      expect(posNoon.celestial).toBe('sun');
      expect(posNoon.sunXPct).toBe(50);
      expect(posNoon.sunYPct).toBe(20);

      const posEvening = computeCelestialPosition(18, 'dusk');
      expect(posEvening.celestial).toBe('sun');
      expect(posEvening.sunXPct).toBeGreaterThan(50);
    });

    it('computes moon arc during night (19:00 to 05:00)', () => {
      const posMidnight = computeCelestialPosition(0, 'night');
      expect(posMidnight.celestial).toBe('moon');
      expect(posMidnight.sunXPct).toBeGreaterThan(10);
      expect(posMidnight.sunXPct).toBeLessThan(90);
    });
  });

  describe('computeDiscRingOpacity', () => {
    it('falls smoothly as level rises but never reaches 0 (always visible)', () => {
      const opacities = [0, 1, 2, 3, 4].map((lvl) =>
        computeDiscRingOpacity(lvl as 0 | 1 | 2 | 3 | 4, false),
      );
      expect(opacities).toEqual([0.85, 0.7, 0.55, 0.4, 0.25]);
      for (const op of opacities) {
        expect(op).toBeGreaterThan(0);
      }
    });

    it('returns neutral 0.75 when level is null or isNeutral is true', () => {
      expect(computeDiscRingOpacity(null, true)).toBe(0.75);
      expect(computeDiscRingOpacity(3, true)).toBe(0.75);
    });
  });

  describe('computeHazeOpacities', () => {
    it('returns exact opacities for levels 0 to 4', () => {
      expect(computeHazeOpacities(0, false)).toEqual([0, 0]);
      expect(computeHazeOpacities(1, false)).toEqual([0.15, 0.12]);
      expect(computeHazeOpacities(2, false)).toEqual([0.3, 0.24]);
      expect(computeHazeOpacities(3, false)).toEqual([0.45, 0.36]);
      expect(computeHazeOpacities(4, false)).toEqual([0.6, 0.48]);
    });

    it('returns [0, 0] when level is null or isNeutral is true', () => {
      expect(computeHazeOpacities(null, true)).toEqual([0, 0]);
      expect(computeHazeOpacities(3, true)).toEqual([0, 0]);
    });
  });

  describe('computeSpecks', () => {
    it('returns exact specks counts [0, 4, 8, 14, 22] for levels 0 to 4', () => {
      expect(computeSpecks(0, false).length).toBe(0);
      expect(computeSpecks(1, false).length).toBe(4);
      expect(computeSpecks(2, false).length).toBe(8);
      expect(computeSpecks(3, false).length).toBe(14);
      expect(computeSpecks(4, false).length).toBe(22);
    });

    it('keeps speck durations within 14 to 30 seconds', () => {
      const specks = computeSpecks(4, false);
      for (const speck of specks) {
        expect(speck.durationS).toBeGreaterThanOrEqual(14);
        expect(speck.durationS).toBeLessThanOrEqual(30);
      }
    });

    it('returns empty array when level is null or isNeutral is true', () => {
      expect(computeSpecks(null, true)).toEqual([]);
      expect(computeSpecks(3, true)).toEqual([]);
    });
  });

  describe('computeWindStreaks', () => {
    it('returns 0 streaks when wind is undefined or < 15 km/h', () => {
      expect(computeWindStreaks(undefined).length).toBe(0);
      expect(computeWindStreaks(10).length).toBe(0);
      expect(computeWindStreaks(14.9).length).toBe(0);
    });

    it('returns 1 streak for 15 to 24 km/h', () => {
      expect(computeWindStreaks(15).length).toBe(1);
      expect(computeWindStreaks(24).length).toBe(1);
    });

    it('returns 2 streaks for 25 to 39 km/h', () => {
      expect(computeWindStreaks(25).length).toBe(2);
      expect(computeWindStreaks(39).length).toBe(2);
    });

    it('returns 3 streaks for >= 40 km/h', () => {
      expect(computeWindStreaks(40).length).toBe(3);
      expect(computeWindStreaks(65).length).toBe(3);
    });

    it('scales duration inversely with wind speed', () => {
      const slow = computeWindStreaks(16)[0].durationS;
      const fast = computeWindStreaks(45)[0].durationS;
      expect(fast).toBeLessThan(slow);
    });
  });

  describe('computeAtmosphereModel', () => {
    it('produces a neutral sky tint and disc with no haze or specks when fallback is true', () => {
      const model = computeAtmosphereModel({
        level: 3,
        localHour: 12,
        isFallback: true,
        enabled: true,
      });

      expect(model.hazeBandOpacities).toEqual([0, 0]);
      expect(model.specks.length).toBe(0);
      expect(model.discRingOpacity).toBe(0.75);
      expect(model.isNeutral).toBe(true);
    });

    it('produces a neutral sky tint and disc with no haze or specks when level is null', () => {
      const model = computeAtmosphereModel({
        level: null,
        localHour: 12,
        enabled: true,
      });

      expect(model.hazeBandOpacities).toEqual([0, 0]);
      expect(model.specks.length).toBe(0);
      expect(model.discRingOpacity).toBe(0.75);
      expect(model.isNeutral).toBe(true);
    });

    it('respects enabled=false', () => {
      const model = computeAtmosphereModel({
        level: 3,
        localHour: 12,
        enabled: false,
      });

      expect(model.enabled).toBe(false);
    });

    it('generates fully populated model with active haze and specks under normal conditions', () => {
      const model = computeAtmosphereModel({
        level: 3,
        localHour: 10,
        windKmh: 20,
        enabled: true,
      });

      expect(model.enabled).toBe(true);
      expect(model.dayPhase).toBe('day');
      expect(model.celestial).toBe('sun');
      expect(model.hazeBandOpacities).toEqual([0.45, 0.36]);
      expect(model.specks.length).toBe(14);
      expect(model.windStreaks.length).toBe(1);
    });
  });
});
