import {
  type ActionCandidate,
  type AirSnapshot,
  type HouseholdProfile,
  type RiskLevel,
  type TimeSlot,
} from './types';
import { ACTION_CATALOG } from './catalog/actions';
import { computeBaseLevel, computeEffectiveLevel, hasSensitiveMembers } from './levels';
import { evaluateIndoorPolicy } from './indoor';
import { evaluateMobilityPolicy } from './mobility';
import { buildCandidate } from './policy/candidateScoring';
import {
  type PolicyRuleContext,
  type PolicyRuleFunction,
  ruleSevere,
  ruleStaleData,
  ruleVentilationLevel,
  ruleSensitivity,
  ruleBudget,
  ruleEquipment,
  ruleRespirator,
  ruleMobilityRemote,
  ruleCommunity,
  ruleCombustionSafety,
} from './policy/rules';

export interface PolicyEvaluationResult {
  baseLevel: RiskLevel;
  effectiveLevel: RiskLevel;
  approvedCandidates: ActionCandidate[];
  mustIncludeActionIds: string[];
  forbiddenActionIds: string[];
  flags: {
    severeMode: boolean;
    lowCostMode: boolean;
    staleData: boolean;
    noData: boolean;
  };
}

export interface EvaluatePolicyOptions {
  disabledRules?: string[];
}

export const ORDERED_POLICY_RULES: Array<{ id: string; rule: PolicyRuleFunction }> = [
  { id: 'P-01', rule: ruleSevere },
  { id: 'P-03_P-04', rule: ruleStaleData },
  { id: 'P-07', rule: ruleVentilationLevel },
  { id: 'P-09', rule: ruleSensitivity },
  { id: 'P-10', rule: ruleBudget },
  { id: 'P-11', rule: ruleEquipment },
  { id: 'P-13', rule: ruleRespirator },
  { id: 'P-17', rule: ruleMobilityRemote },
  { id: 'P-21', rule: ruleCommunity },
  { id: 'P-22', rule: ruleCombustionSafety },
];

function computePolicyFlags(
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
  profile: HouseholdProfile,
): PolicyEvaluationResult['flags'] {
  const staleData = snapshot.freshness === 'stale';
  const noData = snapshot.freshness === 'none' || snapshot.pm25.now === null;
  const severeMode = effectiveLevel === 4 || Boolean(snapshot.officialAlert?.active);
  const lowCostMode =
    profile.budget === 'free' || (profile.budget === 'low' && !profile.equipment.purifier);

  return { severeMode, lowCostMode, staleData, noData };
}

function applySubPolicies(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  slots: TimeSlot[],
  effectiveLevel: RiskLevel,
  hasSensitive: boolean,
  currentTime?: Date | string,
): {
  forbiddenSet: Set<string>;
  mustIncludeSet: Set<string>;
  urgentSet: Set<string>;
  forecastDifferenceUgm3?: number;
} {
  const forbiddenSet = new Set<string>();
  const mustIncludeSet = new Set<string>();
  const urgentSet = new Set<string>();

  const indoorPolicy = evaluateIndoorPolicy(profile, effectiveLevel);
  indoorPolicy.forbiddenActionIds.forEach((id) => forbiddenSet.add(id));
  indoorPolicy.mandatoryActionIds.forEach((id) => {
    mustIncludeSet.add(id);
    urgentSet.add(id);
  });

  const mobilityPolicy = evaluateMobilityPolicy(
    profile,
    effectiveLevel,
    snapshot.freshness,
    slots,
    hasSensitive,
    snapshot.daylight,
    currentTime ?? snapshot.observedAt ?? snapshot.fetchedAt,
    snapshot.utcOffsetSeconds,
  );
  mobilityPolicy.forbiddenActionIds.forEach((id) => forbiddenSet.add(id));

  return {
    forbiddenSet,
    mustIncludeSet,
    urgentSet,
    forecastDifferenceUgm3: mobilityPolicy.forecastDifferenceUgm3,
  };
}

function applyOrderedRules(
  ruleCtx: PolicyRuleContext,
  forbiddenSet: Set<string>,
  mustIncludeSet: Set<string>,
  urgentSet: Set<string>,
  disabledRules?: string[],
): void {
  const disabled = new Set(disabledRules ?? []);
  for (const { id, rule } of ORDERED_POLICY_RULES) {
    if (disabled.has(id)) continue;
    const partial = rule(ruleCtx);
    partial.forbiddenActionIds?.forEach((aId) => forbiddenSet.add(aId));
    partial.mustIncludeActionIds?.forEach((aId) => mustIncludeSet.add(aId));
    partial.urgentActionIds?.forEach((aId) => urgentSet.add(aId));
  }
}

function filterAndBuildCandidates(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
  hasSensitive: boolean,
  lowCostMode: boolean,
  forbiddenSet: Set<string>,
  mustIncludeSet: Set<string>,
  urgentSet: Set<string>,
  commuteForecastDiffUgm3?: number,
): ActionCandidate[] {
  const candidates: ActionCandidate[] = [];

  for (const action of ACTION_CATALOG) {
    if (forbiddenSet.has(action.id)) continue;
    if (action.minLevel !== undefined && effectiveLevel < action.minLevel) continue;
    if (action.forbiddenLevels && action.forbiddenLevels.includes(effectiveLevel)) continue;

    candidates.push(
      buildCandidate(
        action,
        profile,
        snapshot,
        effectiveLevel,
        hasSensitive,
        lowCostMode,
        mustIncludeSet.has(action.id),
        urgentSet.has(action.id),
        commuteForecastDiffUgm3,
      ),
    );
  }

  return candidates;
}

/**
 * Policy Constraint Engine:
 * Enforces all policy invariants P-01 to P-22 and returns the approved candidate action set.
 */
export function evaluatePolicy(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  slots: TimeSlot[],
  communityMode: boolean = false,
  targetRegion: 'IN' | 'US' = 'IN',
  currentTime?: Date | string,
  options?: EvaluatePolicyOptions,
): PolicyEvaluationResult {
  const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
  const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
  const hasSensitive = hasSensitiveMembers(profile.members);
  const flags = computePolicyFlags(snapshot, effectiveLevel, profile);

  const { forbiddenSet, mustIncludeSet, urgentSet, forecastDifferenceUgm3 } = applySubPolicies(
    profile,
    snapshot,
    slots,
    effectiveLevel,
    hasSensitive,
    currentTime,
  );

  const ruleCtx: PolicyRuleContext = {
    profile,
    snapshot,
    slots,
    communityMode,
    baseLevel,
    effectiveLevel,
    hasSensitive,
    budgetTier: profile.budget,
    currentTime,
    ...flags,
  };

  applyOrderedRules(ruleCtx, forbiddenSet, mustIncludeSet, urgentSet, options?.disabledRules);

  const approvedCandidates = filterAndBuildCandidates(
    profile,
    snapshot,
    effectiveLevel,
    hasSensitive,
    flags.lowCostMode,
    forbiddenSet,
    mustIncludeSet,
    urgentSet,
    forecastDifferenceUgm3,
  );

  return {
    baseLevel,
    effectiveLevel,
    approvedCandidates,
    mustIncludeActionIds: Array.from(mustIncludeSet),
    forbiddenActionIds: Array.from(forbiddenSet),
    flags,
  };
}
