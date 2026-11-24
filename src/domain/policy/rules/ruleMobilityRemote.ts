import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-17: Remote Work Gating.
 * Remote work recommendation (MO-05) is only permitted if the profile
 * indicates remote work is feasible for the household.
 */
export function ruleMobilityRemote(ctx: PolicyRuleContext): PolicyRuleResult {
  if (!ctx.profile.travel.canWorkRemotely) {
    return {
      forbiddenActionIds: ['MO-05'],
    };
  }

  return {};
}
