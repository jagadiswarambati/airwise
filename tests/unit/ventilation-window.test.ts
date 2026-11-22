import { describe, expect, it } from 'vitest';
import { decideVentilation } from '../../src/domain/ventilation';
import { AirSnapshot, TimeSlot } from '../../src/domain/types';

describe('Ventilation Decision Engine: Window Qualification & Band Thresholds', () => {
  const baseSlots: TimeSlot[] = [
    {
      id: 'early-morning',
      label: 'Early Morning',
      startTime: '06:00',
      endTime: '07:30',
      forecastMeanPm25: 45,
      forecastLevel: 1, // Qualified level <= 1
      outdoorActivity: 'none',
    },
    {
      id: 'commute-out',
      label: 'Morning Commute',
      startTime: '07:30',
      endTime: '08:15',
      forecastMeanPm25: 75,
      forecastLevel: 2,
      outdoorActivity: 'commute',
    },
    {
      id: 'daytime',
      label: 'Daytime',
      startTime: '08:15',
      endTime: '17:00',
      forecastMeanPm25: 80,
      forecastLevel: 2,
      outdoorActivity: 'none',
    },
  ];

  it('selects brief ventilation when cleanest hour falls within a qualified slot (containing window)', () => {
    const snapshot: AirSnapshot = {
      pm25: {
        now: 70, // Base level 2 (Caution)
        hourly: [
          { time: '2026-11-20T06:00:00', pm25: 45 }, // Hour 6 is within early-morning (06:00 - 07:30)
          { time: '2026-11-20T08:00:00', pm25: 80 },
          { time: '2026-11-20T12:00:00', pm25: 85 },
        ],
      },
      trend: 'steady',
      observedAt: '2026-11-20T06:00:00',
      fetchedAt: '2026-11-20T06:00:00',
      source: {
        id: 'test',
        name: 'Test',
        dataType: 'modelled',
        resolutionNote: 'test',
      },
      freshness: 'fresh',
      utcOffsetSeconds: 19800,
    };

    const decision = decideVentilation({
      snapshot,
      effectiveLevel: 2,
      slots: baseSlots,
      targetRegion: 'IN',
    });

    expect(decision.verdict).toBe('brief');
    expect(decision.atHour).toBe(6);
    expect(decision.explanation).toContain('6:00');
    expect(decision.explanation).toContain('Early Morning');
  });

  it('rejects brief ventilation if the slot containing the cleanest hour is NOT level <= 1', () => {
    // Cleanest hour is 12:00 (PM2.5 = 50), which is in daytime slot (level 2)
    const snapshot: AirSnapshot = {
      pm25: {
        now: 75,
        hourly: [
          { time: '2026-11-20T06:00:00', pm25: 65 }, // Hour 6 in early-morning is 65 (not cleanest)
          { time: '2026-11-20T12:00:00', pm25: 50 }, // Hour 12 in daytime is cleanest, but daytime slot is level 2
        ],
      },
      trend: 'steady',
      observedAt: '2026-11-20T06:00:00',
      fetchedAt: '2026-11-20T06:00:00',
      source: {
        id: 'test',
        name: 'Test',
        dataType: 'modelled',
        resolutionNote: 'test',
      },
      freshness: 'fresh',
      utcOffsetSeconds: 19800,
    };

    const decision = decideVentilation({
      snapshot,
      effectiveLevel: 2,
      slots: baseSlots,
      targetRegion: 'IN',
    });

    // Even though early-morning is level 1, cleanest hour 12 falls in daytime (level 2),
    // so verdict must be closed
    expect(decision.verdict).toBe('closed');
    expect(decision.reasonCode).toBe('CAUTION_NO_CLEAN_WINDOW');
  });

  it('enforces US EPA threshold (35.4 µg/m³) vs India threshold (60 µg/m³)', () => {
    // Hour 6 has PM2.5 = 45 µg/m³
    // Under India bands: 45 <= 60 (qualifies for brief window)
    // Under US EPA bands: 45 > 35.4 (fails qualification)
    const snapshot: AirSnapshot = {
      pm25: {
        now: 45,
        hourly: [{ time: '2026-11-20T06:00:00', pm25: 45 }],
      },
      trend: 'steady',
      observedAt: '2026-11-20T06:00:00',
      fetchedAt: '2026-11-20T06:00:00',
      source: {
        id: 'test',
        name: 'Test',
        dataType: 'modelled',
        resolutionNote: 'test',
      },
      freshness: 'fresh',
      utcOffsetSeconds: 19800,
    };

    const slotsWithCleanSlot: TimeSlot[] = [
      {
        id: 'early-morning',
        label: 'Early Morning',
        startTime: '06:00',
        endTime: '07:30',
        forecastMeanPm25: 45,
        forecastLevel: 1,
        outdoorActivity: 'none',
      },
    ];

    const decisionIN = decideVentilation({
      snapshot,
      effectiveLevel: 2,
      slots: slotsWithCleanSlot,
      targetRegion: 'IN',
    });
    expect(decisionIN.verdict).toBe('brief');

    const decisionUS = decideVentilation({
      snapshot,
      effectiveLevel: 2,
      slots: slotsWithCleanSlot,
      targetRegion: 'US',
    });
    expect(decisionUS.verdict).toBe('closed');
  });
});
