import {
  type ActionCandidate,
  type AirSnapshot,
  type Confidence,
  type HouseholdProfile,
  type Plan,
  type TimelineSlot,
  type TimeSlot,
} from './types';
import { deriveTimeSlots } from './radar';
import { evaluatePolicy } from './policy';
import { getLevelHeadline } from './levels';
import { ACTION_TEMPLATES } from './templates';
import { getConfidenceExplanation } from './confidence';

export interface PlanBuilderOptions {
  communityMode?: boolean;
  targetRegion?: 'IN' | 'US';
  generatedAt?: string;
}

const DAYTIME_IDS = new Set(['PE-03', 'MO-05', 'IN-06']);
const EVENING_IDS = new Set(['IN-07', 'IN-08', 'IN-10']);
const NIGHT_IDS = new Set(['IN-03', 'IN-05', 'IN-06']);

function selectTop3Actions(
  sortedCandidates: ActionCandidate[],
  mustIncludeActionIds: string[],
): ActionCandidate[] {
  const selected: ActionCandidate[] = [];
  const selectedIds = new Set<string>();

  const addIfSlotAvailable = (candidate: ActionCandidate | undefined) => {
    if (candidate && !selectedIds.has(candidate.action.id) && selected.length < 3) {
      selected.push(candidate);
      selectedIds.add(candidate.action.id);
    }
  };

  for (const id of mustIncludeActionIds) {
    addIfSlotAvailable(sortedCandidates.find((c) => c.action.id === id));
  }

  for (const candidate of sortedCandidates) {
    if (candidate.action.impactSpec.exposure.direction === 'reduces') {
      addIfSlotAvailable(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (candidate.action.impactSpec.emissions.direction === 'reduces') {
      addIfSlotAvailable(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    addIfSlotAvailable(candidate);
  }

  return selected;
}

function matchCandidateToSlot(candidate: ActionCandidate, slotId: string): boolean {
  if (candidate.applicableSlot === slotId) return true;
  const { id, category } = candidate.action;

  switch (slotId) {
    case 'early-morning':
      return id === 'IN-01';
    case 'commute-out':
    case 'commute-back':
      return category === 'mobility' || id === 'PE-02';
    case 'daytime':
      return DAYTIME_IDS.has(id);
    case 'evening':
      return EVENING_IDS.has(id);
    case 'night':
      return NIGHT_IDS.has(id);
    default:
      return false;
  }
}

function buildTimeline(slots: TimeSlot[], sortedCandidates: ActionCandidate[]): TimelineSlot[] {
  return slots.map((slot) => {
    const slotActions: ActionCandidate[] = [];

    for (const candidate of sortedCandidates) {
      if (slotActions.length >= 3) break;
      if (
        matchCandidateToSlot(candidate, slot.id) &&
        !slotActions.some((sa) => sa.action.id === candidate.action.id)
      ) {
        slotActions.push(candidate);
      }
    }

    if (slotActions.length === 0 && sortedCandidates.length > 0) {
      slotActions.push(sortedCandidates[0]);
    }

    return {
      slotId: slot.id,
      slotLabel: slot.label,
      actionIds: slotActions.map((a) => a.action.id),
      actions: slotActions,
      note: `${slot.label} (${slot.startTime}–${slot.endTime})`,
    };
  });
}

function resolvePlanConfidence(
  staleOrNoData: boolean,
  dataType: string,
): Confidence {
  if (staleOrNoData) return 'low';
  if (dataType === 'observed') return 'high';
  return 'medium';
}

function resolveTopActionIds(topActions: ActionCandidate[]): [string, string, string] {
  return [
    topActions[0]?.action.id || 'IN-01',
    topActions[1]?.action.id || 'IN-03',
    topActions[2]?.action.id || 'IN-09',
  ];
}

function buildExplanations(candidates: ActionCandidate[]): Record<string, string> {
  const explanations: Record<string, string> = {};
  for (const candidate of candidates) {
    const template = ACTION_TEMPLATES[candidate.action.id];
    explanations[candidate.action.id] = template?.shortWhy || candidate.action.title;
  }
  return explanations;
}

function resolveGeneratedAt(options?: PlanBuilderOptions, snapshot?: AirSnapshot): string {
  if (options?.generatedAt) return options.generatedAt;
  if (snapshot?.fetchedAt) return snapshot.fetchedAt;
  return snapshot?.observedAt || '';
}

/**
 * Deterministic Plan Builder:
 * Builds a complete, valid Clean-Air Plan without LLM or network dependency.
 */
export function buildDeterministicPlan(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  options?: PlanBuilderOptions,
): Plan {
  const targetRegion = options?.targetRegion ?? 'IN';
  const communityMode = options?.communityMode ?? false;
  const generatedAt = resolveGeneratedAt(options, snapshot);

  const slots = deriveTimeSlots(
    profile,
    snapshot.pm25.hourly,
    targetRegion,
    snapshot.utcOffsetSeconds,
  );
  const policyResult = evaluatePolicy(
    profile,
    snapshot,
    slots,
    communityMode,
    targetRegion,
    generatedAt,
  );

  const { effectiveLevel, approvedCandidates, mustIncludeActionIds, flags } = policyResult;
  const sortedCandidates = [...approvedCandidates].sort(
    (a, b) => b.priorityScore - a.priorityScore,
  );

  const selectedTopActions = selectTop3Actions(sortedCandidates, mustIncludeActionIds);
  const topActionIds = resolveTopActionIds(selectedTopActions);
  const timeline = buildTimeline(slots, sortedCandidates);
  const explanations = buildExplanations(sortedCandidates);

  const planConfidence = resolvePlanConfidence(
    flags.staleData || flags.noData,
    snapshot.source.dataType,
  );

  return {
    source: 'deterministic',
    generatedAt,
    headline: getLevelHeadline(effectiveLevel),
    topActionIds,
    topActions: selectedTopActions,
    timeline,
    explanations,
    planConfidence,
    confidenceReason: getConfidenceExplanation(
      planConfidence,
      snapshot.freshness,
      snapshot.source.dataType,
    ),
    assumptions: [
      'Recommendations assume standard household routine and local hourly forecast trends.',
      'Protective actions reduce personal exposure; emissions actions reduce motor vehicle travel.',
    ],
    flags: {
      severeMode: flags.severeMode,
      lowCostMode: flags.lowCostMode,
      fallbackPlan: flags.noData,
    },
  };
}
