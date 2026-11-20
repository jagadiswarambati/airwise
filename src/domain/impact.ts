import {
  Action,
  AirSnapshot,
  Confidence,
  HouseholdProfile,
  ImpactDirection,
  ImpactLabel,
  ImpactStatement,
} from './types';
import { calculateConfidence } from './confidence';
import { DEFAULT_CARPOOL_OCCUPANCY } from './config/thresholds';

export interface ImpactCalculationOptions {
  commuteForecastDiffUgm3?: number;
}

/**
 * Formula E1: Avoided vehicle-kilometers (vkm)
 * - Carpooling: vkm = oneWayKm * 2 * tripsPerWeek * (1 - 1/occupancy)
 * - Remote work / trip elimination: vkm = oneWayKm * 2 * tripsAvoided
 */
export function calculateAvoidedVkm(
  actionId: string,
  profile: HouseholdProfile,
): number | undefined {
  const { oneWayKm, tripsPerWeek } = profile.travel;
  if (!oneWayKm || oneWayKm <= 0) {
    return undefined;
  }

  if (actionId === 'MO-03' || actionId === 'CM-02') {
    // Carpool: assumes 2 trips per week shared with default occupancy of 2
    const sharedTrips = Math.min(tripsPerWeek, 2);
    if (sharedTrips <= 0) return undefined;
    const vkm = oneWayKm * 2 * sharedTrips * (1 - 1 / DEFAULT_CARPOOL_OCCUPANCY);
    return Math.round(vkm * 10) / 10;
  }

  if (actionId === 'MO-05') {
    // Remote work 1 day per week: eliminates 1 round trip
    const vkm = oneWayKm * 2 * 1;
    return Math.round(vkm * 10) / 10;
  }

  if (actionId === 'MO-04') {
    // Combining errands: saves approx. 1 short round trip per week
    const vkm = Math.min(oneWayKm * 2, 10);
    return Math.round(vkm * 10) / 10;
  }

  if (actionId === 'MO-07') {
    // Walking short trips: replaces approx. 2 km round trip per week
    const vkm = 2.0;
    return Math.round(vkm * 10) / 10;
  }

  return undefined;
}

/**
 * Builds a complete, verified Dual-Axis ImpactStatement for any catalog action.
 * Strict invariants:
 * - Exposure and emissions scored independently.
 * - Exposure reduction never implies emission reduction (and vice versa).
 * - Label must be 'Measured', 'Estimated', or 'Recommended'.
 * - Confidence follows min(evidence, freshness, dataType).
 */
export function buildImpactStatement(
  action: Action,
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  options?: ImpactCalculationOptions,
): ImpactStatement {
  const { impactSpec } = action;
  const { freshness, source } = snapshot;

  const exposureConfidence: Confidence = calculateConfidence(
    impactSpec.exposure.evidence,
    freshness,
    source.dataType,
    true, // exposure-dependent
  );

  const emissionsConfidence: Confidence = calculateConfidence(
    impactSpec.emissions.evidence,
    freshness,
    source.dataType,
    false, // emissions action is level-independent (Rule P-15)
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

  // Formula E1: Avoided vehicle-km
  if (impactSpec.emissions.hasFormula === 'E1') {
    const vkm = calculateAvoidedVkm(action.id, profile);
    if (vkm !== undefined && vkm > 0) {
      emissionsValue = { vkm };
      emissionsLabel = 'Estimated';
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
    explanation = 'Lowers community emissions; exposure reduction depends on ambient conditions.';
  } else {
    explanation = 'Provides protective personal health and indoor air support.';
  }

  return {
    exposure: {
      direction: exposureDirection,
      magnitude: exposureMagnitude,
      label: exposureLabel,
      confidence: exposureConfidence,
      note: impactSpec.exposure.noteTemplate,
    },
    emissions: {
      direction: emissionsDirection,
      value: emissionsValue,
      label: emissionsLabel,
      confidence: emissionsConfidence,
      note: impactSpec.emissions.noteTemplate,
    },
    assumptions: [...impactSpec.assumptions],
    doesNotChange: impactSpec.doesNotChange,
    explanation,
  };
}

