import {
  ActionCandidate,
  AirSnapshot,
  HouseholdProfile,
  RiskLevel,
  SlotId,
  TimeSlot,
} from './types';
import { ACTION_CATALOG } from './catalog/actions';
import { computeBaseLevel, computeEffectiveLevel, hasSensitiveMembers } from './levels';
import { evaluateIndoorPolicy } from './indoor';
import { evaluateMobilityPolicy } from './mobility';
import { buildImpactStatement } from './impact';
import { ACTION_TEMPLATES, COMBUSTION_SAFETY_CAVEAT } from './templates';

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
): PolicyEvaluationResult {
  const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
  const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
  const hasSensitive = hasSensitiveMembers(profile.members);

  const staleData = snapshot.freshness === 'stale';
  const noData = snapshot.freshness === 'none' || snapshot.pm25.now === null;

  // Severe Smog Mode (P-01): auto if effective level 4 or active official alert
  const severeMode = effectiveLevel === 4 || Boolean(snapshot.officialAlert?.active);

  // Canonical budget tier
  const budgetTier = profile.budget;

  // Low-Cost Protection Mode (A-13): budget free OR (budget low AND no purifier)
  const lowCostMode =
    budgetTier === 'free' || (budgetTier === 'low' && !profile.equipment.purifier);

  const forbiddenSet = new Set<string>();
  const mustIncludeSet = new Set<string>();
  const urgentSet = new Set<string>();

  // Run Sub-Policies
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
  );
  mobilityPolicy.forbiddenActionIds.forEach((id) => forbiddenSet.add(id));

  // Rule P-01: Severe Mode override: outdoor exercise forbidden
  if (severeMode) {
    forbiddenSet.add('MO-07'); // Walk / cycle
    forbiddenSet.add('IN-02'); // Open windows
    mustIncludeSet.add('IN-01'); // Closed windows mandatory
    urgentSet.add('IN-01');
    if (hasSensitive) {
      mustIncludeSet.add('PE-03'); // Indoor play mandatory
      urgentSet.add('PE-03');
    }
  }

  // Rule P-03 / P-04: Stale or missing data suppresses outdoor activity and ventilation
  if (staleData || noData) {
    forbiddenSet.add('IN-02'); // No open window
    forbiddenSet.add('MO-07'); // No walking/cycling recommendations
  }

  // Rule P-07: Effective level >= 3 requires closed windows
  if (effectiveLevel >= 3) {
    forbiddenSet.add('IN-02');
    mustIncludeSet.add('IN-01');
    urgentSet.add('IN-01');
  }

  // Rule P-09 (Decision A-04): Sensitive members at effective level >= 3 require PE-03
  if (hasSensitive && effectiveLevel >= 3) {
    mustIncludeSet.add('PE-03');
    urgentSet.add('PE-03');
    forbiddenSet.add('MO-07');
  }

  // Rule P-10: Budget gating
  if (budgetTier === 'free') {
    // Exclude actions with cost >= low (unless free equivalent doesn't exist)
    forbiddenSet.add('PE-02'); // Respirator purchase
    forbiddenSet.add('IN-04'); // Draught strip purchase (towels are free alternative)
    forbiddenSet.add('MO-02'); // Public transit fare
  } else if (budgetTier === 'low') {
    // Exclude medium / high cost items
  }

  // Rule P-11: Equipment gating
  if (!profile.equipment.purifier) {
    forbiddenSet.add('IN-05');
  }
  if (!profile.equipment.windowAC && !profile.equipment.hvac) {
    forbiddenSet.add('IN-06');
  }
  if (!profile.cooking.hasExhaust) {
    forbiddenSet.add('IN-07');
  }

  // Rule P-13: Respirator gating
  // If household ONLY consists of children under 5, forbid PE-02 (choking/suffocation risk)
  const allUnder5 = profile.members.every((m) => m.ageGroup === 'u5');
  if (allUnder5 || effectiveLevel < 2) {
    forbiddenSet.add('PE-02');
  }

  // Rule P-17: Remote work gating
  if (!profile.travel.canWorkRemotely) {
    forbiddenSet.add('MO-05');
  }

  // Rule P-21: Community mode actions
  if (!communityMode) {
    forbiddenSet.add('CM-01');
    forbiddenSet.add('CM-02');
    forbiddenSet.add('CM-03');
    forbiddenSet.add('CM-04');
  }

  // Rule P-22: Combustion heating safety
  if (
    profile.homeHeating === 'combustion' ||
    (profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust)
  ) {
    forbiddenSet.add('IN-04'); // Never seal gaps with unvented combustion!
  }

  // Build Approved Candidate Actions
  const approvedCandidates: ActionCandidate[] = [];

  for (const action of ACTION_CATALOG) {
    if (forbiddenSet.has(action.id)) {
      continue;
    }

    // Min Level filter
    if (action.minLevel !== undefined && effectiveLevel < action.minLevel) {
      continue;
    }

    // Forbidden Levels filter
    if (action.forbiddenLevels && action.forbiddenLevels.includes(effectiveLevel)) {
      continue;
    }

    // Build Impact Statement
    const impact = buildImpactStatement(action, profile, snapshot, {
      commuteForecastDiffUgm3: mobilityPolicy.forecastDifferenceUgm3,
    });

    const isMandatory = mustIncludeSet.has(action.id);
    const isUrgent = urgentSet.has(action.id);

    // Calculate ranking factors
    // 1. Health Urgency (1..5)
    let healthUrgency = 1;
    if (isUrgent) {
      healthUrgency = 5;
    } else if (isMandatory) {
      healthUrgency = 4;
    } else if (action.category === 'indoor' && effectiveLevel >= 3) {
      healthUrgency = 4;
    } else if (action.category === 'personal' && hasSensitive) {
      healthUrgency = 3;
    } else if (effectiveLevel >= 2) {
      healthUrgency = 2;
    }

    // 2. Feasibility (1..3)
    let feasibility = 3;
    if (action.effort === 3) feasibility = 1;
    else if (action.effort === 2) feasibility = 2;

    // 3. Cost Fit (1..3)
    let costFit = 3;
    if (action.cost === 'high') {
      costFit = budgetTier === 'flexible' ? 2 : 1;
    } else if (action.cost === 'medium') {
      costFit = budgetTier === 'flexible' ? 3 : 2;
    } else if (action.cost === 'low') {
      costFit = budgetTier === 'free' ? 1 : 3;
    } else {
      costFit = 3; // Free is always best fit
    }

    // Priority Score: Free-first when lowCostMode is active
    let priorityScore = healthUrgency * 10 + feasibility * 3 + costFit * 2;
    if (lowCostMode && action.cost === 'free') {
      priorityScore += 15;
    }

    // Slot applicability
    let applicableSlot: SlotId | undefined = undefined;
    if (action.id === 'MO-01' || action.id === 'MO-02' || action.id === 'MO-03') {
      applicableSlot = 'commute-out';
    } else if (action.id === 'IN-07' || action.id === 'IN-08') {
      applicableSlot = 'evening';
    } else if (action.id === 'PE-03') {
      applicableSlot = 'daytime';
    }

    const template = ACTION_TEMPLATES[action.id];
    const fixedDisclaimers: string[] = [];
    if (template?.fixedDisclaimer) {
      fixedDisclaimers.push(template.fixedDisclaimer);
    }
    if (
      action.id === 'IN-01' &&
      (profile.homeHeating === 'combustion' ||
        (profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust))
    ) {
      fixedDisclaimers.push(COMBUSTION_SAFETY_CAVEAT);
    }

    approvedCandidates.push({
      action,
      impact,
      healthUrgency,
      feasibility,
      costFit,
      priorityScore,
      tags: {
        health: healthUrgency >= 4 ? 'High Urgency' : 'Standard',
        urgency: isUrgent ? 'Urgent' : 'Routine',
        cost: action.cost === 'free' ? 'Free' : action.cost === 'low' ? 'Low Cost' : 'Medium Cost',
        effort: action.effort === 1 ? 'Quick' : 'Moderate Effort',
      },
      applicableSlot,
      isMandatory,
      fixedDisclaimers,
    });
  }

  return {
    baseLevel,
    effectiveLevel,
    approvedCandidates,
    mustIncludeActionIds: Array.from(mustIncludeSet),
    forbiddenActionIds: Array.from(forbiddenSet),
    flags: {
      severeMode,
      lowCostMode,
      staleData,
      noData,
    },
  };
}
