import '../src/lib/zodConfig';
import { z } from 'zod';
import { createErrorResponse, type ApiResponse, type ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { parseQuery, GeocodeQuerySchema } from './_lib/validate';
import { withApiGuards } from './_lib/pipeline';
import { createFetchHandler } from './_lib/http';

export interface GeocodeItem {
  name: string;
  adminRegion: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export const UpstreamGeocodeItemSchema = z.object({
  name: z.string().optional(),
  admin1: z.string().optional(),
  country_code: z.string().optional(),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  timezone: z.string().optional(),
});

export const UpstreamGeocodeResponseSchema = z.object({
  results: z.array(UpstreamGeocodeItemSchema).optional(),
});

export type UpstreamGeocodeItem = z.infer<typeof UpstreamGeocodeItemSchema>;

function mapGeocodeResults(results: UpstreamGeocodeItem[]): GeocodeItem[] {
  return results.map((r) => ({
    name: String(r.name || ''),
    adminRegion: String(r.admin1 || ''),
    countryCode: String(r.country_code || ''),
    lat: Math.round(r.latitude * 100) / 100,
    lon: Math.round(r.longitude * 100) / 100,
    timezone: r.timezone ? String(r.timezone) : undefined,
  }));
}

/**
 * Pure core geocode handler.
 */
export async function handleGeocodeCore(
  query: Record<string, string | string[] | undefined>,
  headers: Record<string, string | string[] | undefined> = {},
  method: string = 'GET',
  bodyBytes: number = 0,
): Promise<ApiResponse<GeocodeItem[] | ApiErrorBody>> {
  return withApiGuards(
    {
      endpointName: '/api/geocode',
      allowedMethods: ['GET', 'HEAD'],
      allowHeader: 'GET, HEAD',
      maxBodyBytes: 1024,
      rateLimitBucket: 'general',
    },
    { headers, method, bodyBytes },
    async (cors) => {
      const parsed = parseQuery(query, GeocodeQuerySchema);
      if (!parsed.success) {
        return parsed.response;
      }
      const { q, count } = parsed.data;

      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${count}&language=en&format=json`;

      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(6000),
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          return createErrorResponse(
            502,
            'DataUnavailable',
            'Geocoding service returned an unexpected response',
          );
        }

        const rawJson: unknown = await res.json();
        const parsedData = UpstreamGeocodeResponseSchema.safeParse(rawJson);
        if (!parsedData.success) {
          return createErrorResponse(
            502,
            'DataUnavailable',
            'Geocoding service returned an unexpected response',
          );
        }

        const results = parsedData.data.results || [];
        const items = mapGeocodeResults(results);

        return {
          status: 200,
          headers: getSecurityHeaders({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
            ...cors.headers,
          }),
          body: items,
        };
      } catch (_err: unknown) {
        return createErrorResponse(
          504,
          'DataUnavailable',
          'Geocoding service timed out or was unreachable',
        );
      }
    },
  );
}

/**
 * Vercel Serverless Function entry point.
 */
export default createFetchHandler((req, { query, headers }) =>
  handleGeocodeCore(query, headers, req.method),
);
