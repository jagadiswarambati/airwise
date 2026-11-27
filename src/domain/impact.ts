import {
  type Action,
  type AirSnapshot,
  type Confidence,
  type HouseholdProfile,
  type ImpactDirection,
  type ImpactLabel,
  type ImpactStatement,
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

function isValidTravelInput(travel: HouseholdProfile['travel']): boolean {
  const { oneWayKm, tripsPerWeek, modes } = travel;
  if (typeof oneWayKm !== 'number' || oneWayKm <= 0 || oneWayKm > 100) {
    return false;
  }
  if (
    typeof tripsPerWeek !== 'number' ||
    !Number.isInteger(tripsPerWeek) ||
    tripsPerWeek <= 0 ||
    tripsPerWeek > 14
  ) {
    return false;
  }
  return modes.some(
    (m) => m === 'car' || m === 'two_wheeler' || m === 'auto_rickshaw',
  );
}

function resolveCarpoolOccupancy(customOccupancy: number): number {
  return Number.isInteger(customOccupancy) && customOccupancy >= 2 && customOccupancy <= 5
    ? customOccupancy
    : DEFAULT_CARPOOL_OCCUPANCY;
}

function calculateCarpoolVkm(
  oneWayKm: number,
  tripsPerWeek: number,
  occupancy: number,
): number | undefined {
  const tripsAvoided = Math.min(tripsPerWeek, DEFAULT_CARPOOL_DAYS);
  if (tripsAvoided <= 0) return undefined;
  const vkm = oneWayKm * 2 * tripsAvoided * (1 - 1 / occupancy);
  return Math.round(vkm * 10) / 10;
}

function calculateRemoteVkm(
  oneWayKm: number,
  tripsPerWeek: number,
  canWorkRemotely: boolean,
): number | undefined {
  if (!canWorkRemotely) return undefined;
  const tripsAvoided = Math.min(tripsPerWeek, DEFAULT_REMOTE_DAYS);
  if (tripsAvoided <= 0) return undefined;
  const vkm = oneWayKm * 2 * tripsAvoided;
  return Math.round(vkm * 10) / 10;
}

/**
 * Formula E1: Avoided vehicle-kilometers (vkm) per week (IMPACT_METHODOLOGY.md §5)
 */
export function calculateAvoidedVkm(
  actionId: string,
  profile: HouseholdProfile,
  customOccupancy: number = DEFAULT_CARPOOL_OCCUPANCY,
): number | undefined {
  if (!isValidTravelInput(profile.travel)) {
    return undefined;
  }
  const { oneWayKm, tripsPerWeek, canWorkRemotely } = profile.travel;

  if (actionId === 'MO-03' || actionId === 'CM-02') {
    const occupancy = resolveCarpoolOccupancy(customOccupancy);
    return calculateCarpoolVkm(oneWayKm, tripsPerWeek, occupancy);
  }

  if (actionId === 'MO-05') {
    return calculateRemoteVkm(oneWayKm, tripsPerWeek, canWorkRemotely);
  }

  return undefined;
}

function getImpactExplanation(
  exposureDirection: ImpactDirection,
  emissionsDirection: ImpactDirection,
): string {
  if (exposureDirection === 'reduces' && emissionsDirection === 'reduces') {
    return 'Reduces both your personal exposure and household emissions.';
  }
  if (exposureDirection === 'reduces') {
    return 'Protects your household air; does not reduce outdoor environmental emissions.';
  }
  if (emissionsDirection === 'reduces') {
    return 'Reduces outdoor emissions; does not automatically clean indoor air.';
  }
  return 'Targeted preventive action based on household guidance.';
}

/**
 * Builds a complete, verified Dual-Axis ImpactStatement for any catalog action.
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

  if (action.id === 'MO-01' && options?.commuteForecastDiffUgm3) {
    exposureMagnitude = `~${options.commuteForecastDiffUgm3} µg/m³ lower exposure`;
    exposureLabel = 'Estimated';
  }

  let emissionsValue: { vkm: number } | undefined = undefined;
  let emissionsLabel: ImpactLabel = impactSpec.emissions.label;

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
    explanation: getImpactExplanation(exposureDirection, emissionsDirection),
  };
}
