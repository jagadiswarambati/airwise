import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-09 (Decision A-04): Sensitive Member Protection at Elevated Levels.
 * When a household has sensitive members and effective risk level is >= 3,
 * mandate indoor play/activity (PE-03) as urgent, and forbid walking/cycling (MO-07).
 */
export function ruleSensitivity(ctx: PolicyRuleContext): PolicyRuleResult {
  if (!ctx.hasSensitive || ctx.effectiveLevel < 3) {
    return {};
  }

  return {
    forbiddenActionIds: ['MO-07'],
    mustIncludeActionIds: ['PE-03'],
    urgentActionIds: ['PE-03'],
  };
}
