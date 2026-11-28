import { createErrorResponse, type ApiResponse, type ApiErrorBody } from './errors';
import { type Clock } from '../../src/lib/clock';

/**
 * UpstreamAirQualityResponse.
 */
export interface UpstreamAirQualityResponse {
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

/**
 * UpstreamWeatherResponse.
 */
export interface UpstreamWeatherResponse {
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
  hourly?: {
    time?: string[];
    wind_speed_10m?: Array<number | null>;
  };
}

/**
 * ApiHourlyPoint.
 */
export interface ApiHourlyPoint {
  time: string;
  pm25: number | null;
  aqi?: number | null;
}

/**
 * ApiWeatherHourlyPoint.
 */
export interface ApiWeatherHourlyPoint {
  time: string;
  windSpeed10m?: number | null;
}

/**
 * ApiAirResponseData.
 */
export interface ApiAirResponseData {
  currentPm25: number | null;
  hourly: ApiHourlyPoint[];
  weather?: {
    windSpeed10m?: number | null;
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

/**
 * fetchUpstream.
 * @returns
 */
export async function fetchUpstream(
  lat: number,
  lon: number,
): Promise<
  | { success: true; airJson: UpstreamAirQualityResponse; weatherJson: UpstreamWeatherResponse | null }
  | { success: false; response: ApiResponse<ApiErrorBody> }
> {
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,us_aqi,european_aqi&current=pm2_5&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m&daily=sunrise,sunset&timezone=auto`;

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
  const { time, wind_speed_10m: wind = [] } = hourly;
  return time.map((t, i) => ({
    time: t,
    windSpeed10m: wind[i] ?? null,
  }));
}

function parseWeatherSection(weatherJson: UpstreamWeatherResponse | null): {
  weather?: ApiAirResponseData['weather'];
  daylight?: ApiAirResponseData['daylight'];
} {
  if (!weatherJson) return {};
  const daylight = parseDaylight(weatherJson.daily);
  const hourly = parseWeatherHourly(weatherJson.hourly);
  const wWind = weatherJson.hourly?.wind_speed_10m ?? [];

  return {
    daylight,
    weather: {
      windSpeed10m: wWind[0] ?? null,
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

/**
 * normalizeUpstream.
 * @returns
 */
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
