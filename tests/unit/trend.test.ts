import { describe, it, expect } from 'vitest';
import { calculateTrend } from '../../src/domain/trend';
import { HourlyPoint } from '../../src/domain/types';

describe('Trend Engine', () => {
  it('detects rising trend when concentration increases by >= 5 µg/m³ and >= 10%', () => {
    const series: HourlyPoint[] = [
      { time: '2026-11-20T08:00:00Z', pm25: 40 },
      { time: '2026-11-20T09:00:00Z', pm25: 42 },
      { time: '2026-11-20T10:00:00Z', pm25: 45 },
      { time: '2026-11-20T11:00:00Z', pm25: 55 },
      { time: '2026-11-20T12:00:00Z', pm25: 60 },
      { time: '2026-11-20T13:00:00Z', pm25: 65 },
    ];

    expect(calculateTrend(series)).toBe('rising');
  });

  it('detects falling trend when concentration decreases by >= 5 µg/m³ and >= 10%', () => {
    const series: HourlyPoint[] = [
      { time: '2026-11-20T08:00:00Z', pm25: 80 },
      { time: '2026-11-20T09:00:00Z', pm25: 78 },
      { time: '2026-11-20T10:00:00Z', pm25: 70 },
      { time: '2026-11-20T11:00:00Z', pm25: 55 },
      { time: '2026-11-20T12:00:00Z', pm25: 48 },
      { time: '2026-11-20T13:00:00Z', pm25: 40 },
    ];

    expect(calculateTrend(series)).toBe('falling');
  });

  it('detects steady trend when variation is within +/- 10%', () => {
    const series: HourlyPoint[] = [
      { time: '2026-11-20T08:00:00Z', pm25: 50 },
      { time: '2026-11-20T09:00:00Z', pm25: 51 },
      { time: '2026-11-20T10:00:00Z', pm25: 49 },
      { time: '2026-11-20T11:00:00Z', pm25: 52 },
      { time: '2026-11-20T12:00:00Z', pm25: 50 },
      { time: '2026-11-20T13:00:00Z', pm25: 51 },
    ];

    expect(calculateTrend(series)).toBe('steady');
  });

  it('returns unknown if fewer than 2 valid points exist', () => {
    expect(calculateTrend([])).toBe('unknown');
    expect(calculateTrend([{ time: '2026-11-20T08:00:00Z', pm25: 50 }])).toBe('unknown');
    expect(
      calculateTrend([
        { time: '2026-11-20T08:00:00Z', pm25: null },
        { time: '2026-11-20T09:00:00Z', pm25: null },
      ]),
    ).toBe('unknown');
  });
});

