import { DataFreshness, HourlyPoint } from './types';
import {
  FRESH_THRESHOLD_HOURS,
  AGING_THRESHOLD_HOURS,
  STALE_THRESHOLD_HOURS,
} from './config/thresholds';

/**
 * Determines data freshness from fetchedAt timestamp and coverage of current hour.
 * Decision A-06:
 * - fresh <= 3 hours (and series covers current hour)
 * - aging > 3 hours and <= 12 hours
 * - stale > 12 hours and <= 48 hours
 * - none > 48 hours, missing timestamps, or series lacks current hour
 */
export function determineFreshness(
  fetchedAt: string | Date | null | undefined,
  hourlySeries: HourlyPoint[] = [],
  currentTime?: Date,
  _utcOffsetSeconds?: number,
): DataFreshness {
  if (!fetchedAt) {
    return 'none';
  }

  const fetchedDate = typeof fetchedAt === 'string' ? new Date(fetchedAt) : fetchedAt;
  if (isNaN(fetchedDate.getTime())) {
    return 'none';
  }

  const referenceDate = currentTime ?? fetchedDate;
  const ageMs = referenceDate.getTime() - fetchedDate.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Future timestamp guard (clock skew > 1 hour)
  if (ageHours < -1) {
    return 'none';
  }

  if (ageHours > STALE_THRESHOLD_HOURS) {
    return 'none';
  }

  // If hourly series is completely empty, we lack series coverage
  if (hourlySeries.length === 0) {
    return ageHours <= FRESH_THRESHOLD_HOURS ? 'aging' : 'stale';
  }

  if (ageHours <= FRESH_THRESHOLD_HOURS) {
    return 'fresh';
  }

  if (ageHours <= AGING_THRESHOLD_HOURS) {
    return 'aging';
  }

  return 'stale';
}

