import { type Daylight, type DataFreshness, type HouseholdProfile, type RiskLevel, type TimeSlot } from './types';
import { COMMUTE_DIFF_MIN_PERCENT, COMMUTE_DIFF_MIN_UGM3 } from './config/thresholds';
import { getNowInLocation, parseLocalMinuteOfDay } from './time';

/**
 * MobilityPolicyResult.
 */
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

function evaluateWalkingCycling(
  profile: HouseholdProfile,
  effectiveLevel: RiskLevel,
  freshness: DataFreshness,
  isDaylight: boolean,
): {
  approved: boolean;
  forbidden: boolean;
  explanation?: string;
} {
  const travelModes = profile.travel.modes;
  const isFreshOrAging = freshness === 'fresh' || freshness === 'aging';
  if (effectiveLevel <= 1 && isFreshOrAging && isDaylight) {
    const isWalkOrCycle =
      travelModes.includes('walk') || travelModes.includes('cycle') || profile.travel.oneWayKm <= 3;
    return { approved: isWalkOrCycle, forbidden: !isWalkOrCycle };
  }

  const explanation =
    effectiveLevel >= 2 || !isFreshOrAging
      ? 'Walking or cycling for transit is not suitable today due to elevated particulate levels and increased exertion exposure.'
      : 'Walking or cycling for transit is suppressed because daylight conditions cannot be confirmed or travel is outside daylight hours.';

  return { approved: false, forbidden: true, explanation };
}

function findCommutePm25Values(slots: TimeSlot[]): {
  usualPm25: number | null;
  altPm25: number | null;
} {
  const morningCommuteSlot = slots.find((s) => s.id === 'commute-out');
  const earlierSlot = slots.find((s) => s.id === 'early-morning');
  const daytimeSlot = slots.find((s) => s.id === 'daytime');

  const usualPm25 = morningCommuteSlot?.forecastMeanPm25 ?? null;
  const altPm25 = earlierSlot?.forecastMeanPm25 ?? daytimeSlot?.forecastMeanPm25 ?? null;
  return { usualPm25, altPm25 };
}

function evaluateCommuteShift(
  profile: HouseholdProfile,
  slots: TimeSlot[],
): {
  feasible: boolean;
  differenceUgm3?: number;
  explanation?: string;
} {
  if (!profile.travel.canShiftTime) return { feasible: false };

  const { usualPm25, altPm25 } = findCommutePm25Values(slots);
  if (usualPm25 === null || altPm25 === null || usualPm25 <= altPm25) {
    return { feasible: false };
  }

  const diff = usualPm25 - altPm25;
  const pct = diff / usualPm25;
  if (diff < COMMUTE_DIFF_MIN_UGM3 || pct < COMMUTE_DIFF_MIN_PERCENT) {
    return { feasible: false };
  }

  const forecastDifferenceUgm3 = Math.round(diff * 10) / 10;
  return {
    feasible: true,
    differenceUgm3: forecastDifferenceUgm3,
    explanation: `Shifting commute departure can reduce travel exposure by approx. ${forecastDifferenceUgm3} µg/m³ based on the hourly forecast.`,
  };
}

function evaluateTransit(
  profile: HouseholdProfile,
  effectiveLevel: RiskLevel,
  hasSensitiveMembers: boolean,
): {
  approved: boolean;
  explanation?: string;
} {
  if (profile.travel.transitAvailable === false) {
    return { approved: false };
  }
  if (hasSensitiveMembers && effectiveLevel >= 3) {
    return {
      approved: false,
      explanation:
        'Public transit is not recommended for sensitive members today due to prolonged unshielded waiting at outdoor stops.',
    };
  }
  return { approved: true };
}

function isMotorizedProfile(modes: HouseholdProfile['travel']['modes']): boolean {
  return modes.includes('car') || modes.includes('two_wheeler') || modes.includes('auto_rickshaw');
}

/**
 * Mobility policy engine:
 * Evaluates commute options, transport modes, timing shifts, trip combining,
 * carpooling, public transit, walking/cycling, and remote telework.
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
  const actionIds: string[] = ['MO-04'];
  const forbiddenActionIds: string[] = [];
  const explanations: Record<string, string> = {};

  const isDaylight = isDaylightHour(daylight, currentTime, utcOffsetSeconds);
  const walkCycling = evaluateWalkingCycling(profile, effectiveLevel, freshness, isDaylight);
  if (walkCycling.approved) actionIds.push('MO-07');
  if (walkCycling.forbidden) forbiddenActionIds.push('MO-07');
  if (walkCycling.explanation) explanations['MO-07'] = walkCycling.explanation;

  const commuteShift = evaluateCommuteShift(profile, slots);
  if (commuteShift.feasible) {
    actionIds.push('MO-01');
    if (commuteShift.explanation) explanations['MO-01'] = commuteShift.explanation;
  } else {
    forbiddenActionIds.push('MO-01');
  }

  if (profile.travel.canWorkRemotely && effectiveLevel >= 2) {
    actionIds.push('MO-05');
  } else {
    forbiddenActionIds.push('MO-05');
  }

  if (isMotorizedProfile(profile.travel.modes)) {
    actionIds.push('MO-03', 'MO-06');
  } else {
    forbiddenActionIds.push('MO-03', 'MO-06');
  }

  const transit = evaluateTransit(profile, effectiveLevel, hasSensitiveMembers);
  if (transit.approved) {
    actionIds.push('MO-02');
  } else {
    forbiddenActionIds.push('MO-02');
    if (transit.explanation) explanations['MO-02'] = transit.explanation;
  }

  if (profile.travel.outdoorWorker) {
    explanations['PE-02'] =
      'Outdoor workers should prioritize continuous fitted respirator use and plan shaded hydration breaks.';
  }

  return {
    actionIds,
    forbiddenActionIds,
    commuteShiftFeasible: commuteShift.feasible,
    forecastDifferenceUgm3: commuteShift.differenceUgm3,
    explanations,
  };
}
