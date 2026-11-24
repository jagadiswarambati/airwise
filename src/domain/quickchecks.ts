import { type AirSnapshot, type HouseholdProfile, type RiskLevel } from './types';
import { computeBaseLevel, computeEffectiveLevel } from './levels';
import { decideVentilation } from './ventilation';
import { deriveTimeSlots } from './radar';

export interface QuickCheckResult {
  question: string;
  verdict: 'Yes' | 'No' | 'Brief' | 'With precautions';
  answer: string;
  reasonCode: string;
}

/**
 * Deterministic Quick Checks answering common household questions:
 * 1. "Can my child play outside?"
 * 2. "Should I open a window?"
 * 3. "Can I walk to school?"
 * 4. "Should I run my purifier?"
 *
 * Grounded in rules P-05, P-08, P-09, P-11, and P-22.
 */
export function checkChildPlayOutside(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
): QuickCheckResult {
  const hasChildren = profile.members.some(
    (m) => m.ageGroup === 'u5' || m.ageGroup === '5-12',
  );

  if (snapshot.freshness === 'stale' || snapshot.freshness === 'none') {
    return {
      question: 'Can my child play outside?',
      verdict: 'No',
      answer:
        'Air data is stale or missing. Keep play indoors as a cautious protective measure.',
      reasonCode: 'STALE_DATA_CAUTION',
    };
  }

  if (effectiveLevel >= 2) {
    return {
      question: 'Can my child play outside?',
      verdict: 'No',
      answer:
        'Outdoor air is in Caution or Severe range. Shift active play and exercise indoors to protect developing lungs.',
      reasonCode: 'POLLUTION_HIGH_INDOOR_PLAY',
    };
  }

  return {
    question: 'Can my child play outside?',
    verdict: 'Yes',
    answer:
      hasChildren
        ? 'Outdoor air quality is currently safe for normal outdoor playtime.'
        : 'Outdoor air quality is Clear or Watch; safe for outdoor activity.',
    reasonCode: 'CLEAN_AIR_SAFE_OUTDOORS',
  };
}

/**
 * Deterministically evaluates whether window opening is safe, brief, or prohibited based on inversion forecasts.
 */
export function checkOpenWindow(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
): QuickCheckResult {
  const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, 'IN', snapshot.utcOffsetSeconds);
  const decision = decideVentilation({
    snapshot,
    effectiveLevel,
    slots,
    targetRegion: 'IN',
  });

  if (decision.verdict === 'open') {
    return {
      question: 'Should I open a window?',
      verdict: 'Yes',
      answer: decision.explanation,
      reasonCode: decision.reasonCode,
    };
  }

  if (decision.verdict === 'brief') {
    return {
      question: 'Should I open a window?',
      verdict: 'Brief',
      answer: decision.explanation,
      reasonCode: decision.reasonCode,
    };
  }

  return {
    question: 'Should I open a window?',
    verdict: 'No',
    answer: decision.explanation,
    reasonCode: decision.reasonCode,
  };
}

/**
 * Evaluates outdoor walking safety based on pollution levels, active travel guidelines, and data freshness.
 */
export function checkWalkToSchoolOrWork(
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
): QuickCheckResult {
  if (snapshot.freshness === 'stale' || snapshot.freshness === 'none') {
    return {
      question: 'Can I walk to school or work?',
      verdict: 'No',
      answer: 'Air data is unverified today. Avoid prolonged outdoor walking.',
      reasonCode: 'DATA_UNVERIFIED_WALK_DISCOURAGED',
    };
  }

  if (effectiveLevel <= 1) {
    return {
      question: 'Can I walk to school or work?',
      verdict: 'Yes',
      answer: 'Air quality is Clear or Watch; walking short trips is healthy and zero-emission.',
      reasonCode: 'CLEAN_AIR_WALK_APPROVED',
    };
  }

  if (effectiveLevel === 2) {
    return {
      question: 'Can I walk to school or work?',
      verdict: 'With precautions',
      answer:
        'Air is in Caution range. If walking is necessary, avoid busy truck corridors and wear an N95 respirator if adult/teen.',
      reasonCode: 'CAUTION_WALK_WITH_RESPIRATOR',
    };
  }

  return {
    question: 'Can I walk to school or work?',
    verdict: 'No',
    answer:
      'Air quality is in Protect or Severe range. Walking increases particulate inhalation during heavy physical exertion.',
    reasonCode: 'HIGH_POLLUTION_WALK_FORBIDDEN',
  };
}

/**
 * Evaluates air purifier utilization recommendations based on equipment availability and pollution severity.
 */
export function checkRunPurifier(
  profile: HouseholdProfile,
  effectiveLevel: RiskLevel,
): QuickCheckResult {
  if (!profile.equipment.purifier) {
    return {
      question: 'Should I run my purifier?',
      verdict: 'No',
      answer:
        'Your profile indicates no purifier. Keep windows closed, set up a cleaner bedroom, and use damp mopping.',
      reasonCode: 'NO_PURIFIER_EQUIPMENT',
    };
  }

  if (effectiveLevel >= 2) {
    return {
      question: 'Should I run my purifier?',
      verdict: 'Yes',
      answer:
        'Run your purifier continuously in a closed bedroom or living space for maximum particulate filtration.',
      reasonCode: 'RUN_PURIFIER_HIGH_POLLUTION',
    };
  }

  return {
    question: 'Should I run my purifier?',
    verdict: 'Yes',
    answer:
      'Operating your purifier on low or auto mode helps keep background indoor dust and particles low.',
    reasonCode: 'RUN_PURIFIER_MAINTENANCE',
  };
}

/**
 * Aggregates all four deterministic quick checks for the household's current air conditions.
 */
export function evaluateQuickChecks(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  targetRegion: 'IN' | 'US' = 'IN',
): QuickCheckResult[] {
  const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
  const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);

  return [
    checkChildPlayOutside(profile, snapshot, effectiveLevel),
    checkOpenWindow(profile, snapshot, effectiveLevel),
    checkWalkToSchoolOrWork(snapshot, effectiveLevel),
    checkRunPurifier(profile, effectiveLevel),
  ];
}
