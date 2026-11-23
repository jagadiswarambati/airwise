import { describe, it, expect } from 'vitest';
import { determineFreshness } from '../../src/domain/freshness';
import { HourlyPoint } from '../../src/domain/types';

describe('Data Freshness Engine', () => {
  const baseTime = new Date('2026-11-20T12:00:00Z');
  const sampleHourly: HourlyPoint[] = [
    { time: '2026-11-20T11:00:00Z', pm25: 45 },
    { time: '2026-11-20T12:00:00Z', pm25: 50 },
    { time: '2026-11-20T13:00:00Z', pm25: 55 },
  ];

  it('identifies fresh data (<= 3 hours old)', () => {
    const fetchedAt = new Date(baseTime.getTime() - 2 * 3600 * 1000).toISOString(); // 2 hours old
    expect(determineFreshness(fetchedAt, sampleHourly, baseTime)).toBe('fresh');
  });

  it('identifies aging data (> 3 hours and <= 12 hours old)', () => {
    const fetchedAt = new Date(baseTime.getTime() - 5 * 3600 * 1000).toISOString(); // 5 hours old
    expect(determineFreshness(fetchedAt, sampleHourly, baseTime)).toBe('aging');
  });

  it('identifies stale data (> 12 hours and <= 48 hours old)', () => {
    const fetchedAt = new Date(baseTime.getTime() - 18 * 3600 * 1000).toISOString(); // 18 hours old
    expect(determineFreshness(fetchedAt, sampleHourly, baseTime)).toBe('stale');
  });

  it('returns none if data is older than 48 hours', () => {
    const fetchedAt = new Date(baseTime.getTime() - 50 * 3600 * 1000).toISOString(); // 50 hours old
    expect(determineFreshness(fetchedAt, sampleHourly, baseTime)).toBe('none');
  });

  it('handles missing, null, or malformed fetchedAt timestamp', () => {
    expect(determineFreshness(null, sampleHourly, baseTime)).toBe('none');
    expect(determineFreshness(undefined, sampleHourly, baseTime)).toBe('none');
    expect(determineFreshness('invalid-date', sampleHourly, baseTime)).toBe('none');
  });

  it('handles future timestamp skew gracefully', () => {
    // 5 hours into the future (severe clock skew) -> none
    const futureTime = new Date(baseTime.getTime() + 5 * 3600 * 1000).toISOString();
    expect(determineFreshness(futureTime, sampleHourly, baseTime)).toBe('none');
  });
});
