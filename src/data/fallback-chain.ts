import { type AirSnapshot, type Location, AirSnapshotSchema } from '../domain/types';
import { getNowInLocation, parseLocalHour } from '../domain/time';
import { airCache } from './cache';
import { fetchApiAir } from './providers/apiAir';
import { type Clock, systemClock } from '../lib/clock';

// Bundled scenario imports
import clearScenario from './samples/clear.json';
import moderateScenario from './samples/moderate.json';
import severeScenario from './samples/severe.json';
import staleScenario from './samples/stale.json';

// Parse and validate sample scenarios at load time with the domain schema
export const parsedClearScenario: AirSnapshot = AirSnapshotSchema.parse(clearScenario);
export const parsedModerateScenario: AirSnapshot = AirSnapshotSchema.parse(moderateScenario);
export const parsedSevereScenario: AirSnapshot = AirSnapshotSchema.parse(severeScenario);
export const parsedStaleScenario: AirSnapshot = AirSnapshotSchema.parse(staleScenario);

export type ScenarioType = 'live' | 'clear' | 'moderate' | 'severe' | 'stale';

export interface AirDataResult {
  snapshot: AirSnapshot;
  sourceTier: 'live' | 'cached' | 'sample';
  isFallback: boolean;
  fallbackReason?: string;
}

/**
 * Regenerates sample scenario timestamps relative to current time
 * with explicit location-time arithmetic so hourly slots align identically
 * regardless of runtime or browser timezone.
 *
 * Per Decision A-05 / A-06:
 * - 'clear', 'moderate', 'severe' align with today's date in location.
 * - 'stale' preserves a fixed age >= 24h old (28h prior to now).
 */
export function getSampleScenarioSnapshot(
  scenario: 'clear' | 'moderate' | 'severe' | 'stale',
  clockOrDate: Clock | Date = systemClock,
): AirSnapshot {
  const now = typeof clockOrDate === 'function' ? clockOrDate() : clockOrDate;
  let template: AirSnapshot;
  switch (scenario) {
    case 'clear':
      template = parsedClearScenario;
      break;
    case 'moderate':
      template = parsedModerateScenario;
      break;
    case 'severe':
      template = parsedSevereScenario;
      break;
    case 'stale':
      template = parsedStaleScenario;
      break;
  }

  const offset = template.utcOffsetSeconds ?? 19800; // Default IST (+5:30)

  if (scenario === 'stale') {
    const staleEpoch = now.getTime() - 28 * 3600 * 1000;
    const staleLoc = getNowInLocation(new Date(staleEpoch), offset);
    const fetchedAt = new Date(staleEpoch).toISOString();

    const hourly = template.pm25.hourly.map((point) => {
      const origH = parseLocalHour(point.time, offset);
      const hh = origH.toString().padStart(2, '0');
      return {
        ...point,
        time: `${staleLoc.dateStr}T${hh}:00:00`,
      };
    });

    return {
      ...template,
      observedAt: fetchedAt,
      fetchedAt,
      utcOffsetSeconds: offset,
      timezone: template.timezone || 'Asia/Kolkata',
      daylight: {
        sunrise: `${staleLoc.dateStr}T06:00:00`,
        sunset: `${staleLoc.dateStr}T18:00:00`,
      },
      pm25: {
        ...template.pm25,
        hourly,
      },
    };
  }

  const loc = getNowInLocation(now, offset);
  const fetchedAt = now.toISOString();

  const hourly = template.pm25.hourly.map((point, index) => {
    const hh = (index % 24).toString().padStart(2, '0');
    return {
      ...point,
      time: `${loc.dateStr}T${hh}:00:00`,
    };
  });

  return {
    ...template,
    observedAt: fetchedAt,
    fetchedAt,
    utcOffsetSeconds: offset,
    timezone: template.timezone || 'Asia/Kolkata',
    daylight: {
      sunrise: `${loc.dateStr}T06:00:00`,
      sunset: `${loc.dateStr}T18:00:00`,
    },
    pm25: {
      ...template.pm25,
      hourly,
    },
  };
}

/**
 * Fallback Chain (Decision A-32):
 * Live Primary Provider -> Cached Reading (fresh/aging/stale) -> Honest Offline Fallback (freshness: 'none')
 *
 * Rules:
 * - Explicit demo scenarios ('clear', 'moderate', 'severe', 'stale') are returned directly without network calls.
 * - In live mode, cached data is used if not expired.
 * - If live fetch fails, the last known cached reading is returned with recomputed freshness.
 * - If live and cache both fail, an honest fallback snapshot with freshness 'none' and pm25.now: null
 *   is returned so Rule P-04 (cautious Level 2 defaults) applies.
 * - NEVER silently substitute sample data for live failures.
 */
function createOfflineFallbackSnapshot(clock: Clock, fallbackReason: string): AirSnapshot {
  return {
    pm25: {
      now: null,
      hourly: [],
    },
    trend: 'unknown',
    observedAt: clock().toISOString(),
    fetchedAt: clock().toISOString(),
    source: {
      id: 'fallback-none',
      name: 'Service Unavailable',
      dataType: 'modelled',
      resolutionNote: 'Offline fallback baseline when live and cached data are unavailable.',
    },
    freshness: 'none',
    isFallback: true,
    fallbackReason,
  };
}

export async function getAirSnapshot(
  options: {
    location: Location;
    scenario?: ScenarioType;
    forceRefresh?: boolean;
  },
  clock: Clock = systemClock,
): Promise<AirDataResult> {
  const { location, scenario = 'live', forceRefresh = false } = options;

  // 1. Explicit Demo Scenario Mode
  if (scenario !== 'live') {
    const snapshot = getSampleScenarioSnapshot(scenario, clock);
    return {
      snapshot,
      sourceTier: 'sample',
      isFallback: false,
    };
  }

  // 2. Check Client Cache first unless forceRefresh is true
  if (!forceRefresh && !airCache.isExpired(location.lat, location.lon, clock)) {
    const cachedSnapshot = airCache.get(location.lat, location.lon, clock);
    if (cachedSnapshot) {
      return {
        snapshot: cachedSnapshot,
        sourceTier: 'cached',
        isFallback: false,
      };
    }
  }

  // 3. Attempt Live Primary Fetch (/api/air)
  try {
    const liveSnapshot = await fetchApiAir(
      location.lat,
      location.lon,
      {
        country: location.country,
        timeoutMs: 5000,
      },
      clock,
    );
    airCache.set(location.lat, location.lon, liveSnapshot, clock);
    return {
      snapshot: liveSnapshot,
      sourceTier: 'live',
      isFallback: false,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Network error';

    // 4. Try Expired or Stale Cache if available (Decision A-06 & A-32)
    const cachedSnapshot = airCache.get(location.lat, location.lon, clock);
    if (cachedSnapshot) {
      return {
        snapshot: cachedSnapshot,
        sourceTier: 'cached',
        isFallback: true,
        fallbackReason: `Live air data fetch failed (${errorMsg}). Displaying previously cached reading.`,
      };
    }

    // 5. Honest Offline Fallback (Decision A-32)
    const fallbackReason = "We couldn't reach the air data service. Using cautious defaults.";
    const fallbackSnapshot = createOfflineFallbackSnapshot(clock, fallbackReason);

    return {
      snapshot: fallbackSnapshot,
      sourceTier: 'live',
      isFallback: true,
      fallbackReason,
    };
  }
}
