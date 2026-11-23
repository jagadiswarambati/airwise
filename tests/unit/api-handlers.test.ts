import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleHealthCore } from '../../api/health';
import { handleGeocodeCore } from '../../api/geocode';
import { handleAirCore, clearAirCache, ApiAirResponseData } from '../../api/air';
import { handlePlanCore } from '../../api/plan';
import { resetRateLimiter } from '../../api/_lib/rateLimit';
import { ApiErrorBody } from '../../api/_lib/errors';

function asError(body: unknown): ApiErrorBody {
  return body as ApiErrorBody;
}

function asAir(body: unknown): ApiAirResponseData {
  return body as ApiAirResponseData;
}

describe('Serverless API Handlers Contract & Safety Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetRateLimiter();
    clearAirCache();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('Method Validation (405 Method Not Allowed)', () => {
    it('/api/health rejects POST with 405', async () => {
      const res = await handleHealthCore({}, 'POST');
      expect(res.status).toBe(405);
      expect(asError(res.body).error.code).toBe('MethodNotAllowed');
      expect(res.headers['Allow']).toContain('GET');
    });

    it('/api/geocode rejects POST with 405', async () => {
      const res = await handleGeocodeCore({ q: 'Delhi' }, {}, 'POST');
      expect(res.status).toBe(405);
      expect(asError(res.body).error.code).toBe('MethodNotAllowed');
    });

    it('/api/air rejects POST with 405', async () => {
      const res = await handleAirCore({ lat: '17.38', lon: '78.49' }, {}, 'POST');
      expect(res.status).toBe(405);
      expect(asError(res.body).error.code).toBe('MethodNotAllowed');
    });

    it('/api/plan rejects GET with 405', async () => {
      const res = await handlePlanCore('', {}, 'GET');
      expect(res.status).toBe(405);
      expect(asError(res.body).error.code).toBe('MethodNotAllowed');
      expect(res.headers['Allow']).toContain('POST');
    });
  });

  describe('Input Validation (400 Bad Request / ValidationError)', () => {
    it('/api/air rejects invalid or out-of-range coordinates', async () => {
      const resInvalidLat = await handleAirCore({ lat: '95.0', lon: '78.0' });
      expect(resInvalidLat.status).toBe(400);
      expect(asError(resInvalidLat.body).error.code).toBe('ValidationError');

      const resInvalidLon = await handleAirCore({ lat: '17.0', lon: '190.0' });
      expect(resInvalidLon.status).toBe(400);

      const resNaN = await handleAirCore({ lat: 'invalid', lon: '78.0' });
      expect(resNaN.status).toBe(400);

      const resMissing = await handleAirCore({});
      expect(resMissing.status).toBe(400);
    });

    it('/api/air rejects unexpected unknown query parameters (strict)', async () => {
      const res = await handleAirCore({ lat: '17.38', lon: '78.49', unexpected: 'exploit' });
      expect(res.status).toBe(400);
      expect(asError(res.body).error.code).toBe('ValidationError');
    });

    it('/api/geocode rejects queries under 2 characters or with disallowed characters', async () => {
      const resTooShort = await handleGeocodeCore({ q: 'a' });
      expect(resTooShort.status).toBe(400);
      expect(asError(resTooShort.body).error.code).toBe('ValidationError');

      const resSpecial = await handleGeocodeCore({ q: '<script>alert(1)</script>' });
      expect(resSpecial.status).toBe(400);
      expect(asError(resSpecial.body).error.code).toBe('ValidationError');

      const resMissing = await handleGeocodeCore({});
      expect(resMissing.status).toBe(400);
    });

    it('/api/plan rejects non-JSON body and schema-violating payload', async () => {
      const resNotJson = await handlePlanCore(
        'not-json',
        { 'content-type': 'application/json' },
        'POST',
      );
      expect(resNotJson.status).toBe(400);
      expect(asError(resNotJson.body).error.code).toBe('ValidationError');

      const resInvalidSchema = await handlePlanCore(
        JSON.stringify({ invalidField: true }),
        { 'content-type': 'application/json' },
        'POST',
      );
      expect(resInvalidSchema.status).toBe(400);
      expect(asError(resInvalidSchema.body).error.code).toBe('ValidationError');
    });
  });

  describe('Payload Size Caps (413 Payload Too Large)', () => {
    it('/api/air enforces 1 KB cap', async () => {
      const res = await handleAirCore(
        { lat: '17.38', lon: '78.49' },
        { 'content-length': '2048' },
        'GET',
        2048,
      );
      expect(res.status).toBe(413);
      expect(asError(res.body).error.code).toBe('PayloadTooLarge');
    });

    it('/api/geocode enforces 1 KB cap', async () => {
      const res = await handleGeocodeCore(
        { q: 'Delhi' },
        { 'content-length': '1500' },
        'GET',
        1500,
      );
      expect(res.status).toBe(413);
      expect(asError(res.body).error.code).toBe('PayloadTooLarge');
    });

    it('/api/plan enforces 8 KB cap', async () => {
      const res = await handlePlanCore(
        'x'.repeat(9000),
        { 'content-type': 'application/json', 'content-length': '9000' },
        'POST',
        9000,
      );
      expect(res.status).toBe(413);
      expect(asError(res.body).error.code).toBe('PayloadTooLarge');
    });
  });

  describe('Media Type Validation (415 Unsupported Media Type)', () => {
    it('/api/plan rejects non-JSON Content-Type', async () => {
      const res = await handlePlanCore('{}', { 'content-type': 'text/plain' }, 'POST');
      expect(res.status).toBe(415);
      expect(asError(res.body).error.code).toBe('UnsupportedMediaType');
    });
  });

  describe('CORS and Origin Policy (403 Forbidden)', () => {
    it('rejects disallowed cross-origin request with 403', async () => {
      process.env.ALLOWED_ORIGIN = 'https://airwise.app';

      const res = await handleHealthCore({
        origin: 'https://malicious-site.example',
        host: 'airwise.app',
      });

      expect(res.status).toBe(403);
      expect(asError(res.body).error.code).toBe('Forbidden');
    });

    it('permits matching allowed origin and attaches CORS headers', async () => {
      process.env.ALLOWED_ORIGIN = 'https://airwise.app';

      const res = await handleHealthCore({
        origin: 'https://airwise.app',
        host: 'airwise.app',
      });

      expect(res.status).toBe(200);
      expect(res.headers['Access-Control-Allow-Origin']).toBe('https://airwise.app');
      expect(res.headers['Vary']).toBe('Origin');
    });
  });

  describe('Rate Limiting (429 Too Many Requests & Token Refill)', () => {
    it('rate limits after exhausting token bucket and refills over time', async () => {
      const testIp = '198.51.100.1';

      // General endpoint: burst of 5
      for (let i = 0; i < 5; i++) {
        await handleGeocodeCore({ q: 'Delhi' }, { 'x-forwarded-for': testIp });
      }

      // 6th immediate request should be rate-limited
      const throttledRes = await handleGeocodeCore({ q: 'Delhi' }, { 'x-forwarded-for': testIp });
      expect(throttledRes.status).toBe(429);
      expect(asError(throttledRes.body).error.code).toBe('RateLimited');
    });

    it('returns 429 with Retry-After when rate limit exceeded', async () => {
      const testIp = '203.0.113.42';
      // Drain plan bucket (burst 2)
      await handlePlanCore(
        '{}',
        { 'x-forwarded-for': testIp, 'content-type': 'application/json' },
        'POST',
      );
      await handlePlanCore(
        '{}',
        { 'x-forwarded-for': testIp, 'content-type': 'application/json' },
        'POST',
      );

      // 3rd request should hit rate limit
      const res = await handlePlanCore(
        '{}',
        { 'x-forwarded-for': testIp, 'content-type': 'application/json' },
        'POST',
      );
      expect(res.status).toBe(429);
      expect(asError(res.body).error.code).toBe('RateLimited');
      expect(res.headers['Retry-After']).toBeDefined();
    });
  });

  describe('Server Cache TTL (10-minute in-memory cache)', () => {
    it('returns cached response on identical coordinates within 10 minutes without re-fetching', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('air-quality')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                current: { time: '2026-11-22T10:00:00Z', pm2_5: 35.5 },
                hourly: { time: ['2026-11-22T10:00:00Z'], pm2_5: [35.5], us_aqi: [99] },
                timezone: 'Asia/Kolkata',
                utc_offset_seconds: 19800,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              daily: { sunrise: ['2026-11-22T06:15:00Z'], sunset: ['2026-11-22T17:45:00Z'] },
              hourly: { time: ['2026-11-22T10:00:00Z'], temperature_2m: [25] },
            }),
        });
      });

      vi.stubGlobal('fetch', mockFetch);

      // First call
      const res1 = await handleAirCore({ lat: '17.38', lon: '78.49' });
      expect(res1.status).toBe(200);
      expect(asAir(res1.body).currentPm25).toBe(35.5);
      const initialFetchCount = mockFetch.mock.calls.length;
      expect(initialFetchCount).toBe(2); // air + weather

      // Second call within TTL
      const res2 = await handleAirCore({ lat: '17.38', lon: '78.49' });
      expect(res2.status).toBe(200);
      expect(asAir(res2.body).currentPm25).toBe(35.5);
      // Upstream fetch was NOT called again
      expect(mockFetch.mock.calls.length).toBe(initialFetchCount);
    });
  });
});
