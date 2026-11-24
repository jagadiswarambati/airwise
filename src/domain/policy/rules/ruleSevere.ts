import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-01: Severe Smog Mode override.
 * Automatically active if effective risk level is 4 or an official alert is active.
 * Suppresses outdoor exercise (MO-07) and window opening (IN-02).
 * Mandates closed windows (IN-01) and indoor play (PE-03) for sensitive households.
 */
export function ruleSevere(ctx: PolicyRuleContext): PolicyRuleResult {
  if (!ctx.severeMode) {
    return {};
  }

  const forbiddenActionIds = ['MO-07', 'IN-02'];
  const mustIncludeActionIds = ['IN-01'];
  const urgentActionIds = ['IN-01'];

  if (ctx.hasSensitive) {
    mustIncludeActionIds.push('PE-03');
    urgentActionIds.push('PE-03');
  }

  return { forbiddenActionIds, mustIncludeActionIds, urgentActionIds };
}
