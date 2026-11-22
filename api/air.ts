import { createErrorResponse, ApiResponse, ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { validateCorsOrigin } from './_lib/cors';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';
import { parseQuery, AirQuerySchema, validatePayloadSize } from './_lib/validate';

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

/**
 * Pure core air quality handler.
 */
export async function handleAirCore(
  query: Record<string, string | string[] | undefined>,
  headers: Record<string, string | string[] | undefined> = {},
  method: string = 'GET',
  bodyBytes: number = 0,
): Promise<ApiResponse<ApiAirResponseData | ApiErrorBody>> {
  // 1. Method check
  if (method !== 'GET' && method !== 'HEAD') {
    return createErrorResponse(405, 'MethodNotAllowed', 'Only GET method is supported on /api/air', {
      Allow: 'GET, HEAD',
    });
  }

  // 2. CORS check
  const origin = typeof headers['origin'] === 'string' ? headers['origin'] : undefined;
  const host = typeof headers['host'] === 'string' ? headers['host'] : undefined;
  const cors = validateCorsOrigin(origin, host);
  if (!cors.allowed) {
    return createErrorResponse(403, 'Forbidden', 'Cross-origin request not permitted');
  }

  // 3. Body cap (1 KB)
  const contentLength = typeof headers['content-length'] === 'string' ? headers['content-length'] : undefined;
  const sizeValidation = validatePayloadSize(contentLength, bodyBytes, 1024);
  if (!sizeValidation.valid) {
    return sizeValidation.response;
  }

  // 4. Rate limit check
  const ip = getClientIp(headers);
  const rateLimit = checkRateLimit(ip, 'general');
  if (!rateLimit.allowed) {
    return createErrorResponse(429, 'RateLimited', 'Too many requests. Please try again later.', {
      'Retry-After': String(rateLimit.retryAfterSeconds || 30),
    });
  }

  // 5. Query validation
  const parsed = parseQuery(query, AirQuerySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { lat, lon } = parsed.data;

  // 6. Cache lookup (10-minute TTL)
  const now = Date.now();
  const dateHour = new Date(now).toISOString().slice(0, 13); // e.g. "2026-11-22T04"
  const cacheKey = `${lat},${lon}_${dateHour}`;

  const cached = serverAirCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return {
      status: 200,
      headers: getSecurityHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
        ...cors.headers,
      }),
      body: cached.data,
    };
  }

  // 7. Parallel fetch to Open-Meteo Air Quality + Weather Forecast (6s timeout)
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,us_aqi,european_aqi&current=pm2_5&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m&daily=sunrise,sunset&timezone=auto`;

  let airJson: UpstreamAirQualityResponse;
  let weatherJson: UpstreamWeatherResponse | null = null;

  try {
    const [airRes, weatherRes] = await Promise.allSettled([
      fetch(airUrl, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } }),
      fetch(weatherUrl, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } }),
    ]);

    if (airRes.status === 'rejected' || !airRes.value.ok) {
      return createErrorResponse(502, 'DataUnavailable', 'Air quality service is temporarily unavailable');
    }

    airJson = (await airRes.value.json()) as UpstreamAirQualityResponse;

    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      try {
        weatherJson = (await weatherRes.value.json()) as UpstreamWeatherResponse;
      } catch {
        weatherJson = null; // Tolerated
      }
    }
  } catch (_err: unknown) {
    return createErrorResponse(504, 'DataUnavailable', 'Air quality service timed out or was unreachable');
  }

  // 8. Normalization
  const fetchedAt = new Date().toISOString();
  const currentPm25 = typeof airJson?.current?.pm2_5 === 'number' ? airJson.current.pm2_5 : null;

  const hourlyTimes: string[] = Array.isArray(airJson?.hourly?.time) ? airJson.hourly.time : [];
  const hourlyPm25: Array<number | null> = Array.isArray(airJson?.hourly?.pm2_5) ? airJson.hourly.pm2_5 : [];
  const hourlyUsAqi: Array<number | null> = Array.isArray(airJson?.hourly?.us_aqi) ? airJson.hourly.us_aqi : [];

  const hourly: ApiHourlyPoint[] = [];
  for (let i = 0; i < hourlyTimes.length; i++) {
    hourly.push({
      time: hourlyTimes[i],
      pm25: hourlyPm25[i] ?? null,
      aqi: hourlyUsAqi[i] ?? null,
    });
  }

  // Parse weather if available
  let weather: ApiAirResponseData['weather'] = undefined;
  let daylight: ApiAirResponseData['daylight'] = undefined;

  if (weatherJson) {
    const sunriseArr = weatherJson?.daily?.sunrise;
    const sunsetArr = weatherJson?.daily?.sunset;
    const sunrise = Array.isArray(sunriseArr) && sunriseArr.length > 0 ? String(sunriseArr[0]) : undefined;
    const sunset = Array.isArray(sunsetArr) && sunsetArr.length > 0 ? String(sunsetArr[0]) : undefined;

    if (sunrise && sunset) {
      daylight = { sunrise, sunset };
    }

    const wTimes: string[] = Array.isArray(weatherJson?.hourly?.time) ? weatherJson.hourly.time : [];
    const wTemp: Array<number | null> = Array.isArray(weatherJson?.hourly?.temperature_2m)
      ? weatherJson.hourly.temperature_2m
      : [];
    const wWind: Array<number | null> = Array.isArray(weatherJson?.hourly?.wind_speed_10m)
      ? weatherJson.hourly.wind_speed_10m
      : [];
    const wHum: Array<number | null> = Array.isArray(weatherJson?.hourly?.relative_humidity_2m)
      ? weatherJson.hourly.relative_humidity_2m
      : [];

    const weatherHourly: ApiWeatherHourlyPoint[] = [];
    for (let i = 0; i < wTimes.length; i++) {
      weatherHourly.push({
        time: wTimes[i],
        temperature2m: wTemp[i] ?? null,
        windSpeed10m: wWind[i] ?? null,
        relativeHumidity2m: wHum[i] ?? null,
      });
    }

    weather = {
      temperature2m: wTemp.length > 0 ? wTemp[0] : null,
      windSpeed10m: wWind.length > 0 ? wWind[0] : null,
      relativeHumidity2m: wHum.length > 0 ? wHum[0] : null,
      hourly: weatherHourly,
      daylight,
    };
  }

  const responseData: ApiAirResponseData = {
    currentPm25,
    hourly,
    weather,
    daylight,
    timezone: String(airJson?.timezone || 'auto'),
    utcOffsetSeconds: Number(airJson?.utc_offset_seconds || 0),
    observedAt: airJson?.current?.time || fetchedAt,
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

  // Cache response for 10 minutes (600,000 ms)
  serverAirCache.set(cacheKey, {
    data: responseData,
    expiresAt: now + 600 * 1000,
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
}

/**
 * Vercel Serverless Function entry point.
 */
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const res = await handleAirCore(query, headers, request.method);
  return new Response(JSON.stringify(res.body), {
    status: res.status,
    headers: res.headers,
  });
}
