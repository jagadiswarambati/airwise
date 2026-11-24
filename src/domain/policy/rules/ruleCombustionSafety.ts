import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-22: Combustion Heating & Unvented Fuel Safety.
 * In homes with combustion heating or unvented biomass cooking, sealing gaps
 * or draughts (IN-04) is strictly forbidden due to carbon monoxide poisoning hazards.
 */
export function ruleCombustionSafety(ctx: PolicyRuleContext): PolicyRuleResult {
  const isCombustionHeating = ctx.profile.homeHeating === 'combustion';
  const isUnventedBiomass =
    ctx.profile.cooking.fuel === 'biomass' && !ctx.profile.cooking.hasExhaust;

  if (isCombustionHeating || isUnventedBiomass) {
    return {
      forbiddenActionIds: ['IN-04'],
    };
  }

  return {};
}
