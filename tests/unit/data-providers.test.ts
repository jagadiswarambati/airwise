import { describe, it, expect, beforeEach } from 'vitest';
import { parseOpenMeteoResponse, OpenMeteoAirResponse } from '../../src/data/providers/openMeteoAir';
import { airCache } from '../../src/data/cache';
import { getAirSnapshot, getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { buildTrustModel } from '../../src/data/trust';
import { Location } from '../../src/domain/types';

describe('Data Providers & Fallback Chain', () => {
  const testLocation: Location = {
    label: 'Hyderabad, India',
    lat: 17.38,
    lon: 78.48,
    country: 'IN',
  };

  beforeEach(() => {
    airCache.clear();
  });

  describe('Open-Meteo Parser', () => {
    it('parses valid API response into domain RawAirDataInput', () => {
      const mockApiData: OpenMeteoAirResponse = {
        latitude: 17.38,
        longitude: 78.48,
        current: {
          time: '2026-11-20T10:00:00Z',
          pm2_5: 42.5,
        },
        hourly: {
          time: ['2026-11-20T09:00:00Z', '2026-11-20T10:00:00Z'],
          pm2_5: [38.0, 42.5],
          us_aqi: [105, 118],
        },
      };

      const parsed = parseOpenMeteoResponse(mockApiData, '2026-11-20T10:00:00Z');

      expect(parsed.currentPm25).toBe(42.5);
      expect(parsed.hourly).toHaveLength(2);
      expect(parsed.hourly[0].pm25).toBe(38.0);
      expect(parsed.hourly[0].aqi).toBe(105);
      expect(parsed.source.id).toBe('open-meteo');
      expect(parsed.source.dataType).toBe('modelled');
    });
  });

  describe('Client Air Cache', () => {
    it('stores and retrieves snapshots within TTL', () => {
      const sample = getSampleScenarioSnapshot('clear');
      airCache.set(17.38, 78.48, sample);

      const retrieved = airCache.get(17.38, 78.48);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.pm25.now).toBe(sample.pm25.now);
    });

    it('returns null on cache miss', () => {
      expect(airCache.get(0, 0)).toBeNull();
    });
  });

  describe('Fallback Chain', () => {
    it('loads sample scenarios directly without network calls', async () => {
      const clearRes = await getAirSnapshot({ location: testLocation, scenario: 'clear' });
      expect(clearRes.sourceTier).toBe('sample');
      expect(clearRes.isFallback).toBe(false);
      expect(clearRes.snapshot.pm25.now).toBeLessThan(30);

      const severeRes = await getAirSnapshot({ location: testLocation, scenario: 'severe' });
      expect(severeRes.sourceTier).toBe('sample');
      expect(severeRes.snapshot.pm25.now).toBeGreaterThan(120);

      const staleRes = await getAirSnapshot({ location: testLocation, scenario: 'stale' });
      expect(staleRes.snapshot.freshness).toBe('stale');
    });

    it('falls back to cache or sample when live fetch fails', async () => {
      // Put a mock snapshot in cache
      const cachedSnapshot = getSampleScenarioSnapshot('moderate');
      airCache.set(testLocation.lat, testLocation.lon, cachedSnapshot);

      // In tests without active external network, live fetch fails and triggers cache fallback
      const result = await getAirSnapshot({ location: testLocation, scenario: 'live' });
      expect(result.snapshot).toBeDefined();
      expect(result.sourceTier).toBe('cached');
    });
  });

  describe('Trust Model', () => {
    it('builds a complete trust panel view model with transparent attribution', () => {
      const sampleSnapshot = getSampleScenarioSnapshot('moderate');
      const trust = buildTrustModel(
        sampleSnapshot,
        'medium',
        'Modelled forecast from atmospheric CAMS data',
        'sample',
        false,
      );

      expect(trust.sourceName).toBeDefined();
      expect(trust.dataTypeBadge).toBe('Demo data');
      expect(trust.freshnessBadge).toBe('Fresh');
      expect(trust.planConfidence).toBe('medium');
      expect(trust.attribution).toContain('Open-Meteo.com');
      expect(trust.attribution).toContain('Copernicus Atmosphere Monitoring Service');
      expect(trust.uncertaintyDisclaimer).toContain('not medical diagnosis');
    });

    it('marks stale data prominently in the trust model', () => {
      const staleSnapshot = getSampleScenarioSnapshot('stale');
      const trust = buildTrustModel(
        staleSnapshot,
        'low',
        'Confidence lowered due to stale data',
        'sample',
        true,
        'Feed disconnected',
      );

      expect(trust.freshnessBadge).toBe('Stale');
      expect(trust.isFallback).toBe(true);
      expect(trust.fallbackReason).toBe('Feed disconnected');
      expect(trust.freshnessNote).toContain('12 hours old');
    });
  });
});
