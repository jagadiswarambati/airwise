import { createErrorResponse, type ApiResponse, type ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { parseQuery, AirQuerySchema } from './_lib/validate';
import { type Clock, systemClock } from '../src/lib/clock';
import { withApiGuards } from './_lib/pipeline';

interface UpstreamAirQualityResponse {
  current?: {
    time?: string;
    pm2_5?: number | null;
  };
  hourly?: {
    time?: string[];
    pm2_5?: Array<number | null>;
    us_aqi?: Array<number | null>;
  };
  timezone?: string;
  utc_offset_seconds?: number;
}

interface UpstreamWeatherResponse {
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
    relative_humidity_2m?: Array<number | null>;
  };
}

export interface ApiHourlyPoint {
  time: string;
  pm25: number | null;
  aqi?: number | null;
}

export interface ApiWeatherHourlyPoint {
  time: string;
  temperature2m?: number | null;
  windSpeed10m?: number | null;
  relativeHumidity2m?: number | null;
}

export interface ApiAirResponseData {
  currentPm25: number | null;
  hourly: ApiHourlyPoint[];
  weather?: {
    temperature2m?: number | null;
    windSpeed10m?: number | null;
    relativeHumidity2m?: number | null;
    hourly?: ApiWeatherHourlyPoint[];
    daylight?: {
      sunrise: string;
      sunset: string;
    };
  };
  daylight?: {
    sunrise: string;
    sunset: string;
  };
  timezone: string;
  utcOffsetSeconds: number;
  observedAt: string;
  fetchedAt: string;
  source: {
    id: string;
    name: string;
    dataType: 'modelled' | 'observed' | 'sample';
    resolutionNote: string;
    attribution: string;
  };
}

interface CacheEntry {
  data: ApiAirResponseData;
  expiresAt: number;
}

const serverAirCache = new Map<string, CacheEntry>();

export function clearAirCache(): void {
  serverAirCache.clear();
}

export function parseAirRequest(
  query: Record<string, string | string[] | undefined>,
): { success: true; lat: number; lon: number } | { success: false; response: ApiResponse<ApiErrorBody> } {
  const parsed = parseQuery(query, AirQuerySchema);
  if (!parsed.success) {
    return { success: false, response: parsed.response };
  }
  return { success: true, lat: parsed.data.lat, lon: parsed.data.lon };
}

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

export async function fetchUpstream(
  lat: number,
  lon: number,
): Promise<
  | { success: true; airJson: UpstreamAirQualityResponse; weatherJson: UpstreamWeatherResponse | null }
  | { success: false; response: ApiResponse<ApiErrorBody> }
> {
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,us_aqi,european_aqi&current=pm2_5&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m&daily=sunrise,sunset&timezone=auto`;

  try {
    const [airRes, weatherRes] = await Promise.allSettled([
      fetch(airUrl, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } }),
      fetch(weatherUrl, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } }),
    ]);

    if (airRes.status === 'rejected' || !airRes.value.ok) {
      return {
        success: false,
        response: createErrorResponse(502, 'DataUnavailable', 'Air quality service is temporarily unavailable'),
      };
    }

    const airJson = (await airRes.value.json()) as UpstreamAirQualityResponse;
    let weatherJson: UpstreamWeatherResponse | null = null;
    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      try {
        weatherJson = (await weatherRes.value.json()) as UpstreamWeatherResponse;
      } catch {
        weatherJson = null;
      }
    }

    return { success: true, airJson, weatherJson };
  } catch (_err: unknown) {
    return {
      success: false,
      response: createErrorResponse(504, 'DataUnavailable', 'Air quality service timed out or was unreachable'),
    };
  }
}

function parseDaylight(daily?: UpstreamWeatherResponse['daily']): ApiAirResponseData['daylight'] {
  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];
  return sunrise && sunset ? { sunrise: String(sunrise), sunset: String(sunset) } : undefined;
}

function parseWeatherHourly(hourly?: UpstreamWeatherResponse['hourly']): ApiWeatherHourlyPoint[] {
  if (!hourly?.time) return [];
  const { time, temperature_2m: temp = [], wind_speed_10m: wind = [], relative_humidity_2m: hum = [] } = hourly;
  return time.map((t, i) => ({
    time: t,
    temperature2m: temp[i] ?? null,
    windSpeed10m: wind[i] ?? null,
    relativeHumidity2m: hum[i] ?? null,
  }));
}

function parseWeatherSection(weatherJson: UpstreamWeatherResponse | null): {
  weather?: ApiAirResponseData['weather'];
  daylight?: ApiAirResponseData['daylight'];
} {
  if (!weatherJson) return {};
  const daylight = parseDaylight(weatherJson.daily);
  const hourly = parseWeatherHourly(weatherJson.hourly);
  const wTemp = weatherJson.hourly?.temperature_2m ?? [];
  const wWind = weatherJson.hourly?.wind_speed_10m ?? [];
  const wHum = weatherJson.hourly?.relative_humidity_2m ?? [];

  return {
    daylight,
    weather: {
      temperature2m: wTemp[0] ?? null,
      windSpeed10m: wWind[0] ?? null,
      relativeHumidity2m: wHum[0] ?? null,
      hourly,
      daylight,
    },
  };
}

function parseAirHourly(hourlyData?: UpstreamAirQualityResponse['hourly']): ApiHourlyPoint[] {
  const times = hourlyData?.time ?? [];
  const pm25s = hourlyData?.pm2_5 ?? [];
  const aqis = hourlyData?.us_aqi ?? [];

  return times.map((time, i) => ({
    time,
    pm25: pm25s[i] ?? null,
    aqi: aqis[i] ?? null,
  }));
}

export function normalizeUpstream(
  airJson: UpstreamAirQualityResponse,
  weatherJson: UpstreamWeatherResponse | null,
  clock: Clock,
): ApiAirResponseData {
  const fetchedAt = clock().toISOString();
  const currentPm25 = typeof airJson.current?.pm2_5 === 'number' ? airJson.current.pm2_5 : null;
  const hourly = parseAirHourly(airJson.hourly);
  const { weather, daylight } = parseWeatherSection(weatherJson);

  return {
    currentPm25,
    hourly,
    weather,
    daylight,
    timezone: String(airJson.timezone || 'auto'),
    utcOffsetSeconds: Number(airJson.utc_offset_seconds || 0),
    observedAt: airJson.current?.time || fetchedAt,
    fetchedAt,
    source: {
      id: 'open-meteo',
      name: 'Open-Meteo (CAMS & Forecast)',
      dataType: 'modelled',
      resolutionNote: 'Modelled CAMS atmospheric forecast (~25 km spatial resolution).',
      attribution:
        'Air quality and weather data by Open-Meteo, derived from Copernicus Atmosphere Monitoring Service (CAMS) information.',
    },
  };
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
      serverAirCache.set(`${lat},${lon}_${dateHour}`, {
        data: responseData,
        expiresAt: clock().getTime() + 600 * 1000,
      });

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
export default {
  async fetch(request: Request, clock: Clock = systemClock): Promise<Response> {
    const url = new URL(request.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const res = await handleAirCore(query, headers, request.method, 0, clock);
    return new Response(JSON.stringify(res.body), {
      status: res.status,
      headers: res.headers,
    });
  },
};
