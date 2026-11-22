import {
  AirSnapshot,
  HouseholdProfile,
  Plan,
  TimeSlot,
} from '../domain/types';
import { PolicyEvaluationResult } from '../domain/policy';
import { computeRiskRadar, findMostVulnerableMember } from '../domain/radar';
import { AIPlanInput } from './schema';
import { validateAIPlanOutput } from './validator';
import { buildPlanCacheKey, getCachedPlan, setCachedPlan } from './plan-cache';
import { applyAIOverlay } from './overlay';

export interface PlanPersonalizationResult {
  plan: Plan;
  isAIPersonalized: boolean;
  statusMessage?: string;
  fallback?: boolean;
}

/**
 * Prepares the minimal non-identifying AIPlanInput payload.
 * Strips all coordinates, location names, member names, exact ages, and free text.
 */
export function prepareAIPlanInput(
  deterministicPlan: Plan,
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
  slots: TimeSlot[],
  policyResult: PolicyEvaluationResult,
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

  // Compute real risk radar to identify member age band and peak exposure slot
  const radar = computeRiskRadar(profile, snapshot, slots);
  const vulnerableMember = findMostVulnerableMember(profile.members);

  const slotRisks = slots.map((s) => ({ slotId: s.id, level: s.forecastLevel }));

  const rawTimes = [
    profile.routine.wake,
    profile.routine.leave,
    profile.routine.returnHome,
    ...profile.routine.cooking,
    profile.routine.bed,
  ];
  const routineTimes = Array.from(new Set(rawTimes.filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))));

  const numericFacts = {
    pm25Now: snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now * 10) / 10 : null,
    slotMeanPm25Values: slots.map((s) => ({
      slotId: s.id,
      pm25: s.forecastMeanPm25,
    })),
    routineTimes,
  };

  return {
    effectiveLevel: policyResult.effectiveLevel,
    trend: snapshot.trend,
    slotRisks,
    radar: {
      memberBand: vulnerableMember.ageGroup,
      peakSlotId: radar.slotId,
    },
    approvedCandidateIds: policyResult.approvedCandidates.map((c) => c.action.id),
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
    numericFacts,
  };
}

/**
 * Requests an AI plan overlay from the API, falling back safely to deterministic plan on error.
 * Client is the safety authority (ADR-006): response is validated locally before applying overlay.
 */
export async function getPersonalizedPlan(
  deterministicPlan: Plan,
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
  slots: TimeSlot[],
  policyResult: PolicyEvaluationResult,
  signal?: AbortSignal,
): Promise<PlanPersonalizationResult> {
  const input = prepareAIPlanInput(deterministicPlan, snapshot, profile, slots, policyResult);
  const cacheKey = buildPlanCacheKey(input, snapshot);

  // Check client-side memory cache first
  const cached = getCachedPlan(cacheKey);
  if (cached) {
    const validCached = validateAIPlanOutput(cached, input);
    if (validCached.valid) {
      return {
        plan: applyAIOverlay(deterministicPlan, validCached.output),
        isAIPersonalized: true,
        statusMessage: 'Loaded personalized plan from cache',
      };
    }
  }

  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal,
    });

    if (!res.ok) {
      return {
        plan: deterministicPlan,
        isAIPersonalized: false,
        fallback: true,
        statusMessage: `Plan API returned HTTP ${res.status}; using deterministic plan`,
      };
    }

    const data = await res.json();
    if (!data.success || !data.plan) {
      return {
        plan: deterministicPlan,
        isAIPersonalized: false,
        fallback: true,
        statusMessage: data.message || 'AI overlay fell back to standard plan',
      };
    }

    // Client-side safety validation (safety authority ADR-006)
    const validation = validateAIPlanOutput(data.plan, input);
    if (!validation.valid) {
      return {
        plan: deterministicPlan,
        isAIPersonalized: false,
        fallback: true,
        statusMessage: `Client rejected AI plan: ${validation.error.message}`,
      };
    }

    // Cache valid response
    setCachedPlan(cacheKey, validation.output);

    return {
      plan: applyAIOverlay(deterministicPlan, validation.output),
      isAIPersonalized: true,
      statusMessage: 'AI personalization applied successfully',
    };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      plan: deterministicPlan,
      isAIPersonalized: false,
      fallback: true,
      statusMessage: isAbort
        ? 'AI personalization request timed out (8s limit); using standard plan'
        : 'Failed to contact plan service; using standard plan',
    };
  }
}
