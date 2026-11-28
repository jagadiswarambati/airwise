import '../src/lib/zodConfig';
import { type ApiResponse, type ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { parseQuery, AirQuerySchema } from './_lib/validate';
import { type Clock, systemClock } from '../src/lib/clock';
import { withApiGuards } from './_lib/pipeline';
import { createFetchHandler } from './_lib/http';
import {
  type ApiHourlyPoint,
  type ApiWeatherHourlyPoint,
  type ApiAirResponseData,
  fetchUpstream,
  normalizeUpstream,
} from './_lib/airUpstream';

export type { ApiHourlyPoint, ApiWeatherHourlyPoint, ApiAirResponseData };
export { fetchUpstream, normalizeUpstream };

interface CacheEntry {
  data: ApiAirResponseData;
  expiresAt: number;
}

/**
 * MAX_AIR_CACHE_ENTRIES.
 */
export const MAX_AIR_CACHE_ENTRIES = 500;
const serverAirCache = new Map<string, CacheEntry>();

/**
 * clearAirCache.
 * @returns
 */
export function clearAirCache(): void {
  serverAirCache.clear();
}

/**
 * getAirCacheSize.
 * @returns
 */
export function getAirCacheSize(): number {
  return serverAirCache.size;
}

/**
 * pruneExpiredAirCache.
 * @param now
 * @returns
 */
export function pruneExpiredAirCache(now: number): void {
  for (const [key, entry] of serverAirCache.entries()) {
    if (now >= entry.expiresAt) {
      serverAirCache.delete(key);
    }
  }
}

/**
 * setAirCacheEntry.
 * @param key
 * @param data
 * @param expiresAt
 * @param now
 * @returns
 */
export function setAirCacheEntry(key: string, data: ApiAirResponseData, expiresAt: number, now: number): void {
  pruneExpiredAirCache(now);
  while (serverAirCache.size >= MAX_AIR_CACHE_ENTRIES) {
    const oldestKey = serverAirCache.keys().next().value;
    if (oldestKey === undefined) break;
    serverAirCache.delete(oldestKey);
  }
  serverAirCache.set(key, { data, expiresAt });
}

/**
 * parseAirRequest.
 * @returns
 */
export function parseAirRequest(
  query: Record<string, string | string[] | undefined>,
): { success: true; lat: number; lon: number } | { success: false; response: ApiResponse<ApiErrorBody> } {
  const parsed = parseQuery(query, AirQuerySchema);
  if (!parsed.success) {
    return { success: false, response: parsed.response };
  }
  return { success: true, lat: parsed.data.lat, lon: parsed.data.lon };
}

/**
 * lookupAirCache.
 * @param lat
 * @param lon
 * @param clock
 * @returns
 */
export function lookupAirCache(lat: number, lon: number, clock: Clock): ApiAirResponseData | null {
  const now = clock().getTime();
  const dateHour = clock().toISOString().slice(0, 13);
  const cacheKey = `${lat},${lon}_${dateHour}`;
  const cached = serverAirCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

/**
 * Pure core air quality handler.
 */
export async function handleAirCore(
  query: Record<string, string | string[] | undefined>,
  headers: Record<string, string | string[] | undefined> = {},
  method: string = 'GET',
  bodyBytes: number = 0,
  clock: Clock = systemClock,
): Promise<ApiResponse<ApiAirResponseData | ApiErrorBody>> {
  return withApiGuards(
    {
      endpointName: '/api/air',
      allowedMethods: ['GET', 'HEAD'],
      allowHeader: 'GET, HEAD',
      maxBodyBytes: 1024,
      rateLimitBucket: 'general',
    },
    { headers, method, bodyBytes, clock },
    async (cors) => {
      const parsed = parseAirRequest(query);
      if (!parsed.success) return parsed.response;
      const { lat, lon } = parsed;

      const cached = lookupAirCache(lat, lon, clock);
      if (cached) {
        return {
          status: 200,
          headers: getSecurityHeaders({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
            ...cors.headers,
          }),
          body: cached,
        };
      }

      const upstream = await fetchUpstream(lat, lon);
      if (!upstream.success) return upstream.response;

      const responseData = normalizeUpstream(upstream.airJson, upstream.weatherJson, clock);
      const dateHour = clock().toISOString().slice(0, 13);
      const now = clock().getTime();
      setAirCacheEntry(`${lat},${lon}_${dateHour}`, responseData, now + 600 * 1000, now);

      return {
        status: 200,
        headers: getSecurityHeaders({
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
          ...cors.headers,
        }),
        body: responseData,
      };
    },
  );
}

/**
 * Vercel Serverless Function entry point.
 */
export default createFetchHandler((req, { query, headers }) =>
  handleAirCore(query, headers, req.method),
);
