import { useMemo } from 'react';
import {
  AirSnapshot,
  HouseholdProfile,
  Plan,
  RiskLevel,
  RiskRadarResult,
  TimeSlot,
} from '../../domain/types';
import { PolicyEvaluationResult, evaluatePolicy } from '../../domain/policy';
import { computeBaseLevel, computeEffectiveLevel } from '../../domain/levels';
import { deriveTimeSlots, computeRiskRadar } from '../../domain/radar';
import { buildDeterministicPlan } from '../../domain/plan-builder';
import { evaluateQuickChecks, QuickCheckResult } from '../../domain/quickchecks';

export interface DailyPlanResult {
  baseLevel: RiskLevel;
  effectiveLevel: RiskLevel;
  slots: TimeSlot[];
  radar: RiskRadarResult | null;
  policyResult: PolicyEvaluationResult | null;
  plan: Plan | null;
  quickChecks: QuickCheckResult[];
}

/**
 * Unified daily plan hook — the single source of truth for all screens (Task 3).
 * Memoises domain evaluation across slots, radar, policy candidates, deterministic plan, and quick checks.
 * Screens must never invoke evaluatePolicy or buildDeterministicPlan independently.
 */
export function useDailyPlan(
  profile: HouseholdProfile,
  snapshot: AirSnapshot | null,
  targetRegion: 'IN' | 'US' = profile.location.country === 'IN' ? 'IN' : 'US',
  communityMode: boolean = false,
): DailyPlanResult {
  return useMemo(() => {
    if (!snapshot) {
      return {
        baseLevel: 0,
        effectiveLevel: 0,
        slots: [],
        radar: null,
        policyResult: null,
        plan: null,
        quickChecks: [],
      };
    }

    const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
    const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
    const slots = deriveTimeSlots(
      profile,
      snapshot.pm25.hourly,
      targetRegion,
      snapshot.utcOffsetSeconds,
    );
    const radar = computeRiskRadar(profile, snapshot, slots);
    const policyResult = evaluatePolicy(profile, snapshot, slots, communityMode, targetRegion);
    const plan = buildDeterministicPlan(profile, snapshot, {
      communityMode,
      targetRegion,
    });
    const quickChecks = evaluateQuickChecks(profile, snapshot, targetRegion);

    return {
      baseLevel,
      effectiveLevel,
      slots,
      radar,
      policyResult,
      plan,
      quickChecks,
    };
  }, [profile, snapshot, targetRegion, communityMode]);
}
