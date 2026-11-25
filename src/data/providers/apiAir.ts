import { type AirSnapshot } from '../../domain/types';
import { normalizeAirQuality, type RawAirDataInput } from '../../domain/normalization';
import { type Clock, systemClock } from '../../lib/clock';

export interface ApiAirResponse {
  currentPm25: number | null;
  hourly: Array<{
    time: string;
    pm25: number | null;
    aqi?: number | null;
  }>;
  weather?: {
    temperature2m?: number | null;
    windSpeed10m?: number | null;
    relativeHumidity2m?: number | null;
    hourly?: Array<{
      time: string;
      temperature2m?: number | null;
      windSpeed10m?: number | null;
      relativeHumidity2m?: number | null;
    }>;
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

export const OPEN_METEO_ATTRIBUTION =
  'Air quality and weather data by Open-Meteo, derived from Copernicus Atmosphere Monitoring Service (CAMS) information.';

function buildSourceMetadata(source?: ApiAirResponse['source']) {
  return {
    id: source?.id || 'open-meteo',
    name: source?.name || 'Open-Meteo (CAMS & Forecast)',
    dataType: source?.dataType || 'modelled',
    resolutionNote:
      source?.resolutionNote ||
      'Modelled CAMS atmospheric forecast (~25 km spatial resolution).',
    attribution: source?.attribution || OPEN_METEO_ATTRIBUTION,
  };
}

/**
 * Pure parser that maps same-origin /api/air response to AirWise domain RawAirDataInput
 */
export function parseApiAirResponse(
  json: ApiAirResponse,
  fetchedAtOrClock: string | Clock = systemClock,
): RawAirDataInput {
  const fetchedAt =
    typeof fetchedAtOrClock === 'function' ? fetchedAtOrClock().toISOString() : fetchedAtOrClock;
  return {
    currentPm25: json.currentPm25,
    hourly: json.hourly,
    observedAt: json.observedAt || fetchedAt,
    fetchedAt: json.fetchedAt || fetchedAt,
    utcOffsetSeconds: json.utcOffsetSeconds,
    timezone: json.timezone,
    source: buildSourceMetadata(json.source),
  };
}

/**
 * Browser-side air quality provider fetching from same-origin /api/air.
 * Guarantees connect-src 'self' CSP compliance with zero direct third-party calls.
 */
export async function fetchApiAir(
  lat: number,
  lon: number,
  options?: { timeoutMs?: number; country?: string },
  clock: Clock = systemClock,
): Promise<AirSnapshot> {
  const timeoutMs = options?.timeoutMs || 6000;
  const targetRegion = options?.country === 'IN' ? 'IN' : 'US';

  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  const url = `/api/air?lat=${roundedLat}&lon=${roundedLon}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Air API returned HTTP status ${response.status}`);
    }

    const data: ApiAirResponse = await response.json();
    const rawInput = parseApiAirResponse(data, clock);
    const snapshot = normalizeAirQuality(rawInput, clock(), targetRegion);

    // Attach weather and daylight from API response
    snapshot.daylight = data.daylight || data.weather?.daylight;
    snapshot.weather = data.weather;

    return snapshot;
  } catch (error: unknown) {
    clearTimeout(timer);
    const msg = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Failed to fetch air quality data from /api/air: ${msg}`);
  }
}
