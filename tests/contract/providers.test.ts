import { describe, it, expect } from 'vitest';
import {
  parseApiAirResponse,
  type ApiAirResponse,
  OPEN_METEO_ATTRIBUTION,
} from '../../src/data/providers/apiAir';
import { normalizeAirQuality } from '../../src/domain/normalization';
import { buildTrustModel } from '../../src/data/trust';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';

describe('Data Provider Contract Tests - /api/air & Fallback Chain', () => {
  const validFixture: ApiAirResponse = {
    currentPm25: 64.5,
    hourly: [
      { time: '2026-11-21T00:00:00Z', pm25: 42.1, aqi: 118 },
      { time: '2026-11-21T01:00:00Z', pm25: 55.3, aqi: 151 },
      { time: '2026-11-21T02:00:00Z', pm25: 68.9, aqi: 158 },
    ],
    weather: {
      windSpeed10m: 12.0,
      hourly: [
        {
          time: '2026-11-21T00:00:00Z',
          windSpeed10m: 10.0,
        },
      ],
      daylight: {
        sunrise: '2026-11-21T06:30:00Z',
        sunset: '2026-11-21T17:45:00Z',
      },
    },
    daylight: {
      sunrise: '2026-11-21T06:30:00Z',
      sunset: '2026-11-21T17:45:00Z',
    },
    timezone: 'Asia/Kolkata',
    utcOffsetSeconds: 19800,
    observedAt: '2026-11-21T10:00:00Z',
    fetchedAt: '2026-11-21T10:00:00Z',
    source: {
      id: 'open-meteo',
      name: 'Open-Meteo (CAMS & Forecast)',
      dataType: 'modelled',
      resolutionNote: 'Modelled CAMS atmospheric forecast (~25 km spatial resolution).',
      attribution: OPEN_METEO_ATTRIBUTION,
    },
  };

  it('parses valid /api/air response into domain RawAirDataInput', () => {
    const raw = parseApiAirResponse(validFixture, '2026-11-21T10:05:00Z');

    expect(raw.currentPm25).toBe(64.5);
    expect(raw.hourly).toHaveLength(3);
    expect(raw.hourly[0]).toEqual({
      time: '2026-11-21T00:00:00Z',
      pm25: 42.1,
      aqi: 118,
    });
    expect(raw.source.id).toBe('open-meteo');
    expect(raw.source.dataType).toBe('modelled');
    expect(raw.source.attribution).toBe(OPEN_METEO_ATTRIBUTION);

    // Normalization should succeed
    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.now).toBe(64.5);
    expect(snapshot.source.dataType).toBe('modelled');
  });

  it('handles null or missing current pm2_5 gracefully', () => {
    const fixtureMissingCurrent: ApiAirResponse = {
      currentPm25: null,
      hourly: [{ time: '2026-11-21T00:00:00Z', pm25: 50, aqi: 130 }],
      timezone: 'UTC',
      utcOffsetSeconds: 0,
      observedAt: '2026-11-21T10:00:00Z',
      fetchedAt: '2026-11-21T10:00:00Z',
      source: {
        id: 'open-meteo',
        name: 'Open-Meteo',
        dataType: 'modelled',
        resolutionNote: 'note',
        attribution: OPEN_METEO_ATTRIBUTION,
      },
    };

    const raw = parseApiAirResponse(fixtureMissingCurrent);
    expect(raw.currentPm25).toBeNull();

    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.now).toBeNull();
    expect(snapshot.pm25.hourly).toHaveLength(1);
  });

  it('handles sparse hourly arrays with gaps and null values', () => {
    const fixtureGaps: ApiAirResponse = {
      currentPm25: 35.0,
      hourly: [
        { time: '2026-11-21T00:00:00Z', pm25: 30.0, aqi: 80 },
        { time: '2026-11-21T01:00:00Z', pm25: null, aqi: null },
        { time: '2026-11-21T02:00:00Z', pm25: 40.0, aqi: 100 },
      ],
      timezone: 'UTC',
      utcOffsetSeconds: 0,
      observedAt: '2026-11-21T10:00:00Z',
      fetchedAt: '2026-11-21T10:00:00Z',
      source: {
        id: 'open-meteo',
        name: 'Open-Meteo',
        dataType: 'modelled',
        resolutionNote: 'note',
        attribution: OPEN_METEO_ATTRIBUTION,
      },
    };

    const raw = parseApiAirResponse(fixtureGaps);
    expect(raw.hourly[1].pm25).toBeNull();

    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.hourly[1].pm25).toBeNull();
    expect(snapshot.pm25.hourly[0].pm25).toBe(30.0);
    expect(snapshot.pm25.hourly[2].pm25).toBe(40.0);
  });

  it('handles empty or missing hourly block without throwing', () => {
    const fixtureNoHourly: ApiAirResponse = {
      currentPm25: 22.0,
      hourly: [],
      timezone: 'UTC',
      utcOffsetSeconds: 0,
      observedAt: '2026-11-21T10:00:00Z',
      fetchedAt: '2026-11-21T10:00:00Z',
      source: {
        id: 'open-meteo',
        name: 'Open-Meteo',
        dataType: 'modelled',
        resolutionNote: 'note',
        attribution: OPEN_METEO_ATTRIBUTION,
      },
    };

    const raw = parseApiAirResponse(fixtureNoHourly);
    expect(raw.hourly).toHaveLength(0);

    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.now).toBe(22.0);
    expect(snapshot.pm25.hourly).toHaveLength(0);
  });

  it('handles schema drift with extra unexpected fields gracefully', () => {
    const fixtureDrift = {
      currentPm25: 55.0,
      hourly: [{ time: '2026-11-21T00:00:00Z', pm25: 55.0 }],
      timezone: 'Asia/Kolkata',
      utcOffsetSeconds: 19800,
      observedAt: '2026-11-21T10:00:00Z',
      fetchedAt: '2026-11-21T10:00:00Z',
      extraField: 'unknown_vendor_data',
      experimentalMetrics: { co: 1.2, no2: 45 },
      source: {
        id: 'open-meteo',
        name: 'Open-Meteo',
        dataType: 'modelled',
        resolutionNote: 'note',
        attribution: OPEN_METEO_ATTRIBUTION,
      },
    } as unknown as ApiAirResponse;

    const raw = parseApiAirResponse(fixtureDrift);
    expect(raw.currentPm25).toBe(55.0);
    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.now).toBe(55.0);
  });

  it('trust model contracts hold across live, cached, and sample tiers', () => {
    const liveSnapshot = getSampleScenarioSnapshot('moderate');
    const liveTrust = buildTrustModel(
      liveSnapshot,
      'high',
      'Fresh modelled forecast',
      'live',
      false,
    );
    expect(liveTrust.sourceTier).toBe('live');
    expect(liveTrust.isFallback).toBe(false);

    const cachedTrust = buildTrustModel(
      liveSnapshot,
      'medium',
      'Cached forecast',
      'cached',
      true,
      'Network timeout; loaded cached forecast.',
    );
    expect(cachedTrust.sourceTier).toBe('cached');
    expect(cachedTrust.isFallback).toBe(true);
    expect(cachedTrust.fallbackReason).toContain('Network timeout');

    const sampleTrust = buildTrustModel(
      liveSnapshot,
      'medium',
      'Demo scenario selected',
      'sample',
      true,
      'Demo scenario selected.',
    );
    expect(sampleTrust.sourceTier).toBe('sample');
    expect(sampleTrust.dataTypeBadge).toBe('Demo data');
  });
});
