import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-13: Pediatric Respirator Safety Gating.
 * Respirator purchase / wear (PE-02) is strictly forbidden if the household consists
 * exclusively of children under 5 (suffocation/choking hazard) or if effective risk level < 2.
 */
export function ruleRespirator(ctx: PolicyRuleContext): PolicyRuleResult {
  const allUnder5 = ctx.profile.members.every((m) => m.ageGroup === 'u5');
  if (allUnder5 || ctx.effectiveLevel < 2) {
    return {
      forbiddenActionIds: ['PE-02'],
    };
  }

  return {};
}
