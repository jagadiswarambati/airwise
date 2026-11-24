import { type PolicyRuleContext, type PolicyRuleResult } from './types';

/**
 * Rule P-11: Equipment Gating.
 * Actions requiring physical household equipment are only approved if
 * the profile indicates that equipment is installed and available:
 * - Air purifier required for IN-05.
 * - Window AC or HVAC required for IN-06.
 * - Kitchen exhaust ventilation required for IN-07.
 */
export function ruleEquipment(ctx: PolicyRuleContext): PolicyRuleResult {
  const forbiddenActionIds: string[] = [];

  if (!ctx.profile.equipment.purifier) {
    forbiddenActionIds.push('IN-05');
  }
  if (!ctx.profile.equipment.windowAC && !ctx.profile.equipment.hvac) {
    forbiddenActionIds.push('IN-06');
  }
  if (!ctx.profile.cooking.hasExhaust) {
    forbiddenActionIds.push('IN-07');
  }

  return { forbiddenActionIds };
}
