import { type HourlyPoint, type Trend } from './types';
import { TREND_CHANGE_MIN_PERCENT, TREND_CHANGE_MIN_UGM3 } from './config/thresholds';
import { parseLocalTimeToUtcEpoch } from './time';

/**
 * Calculates air quality trend (rising, steady, falling, unknown) from hourly PM2.5 series.
 * Supports explicit utcOffsetSeconds to ensure timezone invariance.
 */
export function calculateTrend(
  hourlySeries: HourlyPoint[],
  referenceTime?: Date,
  utcOffsetSeconds?: number,
): Trend {
  const validPoints = hourlySeries.filter(
    (p): p is HourlyPoint & { pm25: number } => p.pm25 !== null && !isNaN(p.pm25),
  );

  if (validPoints.length < 2) {
    return 'unknown';
  }

  // If reference time is supplied, select up to 6 hours around/before reference time
  let pointsToAnalyze = validPoints;
  if (referenceTime) {
    const refMs = referenceTime.getTime();
    const pastPoints = validPoints.filter((p) => {
      const epoch = parseLocalTimeToUtcEpoch(p.time, utcOffsetSeconds ?? 0);
      return epoch <= refMs;
    });
    if (pastPoints.length >= 2) {
      pointsToAnalyze = pastPoints.slice(-6);
    } else {
      pointsToAnalyze = validPoints.slice(0, 6);
    }
  } else {
    pointsToAnalyze = validPoints.slice(-6);
  }

  if (pointsToAnalyze.length < 2) {
    return 'unknown';
  }

  const mid = Math.floor(pointsToAnalyze.length / 2);
  const earlierPoints = pointsToAnalyze.slice(0, mid);
  const recentPoints = pointsToAnalyze.slice(mid);

  const meanEarlier =
    earlierPoints.reduce((acc, p) => acc + p.pm25, 0) / earlierPoints.length;
  const meanRecent =
    recentPoints.reduce((acc, p) => acc + p.pm25, 0) / recentPoints.length;

  const delta = meanRecent - meanEarlier;
  const absDelta = Math.abs(delta);
  const relativeChange = meanEarlier > 0 ? absDelta / meanEarlier : 1;

  if (absDelta >= TREND_CHANGE_MIN_UGM3 && relativeChange >= TREND_CHANGE_MIN_PERCENT) {
    return delta > 0 ? 'rising' : 'falling';
  }

  return 'steady';
}

