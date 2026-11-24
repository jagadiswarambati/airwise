import { type Daylight, type DataFreshness, type HouseholdProfile, type RiskLevel, type TimeSlot } from './types';
import { COMMUTE_DIFF_MIN_PERCENT, COMMUTE_DIFF_MIN_UGM3 } from './config/thresholds';
import { getNowInLocation, parseLocalMinuteOfDay } from './time';

export interface MobilityPolicyResult {
  actionIds: string[];
  forbiddenActionIds: string[];
  commuteShiftFeasible: boolean;
  forecastDifferenceUgm3?: number;
  explanations: Record<string, string>;
}

/**
 * Checks whether the specified time is in daylight given sunrise and sunset times.
 * If daylight is undefined, returns false (Rule P-08, Decision A-22).
 * Uses location-local time parsing to avoid browser timezone drift.
 */
export function isDaylightHour(
  daylight?: Daylight,
  currentTime?: Date | string,
  utcOffsetSeconds?: number,
): boolean {
  if (!daylight?.sunrise || !daylight?.sunset || !currentTime) {
    return false;
  }

  const riseMinutes = parseLocalMinuteOfDay(daylight.sunrise, utcOffsetSeconds);
  const setMinutes = parseLocalMinuteOfDay(daylight.sunset, utcOffsetSeconds);

  let curMinutes: number;
  if (typeof currentTime === 'string') {
    curMinutes = parseLocalMinuteOfDay(currentTime, utcOffsetSeconds);
  } else {
    curMinutes = getNowInLocation(currentTime, utcOffsetSeconds ?? 0).minuteOfDay;
  }

  if (riseMinutes === 0 && setMinutes === 0) {
    return false;
  }

  return curMinutes >= riseMinutes && curMinutes <= setMinutes;
}

/**
 * Mobility policy engine:
 * Evaluates commute options, transport modes, timing shifts, trip combining,
 * carpooling, public transit, walking/cycling, and remote telework.
 *
 * Rules:
 * - P-08: Walking/cycling (MO-07) ONLY if effective level <= 1, daylight, and fresh data.
 * - P-16: Commute shift (MO-01) ONLY if canShiftTime AND forecast difference >= 5 µg/m³ AND >= 15%.
 * - P-17: Remote work (MO-05) ONLY if canWorkRemotely.
 * - P-18: Mode gating: MO-03 (carpool) & MO-06 (engine-off) only if user drives or rides;
 *   MO-02 (transit) only if transitAvailable is true or unknown.
 * - A-25: Public transit (MO-02) not offered for sensitive members at level >= 3 (outdoor waiting risk).
 * - P-20: Outdoor worker guidance emphasized.
 */
export function evaluateMobilityPolicy(
  profile: HouseholdProfile,
  effectiveLevel: RiskLevel,
  freshness: DataFreshness,
  slots: TimeSlot[],
  hasSensitiveMembers: boolean,
  daylight?: Daylight,
  currentTime?: Date | string,
  utcOffsetSeconds?: number,
): MobilityPolicyResult {
  const actionIds: string[] = [];
  const forbiddenActionIds: string[] = [];
  const explanations: Record<string, string> = {};

  const travelModes = profile.travel.modes;
  const isMotorizedDriverOrRider =
    travelModes.includes('car') ||
    travelModes.includes('two_wheeler') ||
    travelModes.includes('auto_rickshaw');

  // 1. Trip Combining (MO-04: Always feasible)
  actionIds.push('MO-04');

  // 2. Walking / Cycling (MO-07 per Rule P-08 and Decision A-22)
  const isDaylight = isDaylightHour(daylight, currentTime, utcOffsetSeconds);
  if (effectiveLevel <= 1 && (freshness === 'fresh' || freshness === 'aging') && isDaylight) {
    if (travelModes.includes('walk') || travelModes.includes('cycle') || profile.travel.oneWayKm <= 3) {
      actionIds.push('MO-07');
    }
  } else {
    forbiddenActionIds.push('MO-07');
    if (effectiveLevel >= 2 || (freshness !== 'fresh' && freshness !== 'aging')) {
      explanations['MO-07'] =
        'Walking or cycling for transit is not suitable today due to elevated particulate levels and increased exertion exposure.';
    } else {
      explanations['MO-07'] =
        'Walking or cycling for transit is suppressed because daylight conditions cannot be confirmed or travel is outside daylight hours.';
    }
  }

  // 3. Commute Shift (MO-01 per Rule P-16)
  let commuteShiftFeasible = false;
  let forecastDifferenceUgm3: number | undefined = undefined;

  if (profile.travel.canShiftTime) {
    const morningCommuteSlot = slots.find((s) => s.id === 'commute-out');
    const earlierSlot = slots.find((s) => s.id === 'early-morning');
    const daytimeSlot = slots.find((s) => s.id === 'daytime');

    const usualPm25 = morningCommuteSlot?.forecastMeanPm25 ?? null;
    const altPm25 = earlierSlot?.forecastMeanPm25 ?? daytimeSlot?.forecastMeanPm25 ?? null;

    if (usualPm25 !== null && altPm25 !== null && usualPm25 > altPm25) {
      const diff = usualPm25 - altPm25;
      const pct = usualPm25 > 0 ? diff / usualPm25 : 0;

      if (diff >= COMMUTE_DIFF_MIN_UGM3 && pct >= COMMUTE_DIFF_MIN_PERCENT) {
        commuteShiftFeasible = true;
        forecastDifferenceUgm3 = Math.round(diff * 10) / 10;
        actionIds.push('MO-01');
        explanations['MO-01'] = `Shifting commute departure can reduce travel exposure by approx. ${forecastDifferenceUgm3} µg/m³ based on the hourly forecast.`;
      }
    }
  }

  if (!commuteShiftFeasible) {
    forbiddenActionIds.push('MO-01');
  }

  // 4. Remote Work (MO-05 per Rule P-17)
  if (profile.travel.canWorkRemotely && effectiveLevel >= 2) {
    actionIds.push('MO-05');
  } else {
    forbiddenActionIds.push('MO-05');
  }

  // 5. Motorized Driver Actions (P-18: Carpooling MO-03 & Engine Off MO-06)
  if (isMotorizedDriverOrRider) {
    actionIds.push('MO-03'); // Carpool
    actionIds.push('MO-06'); // Engine off when idling
  } else {
    forbiddenActionIds.push('MO-03');
    forbiddenActionIds.push('MO-06');
  }

  // 6. Public Transit (MO-02 per P-18 & Decision A-25)
  if (profile.travel.transitAvailable === false) {
    forbiddenActionIds.push('MO-02');
  } else if (hasSensitiveMembers && effectiveLevel >= 3) {
    // Decision A-25: Exclude public transport for sensitive members at level >= 3
    forbiddenActionIds.push('MO-02');
    explanations['MO-02'] =
      'Public transit is not recommended for sensitive members today due to prolonged unshielded waiting at outdoor stops.';
  } else {
    actionIds.push('MO-02');
  }

  // 7. Outdoor Worker Guidance (P-20)
  if (profile.travel.outdoorWorker) {
    explanations['PE-02'] =
      'Outdoor workers should prioritize continuous fitted respirator use and plan shaded hydration breaks.';
  }

  return {
    actionIds,
    forbiddenActionIds,
    commuteShiftFeasible,
    forecastDifferenceUgm3,
    explanations,
  };
}
