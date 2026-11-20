import {
  AirSnapshot,
  HouseholdProfile,
  Plan,
  TimeSlot,
  RiskLevel,
} from '../domain/types';
import { PolicyEvaluationResult } from '../domain/policy';
import { AIPlanInput } from './schema';
import { validateAIPlanOutput } from './validator';
import { buildPlanCacheKey, getCachedPlan, setCachedPlan } from './plan-cache';
import { applyAIOverlay } from './overlay';

export interface PlanPersonalizationResult {
  plan: Plan;
  isAIPersonalized: boolean;
  statusMessage?: string;
}

/**
 * Builds the set of allowable numbers derived strictly from engine facts.
 */
function deriveAllowlistedNumbers(
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
  effectiveLevel: RiskLevel
): string[] {
  const nums = new Set<string>();

  // Standard constants (PM2.5, N95, FFP2, Risk levels, age bands)
  ['0', '1', '2', '3', '4', '5', '12', '17', '18', '64', '65', '95', '2.5'].forEach((n) => nums.add(n));

  // Snapshot PM2.5 and AQI values
  if (snapshot.pm25.now !== null) {
    nums.add(Math.round(snapshot.pm25.now).toString());
  }

  for (const s of snapshot.pm25.hourly.slice(0, 24)) {
    if (s.pm25 !== null) {
      nums.add(Math.round(s.pm25).toString());
    }
    if (s.aqi !== undefined) {
      nums.add(Math.round(s.aqi).toString());
    }
  }

  // Routine clock times (e.g. "06", "00", "07", "30", "17", "22")
  const times = [
    profile.routine.wake,
    profile.routine.leave,
    profile.routine.returnHome,
    ...profile.routine.cooking,
    profile.routine.bed,
  ];

  for (const t of times) {
    const parts = t.split(':');
    parts.forEach((p) => nums.add(p));
    nums.add(parts.join(''));
  }

  // Commute distance / trips
  nums.add(Math.round(profile.travel.oneWayKm).toString());
  nums.add(profile.travel.tripsPerWeek.toString());

  // Assessment level
  nums.add(effectiveLevel.toString());

  return Array.from(nums);
}

/**
 * Prepares the minimal non-identifying AIPlanInput payload.
 */
export function prepareAIPlanInput(
  deterministicPlan: Plan,
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
  slots: TimeSlot[],
  policyResult: PolicyEvaluationResult
): AIPlanInput {
  // Determine abstract sensitivity category without medical specifics
  let sensitiveCategory: 'respiratory' | 'cardiovascular' | 'pregnancy' | 'general' | 'none' = 'none';
  const hasRespiratory = profile.members.some((m) => m.flags?.includes('asthma_copd'));
  const hasCardio = profile.members.some((m) => m.flags?.includes('heart'));
  const hasPregnancy = profile.members.some((m) => m.flags?.includes('pregnancy'));
  const hasOther = profile.members.some((m) => (m.flags?.length || 0) > 0);

  if (hasRespiratory) sensitiveCategory = 'respiratory';
  else if (hasCardio) sensitiveCategory = 'cardiovascular';
  else if (hasPregnancy) sensitiveCategory = 'pregnancy';
  else if (hasOther) sensitiveCategory = 'general';

  const candidateSummaries = policyResult.approvedCandidates.map((c) => ({
    id: c.action.id,
    title: c.action.title,
    category: c.action.category,
    costTier: c.action.cost,
    exposureImpact: `${c.impact.exposure.direction} (${c.impact.exposure.label})`,
    emissionsImpact: `${c.impact.emissions.direction} (${c.impact.emissions.label})`,
  }));

  const slotRisks = slots.map((s) => ({ slotId: s.id, level: s.forecastLevel }));

  // Radar summary
  const mostVulnerable = profile.members[0];
  const peakSlot = slots[0];

  return {
    effectiveLevel: policyResult.effectiveLevel,
    trend: snapshot.trend,
    slotRisks,
    radar: {
      vulnerableRoleLabel: mostVulnerable?.roleLabel || 'Household Member',
      peakSlotId: peakSlot?.id || 'daytime',
      peakWindowReason: 'High exposure activity window',
    },
    approvedCandidateIds: policyResult.approvedCandidates.map((c) => c.action.id),
    candidateSummaries,
    mustIncludeIds: policyResult.mustIncludeActionIds,
    forbiddenActionIds: policyResult.forbiddenActionIds,
    budgetTier: profile.budget,
    householdDescriptors: {
      sensitiveCategory,
      ageGroups: profile.members.map((m) => m.ageGroup),
      equipment: {
        purifier: profile.equipment.purifier,
        windowAC: profile.equipment.windowAC,
        hvac: profile.equipment.hvac,
        kitchenExhaust: profile.cooking.hasExhaust,
      },
      homeHeating: profile.homeHeating,
    },
    confidenceCeiling: deterministicPlan.planConfidence,
    allowlistedNumbers: deriveAllowlistedNumbers(snapshot, profile, policyResult.effectiveLevel),
  };
}

/**
 * Requests an AI plan overlay from the API, falling back safely to deterministic plan on error.
 */
export async function getPersonalizedPlan(
  deterministicPlan: Plan,
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
  slots: TimeSlot[],
  policyResult: PolicyEvaluationResult
): Promise<PlanPersonalizationResult> {
  const cacheKey = buildPlanCacheKey(profile, snapshot);
  const cached = getCachedPlan(cacheKey);

  if (cached) {
    return {
      plan: applyAIOverlay(deterministicPlan, cached),
      isAIPersonalized: true,
      statusMessage: 'Cached personalized plan active',
    };
  }

  const input = prepareAIPlanInput(deterministicPlan, snapshot, profile, slots, policyResult);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout budget

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        plan: deterministicPlan,
        isAIPersonalized: false,
        statusMessage: 'Standard plan active (API response not ok)',
      };
    }

    const data = await response.json();

    if (!data.success || !data.plan) {
      return {
        plan: deterministicPlan,
        isAIPersonalized: false,
        statusMessage: 'Standard plan active (Server fallback)',
      };
    }

    // Client-side defence in depth validation
    const validation = validateAIPlanOutput(data.plan, input);
    if (!validation.valid) {
      return {
        plan: deterministicPlan,
        isAIPersonalized: false,
        statusMessage: `Standard plan active (Client safety check: ${validation.error.code})`,
      };
    }

    setCachedPlan(cacheKey, validation.output);

    return {
      plan: applyAIOverlay(deterministicPlan, validation.output),
      isAIPersonalized: true,
      statusMessage: 'AI-personalized plan active',
    };
  } catch (_err) {
    clearTimeout(timeoutId);
    return {
      plan: deterministicPlan,
      isAIPersonalized: false,
      statusMessage: 'Standard plan active (Network or timeout)',
    };
  }
}
