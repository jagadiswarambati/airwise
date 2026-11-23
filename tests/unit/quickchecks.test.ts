import { describe, it, expect } from 'vitest';
import {
  checkChildPlayOutside,
  checkOpenWindow,
  checkRunPurifier,
  checkWalkToSchoolOrWork,
  evaluateQuickChecks,
} from '../../src/domain/quickchecks';
import { PRIYA_PROFILE, HEALTHY_ADULT_PROFILE, createSnapshot } from '../fixtures/sample-profiles';

describe('Quick Checks Engine', () => {
  describe('Can my child play outside?', () => {
    it('returns Yes during clean air conditions (level 0)', () => {
      const snapshot = createSnapshot(20);
      const res = checkChildPlayOutside(PRIYA_PROFILE, snapshot, 0);
      expect(res.verdict).toBe('Yes');
      expect(res.reasonCode).toBe('CLEAN_AIR_SAFE_OUTDOORS');
    });

    it('returns No during Caution or Severe conditions (level >= 2)', () => {
      const snapshot = createSnapshot(75);
      const res = checkChildPlayOutside(PRIYA_PROFILE, snapshot, 2);
      expect(res.verdict).toBe('No');
      expect(res.answer).toContain('Shift active play and exercise indoors');
    });

    it('returns No when data is stale', () => {
      const staleSnapshot = createSnapshot(20, 'stale');
      const res = checkChildPlayOutside(PRIYA_PROFILE, staleSnapshot, 0);
      expect(res.verdict).toBe('No');
      expect(res.reasonCode).toBe('STALE_DATA_CAUTION');
    });
  });

  describe('Should I open a window?', () => {
    it('returns Yes when air is clean (level 0/1)', () => {
      const snapshot = createSnapshot(25);
      const res = checkOpenWindow(PRIYA_PROFILE, snapshot, 0);
      expect(res.verdict).toBe('Yes');
    });

    it('returns No when pollution is high (level >= 3)', () => {
      const snapshot = createSnapshot(100);
      const res = checkOpenWindow(PRIYA_PROFILE, snapshot, 3);
      expect(res.verdict).toBe('No');
      expect(res.answer).toContain('closed');
    });
  });

  describe('Can I walk to school or work?', () => {
    it('returns Yes during clean air (level 0/1)', () => {
      const snapshot = createSnapshot(25);
      const res = checkWalkToSchoolOrWork(snapshot, 0);
      expect(res.verdict).toBe('Yes');
    });

    it('returns With precautions during Caution air (level 2)', () => {
      const snapshot = createSnapshot(75);
      const res = checkWalkToSchoolOrWork(snapshot, 2);
      expect(res.verdict).toBe('With precautions');
      expect(res.answer).toContain('N95 respirator');
    });

    it('returns No during Severe air (level 4)', () => {
      const snapshot = createSnapshot(150);
      const res = checkWalkToSchoolOrWork(snapshot, 4);
      expect(res.verdict).toBe('No');
    });
  });

  describe('Should I run my purifier?', () => {
    it('guides non-purifier households towards cleaner-room alternatives', () => {
      // Priya has no purifier
      const res = checkRunPurifier(PRIYA_PROFILE, 3);
      expect(res.verdict).toBe('No');
      expect(res.answer).toContain('no purifier');
      expect(res.answer).toContain('cleaner bedroom');
    });

    it('instructs purifier households to run it continuously during poor air', () => {
      // Adult has a purifier
      const res = checkRunPurifier(HEALTHY_ADULT_PROFILE, 3);
      expect(res.verdict).toBe('Yes');
      expect(res.answer).toContain('continuously');
    });
  });

  it('runs all quick checks together via evaluateQuickChecks', () => {
    const snapshot = createSnapshot(80);
    const results = evaluateQuickChecks(PRIYA_PROFILE, snapshot);
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.question)).toEqual([
      'Can my child play outside?',
      'Should I open a window?',
      'Can I walk to school or work?',
      'Should I run my purifier?',
    ]);
  });
});
