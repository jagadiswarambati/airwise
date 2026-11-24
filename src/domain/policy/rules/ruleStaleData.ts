import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rules P-03 and P-04: Stale or Missing Data Protection.
 * If air quality data is stale or unavailable, suppress outdoor exercise (MO-07)
 * and active ventilation (IN-02) as a precautionary safety measure.
 */
export function ruleStaleData(ctx: PolicyRuleContext): PolicyRuleResult {
  if (!ctx.staleData && !ctx.noData) {
    return {};
  }

  return {
    forbiddenActionIds: ['IN-02', 'MO-07'],
  };
}
