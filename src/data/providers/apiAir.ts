import { AirSnapshot } from '../../domain/types';
import { normalizeAirQuality, RawAirDataInput } from '../../domain/normalization';

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

/**
 * Pure parser that maps same-origin /api/air response to AirWise domain RawAirDataInput
 */
export function parseApiAirResponse(
  json: ApiAirResponse,
  fetchedAt: string = new Date().toISOString(),
): RawAirDataInput {
  return {
    currentPm25: json.currentPm25,
    hourly: json.hourly,
    observedAt: json.observedAt || fetchedAt,
    fetchedAt: json.fetchedAt || fetchedAt,
    source: {
      id: json.source?.id || 'open-meteo',
      name: json.source?.name || 'Open-Meteo (CAMS & Forecast)',
      dataType: json.source?.dataType || 'modelled',
      resolutionNote:
        json.source?.resolutionNote ||
        'Modelled CAMS atmospheric forecast (~25 km spatial resolution).',
      attribution: json.source?.attribution || OPEN_METEO_ATTRIBUTION,
    },
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
    const rawInput = parseApiAirResponse(data);
    const snapshot = normalizeAirQuality(rawInput, new Date(), targetRegion);

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
