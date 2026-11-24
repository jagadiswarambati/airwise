import {
  type AirSnapshot,
  type AQIReading,
  type AQIStandard,
  type DataFreshness,
  type DataSourceMetadata,
  type HourlyPoint,
  type Trend,
} from './types';
import { determineFreshness } from './freshness';
import { calculateTrend } from './trend';

export interface RawAirDataInput {
  currentPm25: number | null;
  hourly: Array<{
    time: string;
    pm25: number | null;
    aqi?: number | null;
  }>;
  observedAt: string;
  fetchedAt: string;
  source: {
    id: string;
    name: string;
    dataType: 'modelled' | 'observed' | 'sample';
    resolutionNote: string;
    attribution?: string;
  };
  aqi?: {
    value: number;
    standard: AQIStandard;
  };
  officialAlert?: {
    active: boolean;
    text?: string;
  };
  utcOffsetSeconds?: number;
  timezone?: string;
}

/**
 * Standard linear interpolation for AQI calculation from PM2.5 concentration.
 * Formula: Ip = ((I_hi - I_lo) / (BP_hi - BP_lo)) * (Cp - BP_lo) + I_lo
 */
function interpolateAqi(
  cp: number,
  breakpoints: Array<{ bpLo: number; bpHi: number; iLo: number; iHi: number }>,
): number {
  if (cp < 0) return 0;
  for (const b of breakpoints) {
    if (cp <= b.bpHi) {
      const aqi = ((b.iHi - b.iLo) / (b.bpHi - b.bpLo)) * (cp - b.bpLo) + b.iLo;
      return Math.round(aqi);
    }
  }
  const last = breakpoints[breakpoints.length - 1];
  const aqi = ((last.iHi - last.iLo) / (last.bpHi - last.bpLo)) * (cp - last.bpLo) + last.iLo;
  return Math.min(500, Math.round(aqi));
}

/**
 * CPCB Indian National AQI Breakpoints for PM2.5 (24-hour average in µg/m³)
 */
const CPCB_PM25_BREAKPOINTS = [
  { bpLo: 0, bpHi: 30, iLo: 0, iHi: 50 },
  { bpLo: 31, bpHi: 60, iLo: 51, iHi: 100 },
  { bpLo: 61, bpHi: 90, iLo: 101, iHi: 200 },
  { bpLo: 91, bpHi: 120, iLo: 201, iHi: 300 },
  { bpLo: 121, bpHi: 250, iLo: 301, iHi: 400 },
  { bpLo: 251, bpHi: 500, iLo: 401, iHi: 500 },
];

/**
 * US EPA 2024 AQI Breakpoints for PM2.5 (µg/m³)
 */
const US_EPA_PM25_BREAKPOINTS = [
  { bpLo: 0.0, bpHi: 9.0, iLo: 0, iHi: 50 },
  { bpLo: 9.1, bpHi: 35.4, iLo: 51, iHi: 100 },
  { bpLo: 35.5, bpHi: 55.4, iLo: 101, iHi: 150 },
  { bpLo: 55.5, bpHi: 125.4, iLo: 151, iHi: 200 },
  { bpLo: 125.5, bpHi: 225.4, iLo: 201, iHi: 300 },
  { bpLo: 225.5, bpHi: 500.4, iLo: 301, iHi: 500 },
];

/**
 * Computes AQI from PM2.5 concentration using regional standard formulas.
 * Always marks reading with `isComputed: true` to distinguish from provider-supplied index.
 */
export function computeAqiFromPm25(
  pm25: number,
  standard: 'IN' | 'US' = 'IN',
): AQIReading {
  const breakpoints = standard === 'US' ? US_EPA_PM25_BREAKPOINTS : CPCB_PM25_BREAKPOINTS;
  const aqiValue = interpolateAqi(pm25, breakpoints);
  return {
    value: aqiValue,
    standard,
    isComputed: true,
  };
}

/**
 * Normalizes raw air quality inputs into a validated, deterministic AirSnapshot.
 * - Treats PM2.5 concentration in µg/m³ as the primary signal.
 * - Treats AQI as a derived, secondary indicator.
 * - Preserves source, timestamp, units, and data type.
 * - Never infers PM2.5 from AQI unless a documented conversion is explicitly provided.
 */
export function normalizeAirQuality(
  input: RawAirDataInput,
  currentTime?: Date,
  targetRegion: 'IN' | 'US' = 'IN',
): AirSnapshot {
  const effectiveCurrentTime = currentTime ?? new Date(input.fetchedAt || input.observedAt);

  const normalizedHourly: HourlyPoint[] = input.hourly.map((h) => ({
    time: h.time,
    pm25: h.pm25 !== null && !isNaN(h.pm25) ? Math.max(0, h.pm25) : null,
    aqi: h.aqi !== null && h.aqi !== undefined && !isNaN(h.aqi) ? Math.max(0, h.aqi) : undefined,
  }));

  const nowPm25 =
    input.currentPm25 !== null && !isNaN(input.currentPm25)
      ? Math.max(0, input.currentPm25)
      : null;

  let aqiReading: AQIReading | undefined = undefined;
  if (input.aqi) {
    aqiReading = {
      value: Math.max(0, input.aqi.value),
      standard: input.aqi.standard,
      isComputed: false,
    };
  } else if (nowPm25 !== null) {
    aqiReading = computeAqiFromPm25(nowPm25, targetRegion);
  }

  const freshness: DataFreshness = determineFreshness(
    input.fetchedAt,
    normalizedHourly,
    effectiveCurrentTime,
    input.utcOffsetSeconds,
  );

  const trend: Trend = calculateTrend(normalizedHourly, effectiveCurrentTime, input.utcOffsetSeconds);

  const sourceMetadata: DataSourceMetadata = {
    id: input.source.id,
    name: input.source.name,
    dataType: input.source.dataType,
    resolutionNote: input.source.resolutionNote,
    attribution: input.source.attribution,
  };

  return {
    pm25: {
      now: nowPm25,
      hourly: normalizedHourly,
    },
    aqi: aqiReading,
    trend,
    observedAt: input.observedAt,
    fetchedAt: input.fetchedAt,
    source: sourceMetadata,
    freshness,
    officialAlert: input.officialAlert,
    utcOffsetSeconds: input.utcOffsetSeconds,
    timezone: input.timezone,
  };
}

