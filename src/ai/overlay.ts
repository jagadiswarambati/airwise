import { type Plan, type ActionCandidate, type TimelineSlot } from '../domain/types';
import { type AIPlanOutput } from './schema';

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
    const found = candidateMap.get(id);
    if (found) {
      newTopActions.push(found);
    }
  }

  // Fallback to base top actions if any missing
  const finalTopActions = newTopActions.length === 3 ? newTopActions : basePlan.topActions;

  // Re-order and annotate timeline slots
  const aiTimelineMap = new Map(aiOutput.timeline.map((t) => [t.slotId, t]));
  const updatedTimeline: TimelineSlot[] = basePlan.timeline.map((slot) => {
    const aiSlot = aiTimelineMap.get(slot.slotId);
    if (!aiSlot) return slot;

    const existingIds = new Set(slot.actions.map((a) => a.action.id));
    const reorderedActions = aiSlot.actionIds
      .filter((id) => existingIds.has(id))
      .map((id) => slot.actions.find((a) => a.action.id === id)!)
      .filter(Boolean);

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
    topActionIds: aiOutput.topActionIds,
    topActions: finalTopActions,
    timeline: updatedTimeline,
    explanations: mergedExplanations,
    assumptions: mergedAssumptions,
    planConfidence: aiOutput.planConfidence,
    confidenceReason: aiOutput.confidenceReason,
  };
}
