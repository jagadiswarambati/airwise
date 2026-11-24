import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-07: High Pollution Window Sealing.
 * When effective risk level is >= 3 (Protect / Severe), opening windows
 * (IN-02) is strictly forbidden and keeping windows closed (IN-01) is mandatory and urgent.
 */
export function ruleVentilationLevel(ctx: PolicyRuleContext): PolicyRuleResult {
  if (ctx.effectiveLevel < 3) {
    return {};
  }

  return {
    forbiddenActionIds: ['IN-02'],
    mustIncludeActionIds: ['IN-01'],
    urgentActionIds: ['IN-01'],
  };
}
