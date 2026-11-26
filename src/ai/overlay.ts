import {
  type Plan,
  type ActionCandidate,
  type TimelineSlot,
  type Action,
} from '../domain/types';
import { ACTION_CATALOG } from '../domain/catalog/actions';
import { type AIPlanOutput } from './schema';

function resolveCostTag(cost: Action['cost']): 'Free' | 'Low Cost' | 'Moderate Cost' {
  if (cost === 'free') return 'Free';
  if (cost === 'low') return 'Low Cost';
  return 'Moderate Cost';
}

function resolveEffortTag(effort: number): 'Quick' | 'Moderate Effort' | 'Requires Planning' {
  if (effort <= 1) return 'Quick';
  if (effort === 2) return 'Moderate Effort';
  return 'Requires Planning';
}

function createCandidateFromCatalog(action: Action): ActionCandidate {
  return {
    action,
    impact: {
      exposure: {
        direction: action.impactSpec.exposure.direction,
        label: action.impactSpec.exposure.label,
        confidence: action.impactSpec.exposure.evidence,
        note: action.impactSpec.exposure.noteTemplate,
      },
      emissions: {
        direction: action.impactSpec.emissions.direction,
        label: action.impactSpec.emissions.label,
        confidence: action.impactSpec.emissions.evidence,
        note: action.impactSpec.emissions.noteTemplate,
      },
      assumptions: action.impactSpec.assumptions || [],
      doesNotChange: action.impactSpec.doesNotChange || 'No emissions impact.',
      explanation: action.impactSpec.exposure.noteTemplate,
    },
    healthUrgency: 2,
    feasibility: 2,
    costFit: 2,
    priorityScore: 20,
    tags: {
      health: 'Standard',
      urgency: 'Routine',
      cost: resolveCostTag(action.cost),
      effort: resolveEffortTag(action.effort),
    },
    isMandatory: false,
    fixedDisclaimers: [],
  };
}

/**
 * Merges a strictly validated AI response onto the deterministic clean-air plan.
 * Pure function: keeps all domain impact statements, formulas, and safety invariants intact.
 */
export function applyAIOverlay(basePlan: Plan, aiOutput: AIPlanOutput): Plan {
  // Find candidates for the topActionIds
  const candidateMap = new Map<string, ActionCandidate>();
  for (const c of basePlan.topActions) {
    candidateMap.set(c.action.id, c);
  }
  for (const slot of basePlan.timeline) {
    for (const c of slot.actions) {
      candidateMap.set(c.action.id, c);
    }
  }

  const newTopActions: ActionCandidate[] = [];
  for (const id of aiOutput.topActionIds) {
    let found = candidateMap.get(id);
    if (!found) {
      const catAction = ACTION_CATALOG.find((a) => a.id === id);
      if (catAction) {
        found = createCandidateFromCatalog(catAction);
      }
    }
    if (found) {
      newTopActions.push(found);
    }
  }

  // Fallback to base top actions if any missing
  const finalTopActions = newTopActions.length === 3 ? newTopActions : basePlan.topActions;
  const finalTopActionIds: [string, string, string] = [
    finalTopActions[0].action.id,
    finalTopActions[1].action.id,
    finalTopActions[2].action.id,
  ];

  // Re-order and annotate timeline slots
  const aiTimelineMap = new Map(aiOutput.timeline.map((t) => [t.slotId, t]));
  const updatedTimeline: TimelineSlot[] = basePlan.timeline.map((slot) => {
    const aiSlot = aiTimelineMap.get(slot.slotId);
    if (!aiSlot) return slot;

    const existingIds = new Set(slot.actions.map((a) => a.action.id));
    const reorderedActions: ActionCandidate[] = [];
    for (const id of aiSlot.actionIds) {
      if (existingIds.has(id)) {
        const found = slot.actions.find((a) => a.action.id === id);
        if (found) {
          reorderedActions.push(found);
        }
      }
    }

    const reorderedIds = new Set(reorderedActions.map((a) => a.action.id));
    for (const act of slot.actions) {
      if (!reorderedIds.has(act.action.id)) {
        reorderedActions.push(act);
      }
    }

    return {
      ...slot,
      actions: reorderedActions.length > 0 ? reorderedActions : slot.actions,
      note: aiSlot.note.trim().length > 0 ? aiSlot.note.trim() : slot.note,
    };
  });

  // Merge explanations
  const mergedExplanations = {
    ...basePlan.explanations,
    ...aiOutput.explanations,
  };

  // Merge assumptions
  const mergedAssumptions = Array.from(
    new Set([...basePlan.assumptions, ...aiOutput.assumptions])
  );

  return {
    ...basePlan,
    source: 'ai',
    headline: aiOutput.headline,
    topActionIds: finalTopActionIds,
    topActions: finalTopActions,
    timeline: updatedTimeline,
    explanations: mergedExplanations,
    assumptions: mergedAssumptions,
    planConfidence: aiOutput.planConfidence,
    confidenceReason: aiOutput.confidenceReason,
  };
}
