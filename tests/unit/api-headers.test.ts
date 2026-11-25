import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getSecurityHeaders } from '../../api/_lib/headers';
import { createErrorResponse } from '../../api/_lib/errors';
import { handlePlanCore } from '../../api/plan';
import { handleAirCore } from '../../api/air';
import { handleGeocodeCore } from '../../api/geocode';
import { handleHealthCore } from '../../api/health';

describe('Security Headers Verification (vercel.json vs api/_lib/headers.ts)', () => {
  const vercelPath = path.resolve(__dirname, '../../vercel.json');

  it('exists and has valid JSON structure', () => {
    expect(fs.existsSync(vercelPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    expect(content.headers).toBeDefined();
    expect(Array.isArray(content.headers)).toBe(true);
  });

  it('matches all mandatory security headers specified in vercel.json', () => {
    const config = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    const allRoutesRule = config.headers.find(
      (h: { source: string; headers: Array<{ key: string; value: string }> }) =>
        h.source === '/(.*)' || h.source === '/(.*)?',
    );
    expect(allRoutesRule).toBeDefined();

    const headersMap: Record<string, string> = {};
    for (const h of allRoutesRule.headers) {
      headersMap[h.key] = h.value;
    }

    // 1. Content-Security-Policy
    expect(headersMap['Content-Security-Policy']).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
    );

    // 2. X-Content-Type-Options
    expect(headersMap['X-Content-Type-Options']).toBe('nosniff');

    // 3. X-Frame-Options
    expect(headersMap['X-Frame-Options']).toBe('DENY');

    // 4. Referrer-Policy
    expect(headersMap['Referrer-Policy']).toBe('no-referrer');

    // 5. Permissions-Policy
    expect(headersMap['Permissions-Policy']).toBe(
      'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=(), bluetooth=(), serial=()',
    );

    // 6. Cross-Origin-Opener-Policy
    expect(headersMap['Cross-Origin-Opener-Policy']).toBe('same-origin');

    // 7. Cross-Origin-Resource-Policy
    expect(headersMap['Cross-Origin-Resource-Policy']).toBe('same-origin');

    // 8. Strict-Transport-Security
    expect(headersMap['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
  });

  it('keeps api/_lib/headers.ts identical to vercel.json headers', () => {
    const config = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    const allRoutesRule = config.headers.find(
      (h: { source: string; headers: Array<{ key: string; value: string }> }) =>
        h.source === '/(.*)' || h.source === '/(.*)?',
    );
    const vercelHeadersMap: Record<string, string> = {};
    for (const h of allRoutesRule.headers) {
      vercelHeadersMap[h.key] = h.value;
    }

    const apiHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(vercelHeadersMap)) {
      expect(apiHeaders[key]).toBe(value);
    }
    expect(Object.keys(apiHeaders).length).toBe(Object.keys(vercelHeadersMap).length);
  });

  it('attaches Cache-Control: no-store to every API error response', () => {
    const err = createErrorResponse(400, 'ValidationError', 'Bad test request');
    expect(err.headers['Cache-Control']).toBe('no-store');
  });

  it('attaches Cache-Control: no-store to /api/plan responses', async () => {
    const res = await handlePlanCore(
      JSON.stringify({
        effectiveLevel: 2,
        trend: 'rising',
        timeSlots: [],
        riskRadar: { ageGroupRoles: [], vulnerableSlots: [] },
        approvedCandidateIds: ['IN-01'],
        mustIncludeIds: ['IN-01'],
        forbiddenActionIds: [],
        budgetTier: 'free',
        householdDescriptors: {
          hasChildren: false,
          hasElderly: false,
          hasRespiratoryCondition: false,
          hasCardiacCondition: false,
          hasAirPurifier: false,
          heatingType: 'none',
        },
        confidenceCeiling: 'full',
      }),
      { 'content-type': 'application/json' },
      'POST',
    );

    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('attaches Cache-Control: no-store to /api/health responses', async () => {
    const res = await handleHealthCore();
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('preserves documented public caching on successful /api/air and /api/geocode responses', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('air-quality')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              current: { time: '2026-11-25T10:00:00Z', pm2_5: 25 },
              hourly: { time: ['2026-11-25T10:00:00Z'], pm2_5: [25], us_aqi: [75] },
              timezone: 'Asia/Kolkata',
              utc_offset_seconds: 19800,
            }),
        });
      }
      if (url.includes('forecast')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              daily: { sunrise: ['2026-11-25T06:00:00Z'], sunset: ['2026-11-25T18:00:00Z'] },
              hourly: { time: ['2026-11-25T10:00:00Z'], temperature_2m: [24] },
            }),
        });
      }
      if (url.includes('geocoding-api')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  name: 'Delhi',
                  admin1: 'Delhi',
                  country_code: 'IN',
                  latitude: 28.61,
                  longitude: 77.23,
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    vi.stubGlobal('fetch', mockFetch);

    const airRes = await handleAirCore({ lat: '28.61', lon: '77.23' });
    expect(airRes.status).toBe(200);
    expect(airRes.headers['Cache-Control']).toBe('public, max-age=600, stale-while-revalidate=300');

    const geoRes = await handleGeocodeCore({ q: 'Delhi' });
    expect(geoRes.status).toBe(200);
    expect(geoRes.headers['Cache-Control']).toBe(
      'public, max-age=86400, stale-while-revalidate=86400',
    );

    vi.unstubAllGlobals();
  });
});
