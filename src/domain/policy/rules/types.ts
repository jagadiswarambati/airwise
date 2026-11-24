import {
  type HouseholdProfile,
  type AirSnapshot,
  type RiskLevel,
  type TimeSlot,
} from '../../types';

export interface PolicyRuleContext {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
  slots: TimeSlot[];
  communityMode: boolean;
  baseLevel: RiskLevel;
  effectiveLevel: RiskLevel;
  hasSensitive: boolean;
  severeMode: boolean;
  lowCostMode: boolean;
  staleData: boolean;
  noData: boolean;
  budgetTier: HouseholdProfile['budget'];
  currentTime?: Date | string;
}

export interface PolicyRuleResult {
  forbiddenActionIds?: string[];
  mustIncludeActionIds?: string[];
  urgentActionIds?: string[];
}

export type PolicyRuleFunction = (ctx: PolicyRuleContext) => PolicyRuleResult;
