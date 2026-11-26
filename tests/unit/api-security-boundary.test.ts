import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleAirCore,
  clearAirCache,
  MAX_AIR_CACHE_ENTRIES,
  getAirCacheSize,
} from '../../api/air';
import { handleGeocodeCore, UpstreamGeocodeResponseSchema } from '../../api/geocode';
import { handleHealthCore } from '../../api/health';
import { handlePlanCore } from '../../api/plan';
import { GeocodeQuerySchema } from '../../api/_lib/validate';
import {
  setCachedPlan,
  clearPlanCache,
  MAX_PLAN_CACHE_ENTRIES,
  getPlanCacheSize,
  getCachedPlan,
} from '../../src/ai/plan-cache';
import { normalizeUnicodeDigitsToAscii, validateAIPlanOutput } from '../../src/ai/validator';
import { type AIPlanInput, type AIPlanOutput } from '../../src/ai/schema';
import { readBodyWithLimit } from '../../api/_lib/http';
import fs from 'node:fs';
import path from 'node:path';

describe('API Security Boundary Hardening Suite', () => {
  beforeEach(() => {
    clearAirCache();
    clearPlanCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ALLOWED_ORIGIN;
  });

  describe('Task 1: Gemini Call Timeout and Budget Constraints', () => {
    const validPlanInput: AIPlanInput = {
      effectiveLevel: 1,
      trend: 'steady',
      slotRisks: [],
      radar: { memberBand: '5-12', peakSlotId: 'daytime' },
      approvedCandidateIds: ['IN-01', 'PE-02', 'IN-02'],
      mustIncludeIds: [],
      forbiddenActionIds: [],
      budgetTier: 'low',
      householdDescriptors: {
        sensitiveCategory: 'respiratory',
        ageGroups: ['5-12'],
        equipment: { purifier: false, windowAC: false, hvac: false, kitchenExhaust: false },
        homeHeating: 'none',
      },
      confidenceCeiling: 'medium',
      numericFacts: { pm25Now: 25, slotMeanPm25Values: [], routineTimes: [] },
    };

    it('uses AbortSignal.timeout on each attempt and skips retry if under 3 seconds remain', async () => {
      process.env.LLM_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';

      let attempt = 0;
      const fetchMock = vi.fn().mockImplementation(async (_url, options) => {
        attempt++;
        expect(options.signal).toBeDefined();

        if (attempt === 1) {
          // Simulate first attempt taking 10 seconds of the 12s budget
          const start = Date.now();
          vi.spyOn(Date, 'now').mockReturnValue(start + 9500); // 9.5s elapsed, only 2.5s remaining (< 3s)
          // Return an invalid response to trigger safety failure
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          schemaVersion: 1,
                          headline: 'Prohibited medical diagnosis phrase',
                          topActionIds: ['IN-01', 'PE-02', 'IN-02'],
                          timeline: [],
                          explanations: {},
                          assumptions: [],
                          planConfidence: 'medium',
                          confidenceReason: 'Test',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({ candidates: [] }),
        };
      });

      vi.stubGlobal('fetch', fetchMock);

      const res = await handlePlanCore(
        JSON.stringify(validPlanInput),
        { 'content-type': 'application/json' },
        'POST',
      );

      expect(res.status).toBe(200);
      const body = res.body as { success: boolean; fallback: boolean; message: string };
      expect(body.success).toBe(false);
      expect(body.fallback).toBe(true);
      expect(body.message).toBe('AI personalisation is unavailable right now.');
      // Attempt 2 was skipped because less than 3s remained of the 12s budget
      expect(attempt).toBe(1);
    });

    it('retries with fixed error code in prompt when validation fails and budget permits', async () => {
      process.env.LLM_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';

      let attempt = 0;
      const fetchMock = vi.fn().mockImplementation(async (_url, options) => {
        attempt++;
        const sentBody = JSON.parse(options.body);
        const promptText = sentBody.contents[0].parts[0].text;

        if (attempt === 1) {
          // Attempt 1: return output with invented numbers
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          schemaVersion: 1,
                          headline: 'Wait 999 minutes',
                          topActionIds: ['IN-01', 'PE-02', 'IN-02'],
                          timeline: [],
                          explanations: {},
                          assumptions: [],
                          planConfidence: 'medium',
                          confidenceReason: 'Test',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          };
        }

        // Attempt 2: verify retry prompt includes ONLY the fixed code INVENTED_NUMBERS,
        // and never raw model text or free-text fields
        expect(promptText).toContain('Violation code: INVENTED_NUMBERS');
        expect(promptText).not.toContain('Wait 999 minutes');
        expect(promptText).not.toContain('Invented or unsupported number');

        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        schemaVersion: 1,
                        headline: 'Safe headline without extra numbers',
                        topActionIds: ['IN-01', 'PE-02', 'IN-02'],
                        timeline: [],
                        explanations: {},
                        assumptions: [],
                        planConfidence: 'medium',
                        confidenceReason: 'Safe',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      });

      vi.stubGlobal('fetch', fetchMock);

      const res = await handlePlanCore(
        JSON.stringify(validPlanInput),
        { 'content-type': 'application/json' },
        'POST',
      );

      expect(res.status).toBe(200);
      const body = res.body as { success: boolean; plan: AIPlanOutput };
      expect(body.success).toBe(true);
      expect(body.plan.headline).toBe('Safe headline without extra numbers');
      expect(attempt).toBe(2);
    });
  });

  describe('Task 2: Error Sanitization and Leak Scanning', () => {
    it('scans every error body produced across endpoints and verifies no leaks', async () => {
      const errorResponses = await Promise.all([
        // /api/air errors
        handleAirCore({}, {}, 'POST'),
        handleAirCore({ lat: 'invalid', lon: '10' }, {}, 'GET'),
        handleAirCore({ lat: '20', lon: 'invalid' }, {}, 'GET'),
        handleAirCore({ lat: '999', lon: '10' }, {}, 'GET'),

        // /api/geocode errors
        handleGeocodeCore({}, {}, 'POST'),
        handleGeocodeCore({ q: '<script>' }, {}, 'GET'),
        handleGeocodeCore({ q: 'a' }, {}, 'GET'),
        handleGeocodeCore({ q: 'x'.repeat(70) }, {}, 'GET'),

        // /api/health errors
        handleHealthCore({}, 'POST'),
        handleHealthCore({}, 'DELETE'),

        // /api/plan errors
        handlePlanCore('', {}, 'GET'),
        handlePlanCore('{}', { 'content-type': 'text/plain' }, 'POST'),
        handlePlanCore('x'.repeat(9000), { 'content-type': 'application/json' }, 'POST', 9000),
        handlePlanCore('malformed{json', { 'content-type': 'application/json' }, 'POST'),
        handlePlanCore('{"effectiveLevel": 999}', { 'content-type': 'application/json' }, 'POST'),
      ]);

      const forbiddenLeakPatterns = [
        /gemini/i,
        /\bstatus\b/i,
        /\bstack\b/i,
        /https?:\/\//i,
        /open-meteo\.com/i,
        /googleapis\.com/i,
        /generativelanguage/i,
        /x-goog-api-key/i,
        /AIza[0-9A-Za-z-_]{35}/,
        /sk-[a-zA-Z0-9]{20,}/,
        /ZodError/i,
        /"issues"\s*:\s*\[/i,
      ];

      for (const response of errorResponses) {
        expect(response.status).toBeGreaterThanOrEqual(400);
        const serialized = JSON.stringify(response.body);
        for (const pattern of forbiddenLeakPatterns) {
          expect(serialized).not.toMatch(pattern);
        }
      }
    });
  });

  describe('Task 3: Upstream Zod Schemas at Boundary', () => {
    it('UpstreamGeocodeResponseSchema enforces finite numbers and rejects NaN and strings', () => {
      // Valid upstream item
      const validPayload = {
        results: [
          {
            name: 'Hyderabad',
            admin1: 'Telangana',
            country_code: 'IN',
            latitude: 17.385,
            longitude: 78.4867,
          },
        ],
      };
      expect(UpstreamGeocodeResponseSchema.safeParse(validPayload).success).toBe(true);

      // Rejects string latitude
      const stringLat = {
        results: [{ latitude: '17.385', longitude: 78.4867 }],
      };
      expect(UpstreamGeocodeResponseSchema.safeParse(stringLat).success).toBe(false);

      // Rejects NaN
      const nanLat = {
        results: [{ latitude: NaN, longitude: 78.4867 }],
      };
      expect(UpstreamGeocodeResponseSchema.safeParse(nanLat).success).toBe(false);

      // Rejects Infinity
      const infLon = {
        results: [{ latitude: 17.385, longitude: Infinity }],
      };
      expect(UpstreamGeocodeResponseSchema.safeParse(infLon).success).toBe(false);

      // Rejects out of range latitude (> 90)
      const outOfRange = {
        results: [{ latitude: 95.0, longitude: 78.4867 }],
      };
      expect(UpstreamGeocodeResponseSchema.safeParse(outOfRange).success).toBe(false);
    });
  });

  describe('Task 4: Bounded Caches with Eviction', () => {
    it('caps serverAirCache to MAX_AIR_CACHE_ENTRIES and prunes expired entries', async () => {
      expect(MAX_AIR_CACHE_ENTRIES).toBe(500);

      const fakeAirData = {
        currentPm25: 25,
        hourly: [],
        timezone: 'UTC',
        utcOffsetSeconds: 0,
        observedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: {
          id: 'test',
          name: 'Test',
          dataType: 'modelled' as const,
          resolutionNote: 'Test',
          attribution: 'Test',
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          hourly: {
            time: ['2026-11-26T00:00'],
            pm2_5: [25],
            temperature_2m: [25],
            relative_humidity_2m: [50],
            surface_pressure: [1013],
            wind_speed_10m: [5],
            wind_direction_10m: [180],
          },
          daily: { sunrise: ['2026-11-26T06:00'], sunset: ['2026-11-26T18:00'] },
          utc_offset_seconds: 0,
          timezone: 'UTC',
        }),
      } as unknown as Response);

      // Insert up to MAX_AIR_CACHE_ENTRIES entries directly
      const fixedClock = () => new Date('2026-11-26T12:00:00Z');
      const now = fixedClock().getTime();

      // Add 500 entries
      const { setAirCacheEntry } = await import('../../api/air');
      for (let i = 0; i < 500; i++) {
        setAirCacheEntry(`key_${i}`, fakeAirData, now + 600 * 1000, now);
      }
      expect(getAirCacheSize()).toBe(500);

      // Add 1 more entry: must evict the oldest entry (key_0) and keep size at 500
      setAirCacheEntry('key_new', fakeAirData, now + 600 * 1000, now);
      expect(getAirCacheSize()).toBe(500);

      // Now simulate passage of time (expired entries)
      const futureNow = now + 700 * 1000;
      setAirCacheEntry('key_future', fakeAirData, futureNow + 600 * 1000, futureNow);
      // All earlier entries expired and were pruned
      expect(getAirCacheSize()).toBe(1);
    });

    it('caps client plan-cache to MAX_PLAN_CACHE_ENTRIES with oldest-first eviction', () => {
      expect(MAX_PLAN_CACHE_ENTRIES).toBe(50);
      const fixedClock = () => new Date('2026-11-26T12:00:00Z');
      const mockPlan: AIPlanOutput = {
        schemaVersion: 1,
        headline: 'Test plan',
        topActionIds: ['IN-01', 'PE-02', 'IN-02'],
        timeline: [],
        explanations: {},
        assumptions: [],
        planConfidence: 'medium',
        confidenceReason: 'Test',
      };

      for (let i = 0; i < 50; i++) {
        setCachedPlan(`plan_${i}`, mockPlan, 3600 * 1000, fixedClock);
      }
      expect(getPlanCacheSize()).toBe(50);
      expect(getCachedPlan('plan_0', fixedClock)).toBeDefined();

      // Adding 51st entry evicts plan_0 (oldest)
      setCachedPlan('plan_50', mockPlan, 3600 * 1000, fixedClock);
      expect(getPlanCacheSize()).toBe(50);
      expect(getCachedPlan('plan_0', fixedClock)).toBeNull();
      expect(getCachedPlan('plan_50', fixedClock)).toBeDefined();

      // Expiry pruning: clock advanced past TTL
      const expiredClock = () => new Date('2026-11-26T14:00:00Z');
      setCachedPlan('plan_fresh', mockPlan, 3600 * 1000, expiredClock);
      expect(getPlanCacheSize()).toBe(1);
      expect(getCachedPlan('plan_fresh', expiredClock)).toBeDefined();
    });
  });

  describe('Task 5: Geocode Query Regex and Unicode Scripts', () => {
    it('accepts Telugu, Hindi, Tamil and accented names', () => {
      // Telugu: హైదరాబాద్
      expect(GeocodeQuerySchema.safeParse({ q: 'హైదరాబాద్' }).success).toBe(true);
      // Hindi: दिल्ली
      expect(GeocodeQuerySchema.safeParse({ q: 'दिल्ली' }).success).toBe(true);
      // Tamil: சென்னை
      expect(GeocodeQuerySchema.safeParse({ q: 'சென்னை' }).success).toBe(true);
      // Accented names
      expect(GeocodeQuerySchema.safeParse({ q: 'Zürich' }).success).toBe(true);
      expect(GeocodeQuerySchema.safeParse({ q: 'São Paulo' }).success).toBe(true);
      expect(GeocodeQuerySchema.safeParse({ q: 'Montréal' }).success).toBe(true);
      // Allows period in names (e.g. St. Louis)
      expect(GeocodeQuerySchema.safeParse({ q: 'St. Louis' }).success).toBe(true);
    });

    it('rejects angle brackets and control characters', () => {
      expect(GeocodeQuerySchema.safeParse({ q: '<script>alert(1)</script>' }).success).toBe(false);
      expect(GeocodeQuerySchema.safeParse({ q: 'Delhi\u0000City' }).success).toBe(false);
      expect(GeocodeQuerySchema.safeParse({ q: 'Delhi\r\nCity' }).success).toBe(false);
      expect(GeocodeQuerySchema.safeParse({ q: 'Delhi\u001FCity' }).success).toBe(false);
    });
  });

  describe('Task 6: Validator Unicode Digits Normalization', () => {
    it('normalizes Devanagari, Telugu, and full-width digits to ASCII', () => {
      expect(normalizeUnicodeDigitsToAscii('१२३')).toBe('123');
      expect(normalizeUnicodeDigitsToAscii('౧౨౩')).toBe('123');
      expect(normalizeUnicodeDigitsToAscii('８８%')).toBe('88%');
    });

    it('rejects "१२३", "౧౨౩" and "８８%" in model text when not in allowed numbers', () => {
      const mockInput: AIPlanInput = {
        effectiveLevel: 1,
        trend: 'steady',
        slotRisks: [],
        radar: { memberBand: '5-12', peakSlotId: 'daytime' },
        approvedCandidateIds: ['IN-01', 'PE-02', 'IN-02'],
        mustIncludeIds: [],
        forbiddenActionIds: [],
        budgetTier: 'low',
        householdDescriptors: {
          sensitiveCategory: 'respiratory',
          ageGroups: ['5-12'],
          equipment: { purifier: false, windowAC: false, hvac: false, kitchenExhaust: false },
          homeHeating: 'none',
        },
        confidenceCeiling: 'medium',
        numericFacts: { pm25Now: 25, slotMeanPm25Values: [], routineTimes: [] },
      };

      const baseOutput: AIPlanOutput = {
        schemaVersion: 1,
        headline: 'Clear air today',
        topActionIds: ['IN-01', 'PE-02', 'IN-02'],
        timeline: [],
        explanations: {},
        assumptions: [],
        planConfidence: 'medium',
        confidenceReason: 'Verified forecast alignment',
      };

      // Test full-width percentage: ８８%
      const outputWithFullWidthPercent = {
        ...baseOutput,
        headline: 'Reduces particles by ８８% today',
      };
      const resPercent = validateAIPlanOutput(outputWithFullWidthPercent, mockInput);
      expect(resPercent.valid).toBe(false);
      if (!resPercent.valid) {
        expect(resPercent.error.code).toBe('INVENTED_NUMBERS');
      }

      // Test Devanagari digits: १२३ (123 is not in allowed numbers)
      const outputWithDevanagari = {
        ...baseOutput,
        headline: 'Wait for १२३ minutes before opening windows',
      };
      const resDev = validateAIPlanOutput(outputWithDevanagari, mockInput);
      expect(resDev.valid).toBe(false);
      if (!resDev.valid) {
        expect(resDev.error.code).toBe('INVENTED_NUMBERS');
      }

      // Test Telugu digits: ౧౨౩
      const outputWithTelugu = {
        ...baseOutput,
        headline: 'Wait for ౧౨౩ minutes before opening windows',
      };
      const resTel = validateAIPlanOutput(outputWithTelugu, mockInput);
      expect(resTel.valid).toBe(false);
      if (!resTel.valid) {
        expect(resTel.error.code).toBe('INVENTED_NUMBERS');
      }
    });
  });

  describe('Task 7: CORS Preflight (OPTIONS)', () => {
    it('returns 204 with CORS headers and Max-Age: 600 when Origin matches ALLOWED_ORIGIN', async () => {
      process.env.ALLOWED_ORIGIN = 'https://trusted-partner.example.com';

      const res = await handleAirCore(
        { lat: '28.61', lon: '77.23' },
        {
          origin: 'https://trusted-partner.example.com',
        },
        'OPTIONS',
      );

      expect(res.status).toBe(204);
      expect(res.headers['Access-Control-Allow-Origin']).toBe(
        'https://trusted-partner.example.com',
      );
      expect(res.headers['Access-Control-Max-Age']).toBe('600');
      expect(res.headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    });

    it('returns 403 when Origin does not match ALLOWED_ORIGIN', async () => {
      process.env.ALLOWED_ORIGIN = 'https://trusted-partner.example.com';

      const res = await handleAirCore(
        { lat: '28.61', lon: '77.23' },
        {
          origin: 'https://malicious-site.example.com',
        },
        'OPTIONS',
      );

      expect(res.status).toBe(403);
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('Forbidden');
    });

    it('returns 405 when OPTIONS has no Origin header', async () => {
      const res = await handleAirCore(
        { lat: '28.61', lon: '77.23' },
        {}, // No origin header
        'OPTIONS',
      );

      expect(res.status).toBe(405);
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('MethodNotAllowed');
    });
  });

  describe('Task 8: Body Size and Stream Limit', () => {
    it('readBodyWithLimit reads body under cap and flags tooLarge when over limit', async () => {
      // Stream under limit
      const smallText = JSON.stringify({ hello: 'world' });
      const smallReq = new Request('http://localhost/api/plan', {
        method: 'POST',
        body: smallText,
      });

      const smallResult = await readBodyWithLimit(smallReq, 8192);
      expect('text' in smallResult).toBe(true);
      if ('text' in smallResult) {
        expect(smallResult.text).toBe(smallText);
        expect(smallResult.bytes).toBe(Buffer.byteLength(smallText));
      }

      // Stream over limit
      const bigText = 'A'.repeat(8200);
      const bigReq = new Request('http://localhost/api/plan', {
        method: 'POST',
        body: bigText,
      });

      const bigResult = await readBodyWithLimit(bigReq, 8192);
      expect('tooLarge' in bigResult).toBe(true);
    });
  });

  describe('Task 9: Built Asset Bundle Secrets Audit', () => {
    it('proves that dist contains no secret key patterns or GEMINI_API_KEY', () => {
      const distDir = path.resolve(__dirname, '../../dist');
      if (!fs.existsSync(distDir)) return;

      const forbiddenKeyPatterns = [
        /AIza[0-9A-Za-z-_]{35}/,
        /sk-[a-zA-Z0-9]{20,}/,
        /GEMINI_API_KEY/,
        /x-goog-api-key/,
        /mock-test-key/,
      ];

      function checkDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            checkDir(fullPath);
          } else if (/\.(js|html|css)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            for (const pat of forbiddenKeyPatterns) {
              expect(content).not.toMatch(pat);
            }
          }
        }
      }

      checkDir(distDir);
    });
  });
});
