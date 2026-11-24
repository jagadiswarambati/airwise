import { type HouseholdProfile, type RiskLevel } from './types';
import { COMBUSTION_SAFETY_CAVEAT } from './templates';

export interface IndoorPolicyResult {
  actionIds: string[];
  mandatoryActionIds: string[];
  forbiddenActionIds: string[];
  safetyCaveats: string[];
  explanations: Record<string, string>;
}

/**
 * Indoor-air policy engine:
 * Evaluates indoor sources, housing structure, cooking fuel, heating, and equipment.
 * Generates source-control, cleaner-room, cooking, and equipment-specific recommendations.
 *
 * Rules:
 * - Adapt to: no purifier, portable purifier, window AC, central HVAC.
 * - P-11: IN-05 requires purifier; IN-06 requires AC/HVAC; IN-07 requires exhaust.
 * - P-12: If no exhaust, IN-08 (low-smoke cooking) substitutes.
 * - P-22: Combustion heating or biomass cooking without exhaust forbids sealing gaps (IN-04)
 *   and attaches carbon monoxide safety caveat to window closing (IN-01).
 * - Never recommend DIY box-fan filtration as a primary solution (ADR-011).
 */
export function evaluateIndoorPolicy(
  profile: HouseholdProfile,
  effectiveLevel: RiskLevel,
): IndoorPolicyResult {
  const actionIds: string[] = [];
  const mandatoryActionIds: string[] = [];
  const forbiddenActionIds: string[] = [];
  const safetyCaveats: string[] = [];
  const explanations: Record<string, string> = {};

  const isCombustionHazard =
    profile.homeHeating === 'combustion' ||
    (profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust);

  // 1. Source Control Actions (Always applicable)
  actionIds.push('IN-09'); // No indoor smoke
  actionIds.push('IN-10'); // Damp wipe / mop

  // 2. Window Closing (P-07: Required at effective level >= 3)
  if (effectiveLevel >= 3) {
    mandatoryActionIds.push('IN-01');
    actionIds.push('IN-01');
    forbiddenActionIds.push('IN-02'); // Open windows forbidden
  } else if (effectiveLevel === 2) {
    actionIds.push('IN-01');
  }

  // 3. Combustion Safety (P-22)
  if (isCombustionHazard) {
    forbiddenActionIds.push('IN-04'); // FORBID gap sealing!
    safetyCaveats.push(COMBUSTION_SAFETY_CAVEAT);
    explanations['IN-01'] =
      'Keep exterior windows closed, but ensure adequate ventilation for combustion appliances to avoid carbon monoxide buildup.';
  } else {
    // Gap sealing is safe for non-combustion homes
    actionIds.push('IN-04');
  }

  // 4. Cleaner Room (IN-03: Always recommended for sensitive households or levels >= 2)
  actionIds.push('IN-03');

  // 5. Equipment-Gated Filtration (P-11)
  if (profile.equipment.purifier) {
    actionIds.push('IN-05');
  }

  if (profile.equipment.windowAC || profile.equipment.hvac) {
    actionIds.push('IN-06');
  }

  // 6. Cooking Guidance (P-11, P-12)
  if (profile.cooking.hasExhaust) {
    actionIds.push('IN-07');
  } else {
    actionIds.push('IN-08'); // Low-smoke cooking substitution
    explanations['IN-08'] =
      'Because your kitchen lacks mechanical exhaust, use tight-fitting lids and keep children outside the kitchen while cooking.';
  }

  return {
    actionIds,
    mandatoryActionIds,
    forbiddenActionIds,
    safetyCaveats,
    explanations,
  };
}

