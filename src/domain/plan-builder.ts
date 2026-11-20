import {
  ActionCandidate,
  AirSnapshot,
  HouseholdProfile,
  Plan,
  TimelineSlot,
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

/**
 * Deterministic Plan Builder:
 * Builds a complete, valid Clean-Air Plan without LLM or network dependency.
 *
 * Rules:
 * - Ranks actions by health urgency, feasibility, cost fit, and effort.
 * - Free-first ranking for free budget or low-cost mode.
 * - Precedence for top 3 (Decision A-11):
 *   1. Urgent mustInclude actions (e.g. IN-01, PE-03 at level >= 3)
 *   2. Exposure actions
 *   3. Emissions action (if a slot remains among top 3)
 * - Produces time-ordered daily timeline across 6 slots.
 * - Works offline with sample or default data.
 */
export function buildDeterministicPlan(
  profile: HouseholdProfile,
  snapshot: AirSnapshot,
  options?: PlanBuilderOptions,
): Plan {
  const targetRegion = options?.targetRegion || 'IN';
  const communityMode = options?.communityMode || false;
  const generatedAt = options?.generatedAt || new Date().toISOString();

  const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, targetRegion);
  const policyResult = evaluatePolicy(
    profile,
    snapshot,
    slots,
    communityMode,
    targetRegion,
  );

  const { effectiveLevel, approvedCandidates, mustIncludeActionIds, flags } = policyResult;

  // Sort candidates by priority score descending
  const sortedCandidates = [...approvedCandidates].sort((a, b) => b.priorityScore - a.priorityScore);

  // Select Top 3 Actions per Decision A-11
  const selectedTopActions: ActionCandidate[] = [];
  const selectedIds = new Set<string>();

  // 1. Mandatory / Urgent actions first
  for (const id of mustIncludeActionIds) {
    if (selectedTopActions.length >= 3) break;
    const candidate = sortedCandidates.find((c) => c.action.id === id);
    if (candidate && !selectedIds.has(id)) {
      selectedTopActions.push(candidate);
      selectedIds.add(id);
    }
  }

  // 2. High priority exposure reduction actions
  for (const candidate of sortedCandidates) {
    if (selectedTopActions.length >= 3) break;
    if (
      !selectedIds.has(candidate.action.id) &&
      candidate.action.impactSpec.exposure.direction === 'reduces'
    ) {
      selectedTopActions.push(candidate);
      selectedIds.add(candidate.action.id);
    }
  }

  // 3. High priority emissions reduction action (if a slot remains)
  for (const candidate of sortedCandidates) {
    if (selectedTopActions.length >= 3) break;
    if (
      !selectedIds.has(candidate.action.id) &&
      candidate.action.impactSpec.emissions.direction === 'reduces'
    ) {
      selectedTopActions.push(candidate);
      selectedIds.add(candidate.action.id);
    }
  }

  // 4. Fill remaining top 3 slots from top sorted candidates
  for (const candidate of sortedCandidates) {
    if (selectedTopActions.length >= 3) break;
    if (!selectedIds.has(candidate.action.id)) {
      selectedTopActions.push(candidate);
      selectedIds.add(candidate.action.id);
    }
  }

  // Ensure top 3 has exactly 3 IDs (fallback to generic safe actions if candidates sparse)
  while (selectedTopActions.length < 3 && sortedCandidates.length > 0) {
    for (const c of sortedCandidates) {
      if (selectedTopActions.length >= 3) break;
      if (!selectedIds.has(c.action.id)) {
        selectedTopActions.push(c);
        selectedIds.add(c.action.id);
      }
    }
    break;
  }

  const topActionIds: [string, string, string] = [
    selectedTopActions[0]?.action.id || 'IN-01',
    selectedTopActions[1]?.action.id || 'IN-03',
    selectedTopActions[2]?.action.id || 'IN-09',
  ];

  // Build Time-Ordered Timeline across 6 Slots
  const timeline: TimelineSlot[] = slots.map((slot) => {
    const slotActions: ActionCandidate[] = [];

    for (const candidate of sortedCandidates) {
      if (slotActions.length >= 3) break;

      // Assign by explicit slot mapping or category appropriateness
      let matches = false;
      if (candidate.applicableSlot === slot.id) {
        matches = true;
      } else if (slot.id === 'early-morning' && candidate.action.id === 'IN-01') {
        matches = true;
      } else if (
        (slot.id === 'commute-out' || slot.id === 'commute-back') &&
        (candidate.action.category === 'mobility' || candidate.action.id === 'PE-02')
      ) {
        matches = true;
      } else if (slot.id === 'daytime' && (candidate.action.id === 'PE-03' || candidate.action.id === 'MO-05')) {
        matches = true;
      } else if (
        slot.id === 'evening' &&
        (candidate.action.id === 'IN-07' || candidate.action.id === 'IN-08' || candidate.action.id === 'IN-10')
      ) {
        matches = true;
      } else if (slot.id === 'night' && (candidate.action.id === 'IN-03' || candidate.action.id === 'IN-05')) {
        matches = true;
      }

      if (matches && !slotActions.some((sa) => sa.action.id === candidate.action.id)) {
        slotActions.push(candidate);
      }
    }

    // If slot has no actions, provide one safe baseline indoor action
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

  // Explanations dictionary
  const explanations: Record<string, string> = {};
  for (const candidate of sortedCandidates) {
    const template = ACTION_TEMPLATES[candidate.action.id];
    explanations[candidate.action.id] = template?.shortWhy || candidate.action.title;
  }

  // Plan confidence calculation
  const planConfidence =
    flags.staleData || flags.noData
      ? 'low'
      : snapshot.source.dataType === 'observed'
        ? 'high'
        : 'medium';

  const confidenceReason = getConfidenceExplanation(
    planConfidence,
    snapshot.freshness,
    snapshot.source.dataType,
  );

  const headline = getLevelHeadline(effectiveLevel);

  const assumptions = [
    'Recommendations assume standard household routine and local hourly forecast trends.',
    'Protective actions reduce personal exposure; emissions actions reduce motor vehicle travel.',
  ];

  return {
    source: 'deterministic',
    generatedAt,
    headline,
    topActionIds,
    topActions: selectedTopActions,
    timeline,
    explanations,
    planConfidence,
    confidenceReason,
    assumptions,
    flags: {
      severeMode: flags.severeMode,
      lowCostMode: flags.lowCostMode,
      fallbackPlan: flags.noData,
    },
  };
}
