import { describe, it, expect } from 'vitest';
import {
  parseOpenMeteoResponse,
  OpenMeteoAirResponse,
  OPEN_METEO_ATTRIBUTION,
} from '../../src/data/providers/openMeteoAir';
import { normalizeAirQuality } from '../../src/domain/normalization';
import { buildTrustModel } from '../../src/data/trust';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';

describe('Data Provider Contract Tests - Open-Meteo & Fallback Chain', () => {
  const validFixture: OpenMeteoAirResponse = {
    latitude: 28.61,
    longitude: 77.23,
    timezone: 'Asia/Kolkata',
    current: {
      time: '2026-11-21T10:00:00Z',
      pm2_5: 64.5,
    },
    hourly: {
      time: [
        '2026-11-21T00:00:00Z',
        '2026-11-21T01:00:00Z',
        '2026-11-21T02:00:00Z',
      ],
      pm2_5: [42.1, 55.3, 68.9],
      us_aqi: [118, 151, 158],
      european_aqi: [3, 4, 4],
    },
  };

  it('parses valid Open-Meteo response into domain RawAirDataInput', () => {
    const raw = parseOpenMeteoResponse(validFixture, '2026-11-21T10:05:00Z');

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
    const fixtureMissingCurrent: OpenMeteoAirResponse = {
      latitude: 28.61,
      longitude: 77.23,
      current: {
        time: '2026-11-21T10:00:00Z',
        pm2_5: null,
      },
      hourly: {
        time: ['2026-11-21T00:00:00Z'],
        pm2_5: [50],
      },
    };

    const raw = parseOpenMeteoResponse(fixtureMissingCurrent);
    expect(raw.currentPm25).toBeNull();

    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.now).toBeNull();
    expect(snapshot.pm25.hourly).toHaveLength(1);
  });

  it('handles sparse hourly arrays with gaps and null values', () => {
    const fixtureGaps: OpenMeteoAirResponse = {
      latitude: 28.61,
      longitude: 77.23,
      current: { time: '2026-11-21T10:00:00Z', pm2_5: 35.0 },
      hourly: {
        time: [
          '2026-11-21T00:00:00Z',
          '2026-11-21T01:00:00Z',
          '2026-11-21T02:00:00Z',
        ],
        pm2_5: [30.0, null, 40.0],
      },
    };

    const raw = parseOpenMeteoResponse(fixtureGaps);
    expect(raw.hourly[1].pm25).toBeNull();

    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.hourly[1].pm25).toBeNull();
    expect(snapshot.pm25.hourly[0].pm25).toBe(30.0);
    expect(snapshot.pm25.hourly[2].pm25).toBe(40.0);
  });

  it('handles empty or missing hourly block without throwing', () => {
    const fixtureNoHourly: OpenMeteoAirResponse = {
      latitude: 28.61,
      longitude: 77.23,
      current: { time: '2026-11-21T10:00:00Z', pm2_5: 22.0 },
    };

    const raw = parseOpenMeteoResponse(fixtureNoHourly);
    expect(raw.hourly).toHaveLength(0);

    const snapshot = normalizeAirQuality(raw, new Date(), 'IN');
    expect(snapshot.pm25.now).toBe(22.0);
    expect(snapshot.pm25.hourly).toHaveLength(0);
  });

  it('handles schema drift with extra unexpected fields gracefully', () => {
    const fixtureDrift = {
      latitude: 28.61,
      longitude: 77.23,
      extraField: 'unknown_vendor_data',
      experimentalMetrics: { co: 1.2, no2: 45 },
      current: {
        time: '2026-11-21T10:00:00Z',
        pm2_5: 55.0,
      },
      hourly: {
        time: ['2026-11-21T00:00:00Z'],
        pm2_5: [55.0],
      },
    } as unknown as OpenMeteoAirResponse;

    const raw = parseOpenMeteoResponse(fixtureDrift);
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
