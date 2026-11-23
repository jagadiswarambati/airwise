import {
  Action,
  AirSnapshot,
  Confidence,
  HouseholdProfile,
  ImpactDirection,
  ImpactLabel,
  ImpactStatement,
} from './types';
import { calculateExposureConfidence, calculateEmissionsConfidence } from './confidence';
import {
  DEFAULT_CARPOOL_DAYS,
  DEFAULT_REMOTE_DAYS,
  DEFAULT_CARPOOL_OCCUPANCY,
} from './config/thresholds';

export interface ImpactCalculationOptions {
  commuteForecastDiffUgm3?: number;
}

/**
 * Formula E1: Avoided vehicle-kilometers (vkm) per week (IMPACT_METHODOLOGY.md §5)
 *
 * Rules:
 * - Numeric only for skipped or carpooled motor trips (MO-03, CM-02, MO-05).
 * - Combined trips (MO-04), engine off (MO-06), walking (MO-07) are qualitative only (Recommended).
 * - Inputs validated: 0 < oneWayKm <= 100; integer tripsPerWeek (0-14); motorised mode only.
 * - Skipped/remote trip: vkm = oneWayKm * 2 * tripsAvoided
 * - Carpool: vkm = oneWayKm * 2 * tripsAvoided * (1 - 1/occupancy)
 * - Returns undefined if inputs invalid, non-motorised, or tripsAvoided = 0.
 */
export function calculateAvoidedVkm(
  actionId: string,
  profile: HouseholdProfile,
  customOccupancy: number = DEFAULT_CARPOOL_OCCUPANCY,
): number | undefined {
  const { oneWayKm, tripsPerWeek, modes, canWorkRemotely } = profile.travel;

  // Validate inputs
  if (typeof oneWayKm !== 'number' || oneWayKm <= 0 || oneWayKm > 100) {
    return undefined;
  }
  if (
    typeof tripsPerWeek !== 'number' ||
    !Number.isInteger(tripsPerWeek) ||
    tripsPerWeek < 0 ||
    tripsPerWeek > 14
  ) {
    return undefined;
  }
  if (tripsPerWeek === 0) {
    return undefined;
  }

  // Must be motorised mode
  const isMotorised = modes.some(
    (m) => m === 'car' || m === 'two_wheeler' || (m as string) === 'auto_rickshaw',
  );
  if (!isMotorised) {
    return undefined;
  }

  // Validate occupancy
  const occupancy =
    Number.isInteger(customOccupancy) && customOccupancy >= 2 && customOccupancy <= 5
      ? customOccupancy
      : DEFAULT_CARPOOL_OCCUPANCY;

  if (actionId === 'MO-03' || actionId === 'CM-02') {
    // Carpool: defaults to DEFAULT_CARPOOL_DAYS (2) days/week
    const tripsAvoided = Math.min(tripsPerWeek, DEFAULT_CARPOOL_DAYS);
    if (tripsAvoided <= 0) return undefined;
    const vkm = oneWayKm * 2 * tripsAvoided * (1 - 1 / occupancy);
    return Math.round(vkm * 10) / 10;
  }

  if (actionId === 'MO-05') {
    // Remote work on high pollution day: defaults to DEFAULT_REMOTE_DAYS (1) day/week
    if (!canWorkRemotely) return undefined;
    const tripsAvoided = Math.min(tripsPerWeek, DEFAULT_REMOTE_DAYS);
    if (tripsAvoided <= 0) return undefined;
    const vkm = oneWayKm * 2 * tripsAvoided;
    return Math.round(vkm * 10) / 10;
  }

  // MO-04, MO-06, MO-07 are strictly qualitative per IMPACT_METHODOLOGY §5
  return undefined;
}

/**
 * Builds a complete, verified Dual-Axis ImpactStatement for any catalog action.
 * Strict invariants:
 * - Exposure and emissions scored independently.
 * - Exposure reduction never implies emission reduction (and vice versa).
 * - Label must be 'Measured', 'Estimated', or 'Recommended'.
 * - Confidence: exposure = min(evidence, freshness, dataType); emissions = min(evidence, inputTier) (A-31).
 */
export function buildImpactStatement(
  action: Action,
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  options?: ImpactCalculationOptions,
): ImpactStatement {
  const { impactSpec } = action;
  const { freshness, source } = snapshot;

  const exposureConfidence: Confidence = calculateExposureConfidence(
    impactSpec.exposure.evidence,
    freshness,
    source.dataType,
  );

  const hasValidInputs =
    profile.travel.oneWayKm > 0 &&
    profile.travel.oneWayKm <= 100 &&
    profile.travel.tripsPerWeek > 0;

  const emissionsConfidence: Confidence = calculateEmissionsConfidence(
    impactSpec.emissions.evidence,
    hasValidInputs ? 'self-reported' : 'missing',
  );

  let exposureMagnitude: string | undefined = undefined;
  let exposureLabel: ImpactLabel = impactSpec.exposure.label;

  // Formula X1: Commute forecast difference
  if (action.id === 'MO-01' && options?.commuteForecastDiffUgm3) {
    exposureMagnitude = `~${options.commuteForecastDiffUgm3} µg/m³ lower exposure`;
    exposureLabel = 'Estimated';
  }

  let emissionsValue: { vkm: number } | undefined = undefined;
  let emissionsLabel: ImpactLabel = impactSpec.emissions.label;

  // Formula E1: Avoided vehicle-km (Estimated only when numeric formula applies)
  if (impactSpec.emissions.hasFormula === 'E1') {
    const vkm = calculateAvoidedVkm(action.id, profile);
    if (vkm !== undefined && vkm > 0) {
      emissionsValue = { vkm };
      emissionsLabel = 'Estimated';
    } else {
      emissionsLabel = 'Recommended';
    }
  }

  const exposureDirection: ImpactDirection = impactSpec.exposure.direction;
  const emissionsDirection: ImpactDirection = impactSpec.emissions.direction;

  let explanation = '';
  if (exposureDirection === 'reduces' && emissionsDirection === 'reduces') {
    explanation = 'Reduces both your personal exposure and household emissions.';
  } else if (exposureDirection === 'reduces') {
    explanation = 'Protects your household air; does not reduce outdoor environmental emissions.';
  } else if (emissionsDirection === 'reduces') {
    explanation = 'Reduces outdoor emissions; does not automatically clean indoor air.';
  } else {
    explanation = 'Targeted preventive action based on household guidance.';
  }

  return {
    exposure: {
      direction: exposureDirection,
      label: exposureLabel,
      confidence: exposureConfidence,
      magnitude: exposureMagnitude,
      note: impactSpec.exposure.noteTemplate,
    },
    emissions: {
      direction: emissionsDirection,
      label: emissionsLabel,
      confidence: emissionsConfidence,
      value: emissionsValue,
      note: impactSpec.emissions.noteTemplate,
    },
    assumptions: impactSpec.assumptions,
    doesNotChange: impactSpec.doesNotChange,
    explanation,
  };
}
