import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-21: Community Mode Gating.
 * Community-scale collective actions (CM-01 through CM-04) are only approved
 * when Community Mode is explicitly enabled by the user.
 */
export function ruleCommunity(ctx: PolicyRuleContext): PolicyRuleResult {
  if (!ctx.communityMode) {
    return {
      forbiddenActionIds: ['CM-01', 'CM-02', 'CM-03', 'CM-04'],
    };
  }

  return {};
}
