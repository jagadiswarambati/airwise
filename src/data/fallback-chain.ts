import { AirSnapshot, Location } from '../domain/types';
import { airCache } from './cache';
import { fetchApiAir } from './providers/apiAir';

// Bundled scenario imports
import clearScenario from './samples/clear.json';
import moderateScenario from './samples/moderate.json';
import severeScenario from './samples/severe.json';
import staleScenario from './samples/stale.json';

export type ScenarioType = 'live' | 'clear' | 'moderate' | 'severe' | 'stale';

export interface AirDataResult {
  snapshot: AirSnapshot;
  sourceTier: 'live' | 'cached' | 'sample';
  isFallback: boolean;
  fallbackReason?: string;
}

/**
 * Regenerates sample scenario timestamps relative to current time
 * (except 'stale' which preserves fixed 24h age per Decision A-05 / A-06).
 */
export function getSampleScenarioSnapshot(scenario: 'clear' | 'moderate' | 'severe' | 'stale'): AirSnapshot {
  let template: AirSnapshot;
  switch (scenario) {
    case 'clear':
      template = clearScenario as unknown as AirSnapshot;
      break;
    case 'moderate':
      template = moderateScenario as unknown as AirSnapshot;
      break;
    case 'severe':
      template = severeScenario as unknown as AirSnapshot;
      break;
    case 'stale':
      template = staleScenario as unknown as AirSnapshot;
      break;
  }

  const now = new Date();
  const fetchedAt =
    scenario === 'stale'
      ? new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
      : now.toISOString();

  // Adjust hourly series times to align with today
  const hourly = template.pm25.hourly.map((point, index) => {
    const pointTime = new Date(now);
    pointTime.setHours(index % 24, 0, 0, 0);
    return {
      ...point,
      time: pointTime.toISOString(),
    };
  });

  const daylight = template.daylight
    ? {
        sunrise: new Date(now).toISOString().slice(0, 10) + 'T06:00:00.000Z',
        sunset: new Date(now).toISOString().slice(0, 10) + 'T18:00:00.000Z',
      }
    : undefined;

  return {
    ...template,
    observedAt: fetchedAt,
    fetchedAt,
    daylight,
    pm25: {
      ...template.pm25,
      hourly,
    },
  };
}

/**
 * Fallback Chain:
 * Primary Live Provider -> Cache -> Bundled Sample Scenarios
 */
export async function getAirSnapshot(options: {
  location: Location;
  scenario?: ScenarioType;
  forceRefresh?: boolean;
}): Promise<AirDataResult> {
  const { location, scenario = 'live', forceRefresh = false } = options;

  // 1. Explicit Demo Scenario Mode
  if (scenario !== 'live') {
    const snapshot = getSampleScenarioSnapshot(scenario);
    return {
      snapshot,
      sourceTier: 'sample',
      isFallback: false,
    };
  }

  // 2. Check Client Cache first unless forceRefresh is true
  if (!forceRefresh) {
    const cachedSnapshot = airCache.get(location.lat, location.lon);
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
    const liveSnapshot = await fetchApiAir(location.lat, location.lon, {
      country: location.country,
      timeoutMs: 5000,
    });
    // Store successful live snapshot in cache
    airCache.set(location.lat, location.lon, liveSnapshot);
    return {
      snapshot: liveSnapshot,
      sourceTier: 'live',
      isFallback: false,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Network error';

    // 4. Try Expired or Stale Cache if available
    const staleCache = airCache.get(location.lat, location.lon);
    if (staleCache) {
      return {
        snapshot: staleCache,
        sourceTier: 'cached',
        isFallback: true,
        fallbackReason: `Live air data fetch failed (${errorMsg}). Displaying previously cached reading.`,
      };
    }

    // 5. Final Resort: Bundled Moderate Sample Scenario
    const fallbackSample = getSampleScenarioSnapshot('moderate');
    return {
      snapshot: fallbackSample,
      sourceTier: 'sample',
      isFallback: true,
      fallbackReason: `Live provider and cache unavailable (${errorMsg}). Displaying demo sample data.`,
    };
  }
}

