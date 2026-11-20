import { AirSnapshot } from '../../domain/types';
import { normalizeAirQuality, RawAirDataInput } from '../../domain/normalization';

export interface OpenMeteoAirResponse {
  latitude: number;
  longitude: number;
  utc_offset_seconds?: number;
  timezone?: string;
  current?: {
    time: string;
    pm2_5: number | null;
  };
  hourly?: {
    time: string[];
    pm2_5?: Array<number | null>;
    us_aqi?: Array<number | null>;
    european_aqi?: Array<number | null>;
  };
}

export const OPEN_METEO_ATTRIBUTION =
  'Air quality data by Open-Meteo.com, derived from Copernicus Atmosphere Monitoring Service (CAMS) information.';

/**
 * Pure parser that maps Open-Meteo API JSON response to AirWise domain RawAirDataInput
 */
export function parseOpenMeteoResponse(
  json: OpenMeteoAirResponse,
  fetchedAt: string = new Date().toISOString(),
): RawAirDataInput {
  const currentPm25 = json.current?.pm2_5 ?? null;
  const hourlyTimes = json.hourly?.time || [];
  const hourlyPm25 = json.hourly?.pm2_5 || [];
  const hourlyUsAqi = json.hourly?.us_aqi || [];

  const hourlyPoints: Array<{ time: string; pm25: number | null; aqi?: number | null }> = [];
  for (let i = 0; i < hourlyTimes.length; i++) {
    hourlyPoints.push({
      time: hourlyTimes[i],
      pm25: hourlyPm25[i] ?? null,
      aqi: hourlyUsAqi[i] ?? null,
    });
  }

  return {
    currentPm25,
    hourly: hourlyPoints,
    observedAt: json.current?.time || fetchedAt,
    fetchedAt,
    source: {
      id: 'open-meteo',
      name: 'Open-Meteo Air Quality (CAMS Global)',
      dataType: 'modelled',
      resolutionNote: 'Modelled CAMS atmospheric forecast (~25 km spatial resolution).',
      attribution: OPEN_METEO_ATTRIBUTION,
    },
  };
}

/**
 * Fetches air quality data from Open-Meteo with timeout and error handling.
 */
export async function fetchOpenMeteoAir(
  lat: number,
  lon: number,
  options?: { timeoutMs?: number; country?: string },
): Promise<AirSnapshot> {
  const timeoutMs = options?.timeoutMs || 6000;
  const targetRegion = options?.country === 'IN' ? 'IN' : 'US';

  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${roundedLat}&longitude=${roundedLon}&hourly=pm2_5,us_aqi,european_aqi&current=pm2_5&timezone=auto`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Open-Meteo API returned HTTP status ${response.status}`);
    }

    const data: OpenMeteoAirResponse = await response.json();
    const rawInput = parseOpenMeteoResponse(data);
    return normalizeAirQuality(rawInput, new Date(), targetRegion);
  } catch (error: unknown) {
    clearTimeout(timer);
    const msg = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Failed to fetch air quality data from Open-Meteo: ${msg}`);
  }
}

