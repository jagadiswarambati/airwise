import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-10: Budget Gating.
 * Households on a 'free' budget tier must never be prescribed actions requiring
 * financial expenditure where free alternatives or low-cost purchases exist.
 * Forbids respirator purchase (PE-02), draught strips (IN-04), and transit fare (MO-02).
 */
export function ruleBudget(ctx: PolicyRuleContext): PolicyRuleResult {
  if (ctx.budgetTier !== 'free') {
    return {};
  }

  return {
    forbiddenActionIds: ['PE-02', 'IN-04', 'MO-02'],
  };
}
