import { describe, it, expect } from 'vitest';
import { normalizeAirQuality, computeAqiFromPm25 } from '../../src/domain/normalization';

describe('Air Quality Normalization', () => {
  it('treats PM2.5 in µg/m³ as the primary signal and computes AQI as secondary', () => {
    const rawInput = {
      currentPm25: 45.2,
      hourly: [
        { time: '2026-11-20T10:00:00Z', pm25: 45.2, aqi: null },
        { time: '2026-11-20T11:00:00Z', pm25: 48.0, aqi: null },
      ],
      observedAt: '2026-11-20T10:00:00Z',
      fetchedAt: new Date().toISOString(),
      source: {
        id: 'open-meteo',
        name: 'Open-Meteo',
        dataType: 'modelled' as const,
        resolutionNote: '25km global CAMS',
      },
    };

    const snapshot = normalizeAirQuality(rawInput);

    expect(snapshot.pm25.now).toBe(45.2);
    expect(snapshot.source.dataType).toBe('modelled');
    expect(snapshot.source.id).toBe('open-meteo');
    expect(snapshot.aqi).toBeDefined();
    expect(snapshot.aqi?.isComputed).toBe(true);
    expect(snapshot.aqi?.standard).toBe('IN');
    // 45.2 µg/m³ in CPCB scale is in 31–60 band (AQI 51–100)
    expect(snapshot.aqi?.value).toBeGreaterThanOrEqual(51);
    expect(snapshot.aqi?.value).toBeLessThanOrEqual(100);
  });

  it('correctly interpolates Indian CPCB AQI across breakpoints', () => {
    // 0 µg/m³ -> 0 AQI
    expect(computeAqiFromPm25(0, 'IN').value).toBe(0);
    // 30 µg/m³ (edge of Good) -> 50 AQI
    expect(computeAqiFromPm25(30, 'IN').value).toBe(50);
    // 60 µg/m³ (edge of Satisfactory) -> 100 AQI
    expect(computeAqiFromPm25(60, 'IN').value).toBe(100);
    // 90 µg/m³ (edge of Moderate) -> 200 AQI
    expect(computeAqiFromPm25(90, 'IN').value).toBe(200);
    // 120 µg/m³ (edge of Poor) -> 300 AQI
    expect(computeAqiFromPm25(120, 'IN').value).toBe(300);
    // 250 µg/m³ (edge of Very Poor) -> 400 AQI
    expect(computeAqiFromPm25(250, 'IN').value).toBe(400);
  });

  it('correctly interpolates US EPA AQI across 2024 breakpoints', () => {
    // 9.0 µg/m³ -> 50 AQI
    expect(computeAqiFromPm25(9.0, 'US').value).toBe(50);
    // 35.4 µg/m³ -> 100 AQI
    expect(computeAqiFromPm25(35.4, 'US').value).toBe(100);
    // 55.4 µg/m³ -> 150 AQI
    expect(computeAqiFromPm25(55.4, 'US').value).toBe(150);
    // 125.4 µg/m³ -> 200 AQI
    expect(computeAqiFromPm25(125.4, 'US').value).toBe(200);
  });

  it('handles missing, null, and negative sensor values gracefully', () => {
    const rawInput = {
      currentPm25: null,
      hourly: [
        { time: '2026-11-20T10:00:00Z', pm25: null },
        { time: '2026-11-20T11:00:00Z', pm25: -5.0 }, // negative sensor glitch
      ],
      observedAt: '2026-11-20T10:00:00Z',
      fetchedAt: new Date().toISOString(),
      source: {
        id: 'test',
        name: 'Test Sensor',
        dataType: 'observed' as const,
        resolutionNote: 'local monitor',
      },
    };

    const snapshot = normalizeAirQuality(rawInput);
    expect(snapshot.pm25.now).toBeNull();
    // Negative glitch clamped to 0
    expect(snapshot.pm25.hourly[1].pm25).toBe(0);
    expect(snapshot.aqi).toBeUndefined();
  });
});
