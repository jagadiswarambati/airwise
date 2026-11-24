import {
  type Action,
  type ActionCandidate,
  type AirSnapshot,
  type BudgetTier,
  type HouseholdProfile,
  type RiskLevel,
  type SlotId,
} from '../types';
import { ACTION_TEMPLATES, COMBUSTION_SAFETY_CAVEAT } from '../templates';
import { buildImpactStatement } from '../impact';

export function computeHealthUrgency(
  action: Action,
  effectiveLevel: RiskLevel,
  isMandatory: boolean,
  isUrgent: boolean,
  hasSensitive: boolean,
): number {
  if (isUrgent) return 5;
  if (isMandatory) return 4;
  if (action.category === 'indoor' && effectiveLevel >= 3) return 4;
  if (action.category === 'personal' && hasSensitive) return 3;
  if (effectiveLevel >= 2) return 2;
  return 1;
}

export function computeFeasibility(effort: number): number {
  if (effort === 3) return 1;
  if (effort === 2) return 2;
  return 3;
}

export function computeCostFit(cost: string, budgetTier: BudgetTier): number {
  if (cost === 'high') {
    return budgetTier === 'flexible' ? 2 : 1;
  }
  if (cost === 'medium') {
    return budgetTier === 'flexible' ? 3 : 2;
  }
  if (cost === 'low') {
    return budgetTier === 'free' ? 1 : 3;
  }
  return 3;
}

export function computePriorityScore(
  healthUrgency: number,
  feasibility: number,
  costFit: number,
  lowCostMode: boolean,
  cost: string,
): number {
  let score = healthUrgency * 10 + feasibility * 3 + costFit * 2;
  if (lowCostMode && cost === 'free') {
    score += 15;
  }
  return score;
}

export function resolveApplicableSlot(actionId: string): SlotId | undefined {
  if (actionId === 'MO-01' || actionId === 'MO-02' || actionId === 'MO-03') {
    return 'commute-out';
  }
  if (actionId === 'IN-07' || actionId === 'IN-08') {
    return 'evening';
  }
  if (actionId === 'PE-03') {
    return 'daytime';
  }
  return undefined;
}

export function resolveFixedDisclaimers(actionId: string, profile: HouseholdProfile): string[] {
  const template = ACTION_TEMPLATES[actionId];
  const disclaimers: string[] = [];
  if (template?.fixedDisclaimer) {
    disclaimers.push(template.fixedDisclaimer);
  }
  const isCombustionHeating = profile.homeHeating === 'combustion';
  const isUnventedBiomass = profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust;
  if (actionId === 'IN-01' && (isCombustionHeating || isUnventedBiomass)) {
    disclaimers.push(COMBUSTION_SAFETY_CAVEAT);
  }
  return disclaimers;
}

function resolveCostTag(cost: string): string {
  if (cost === 'free') return 'Free';
  if (cost === 'low') return 'Low Cost';
  return 'Medium Cost';
}

export function buildCandidate(
  action: Action,
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
  hasSensitive: boolean,
  lowCostMode: boolean,
  isMandatory: boolean,
  isUrgent: boolean,
  commuteForecastDiffUgm3?: number,
): ActionCandidate {
  const impact = buildImpactStatement(action, profile, snapshot, {
    commuteForecastDiffUgm3,
  });

  const healthUrgency = computeHealthUrgency(
    action,
    effectiveLevel,
    isMandatory,
    isUrgent,
    hasSensitive,
  );
  const feasibility = computeFeasibility(action.effort);
  const costFit = computeCostFit(action.cost, profile.budget);
  const priorityScore = computePriorityScore(
    healthUrgency,
    feasibility,
    costFit,
    lowCostMode,
    action.cost,
  );

  return {
    action,
    impact,
    healthUrgency,
    feasibility,
    costFit,
    priorityScore,
    tags: {
      health: healthUrgency >= 4 ? 'High Urgency' : 'Standard',
      urgency: isUrgent ? 'Urgent' : 'Routine',
      cost: resolveCostTag(action.cost),
      effort: action.effort === 1 ? 'Quick' : 'Moderate Effort',
    },
    applicableSlot: resolveApplicableSlot(action.id),
    isMandatory,
    fixedDisclaimers: resolveFixedDisclaimers(action.id, profile),
  };
}
