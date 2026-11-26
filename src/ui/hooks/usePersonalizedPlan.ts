import { useState, useEffect, useRef, useMemo } from 'react';
import { type AirSnapshot, type HouseholdProfile, type Plan, type TimeSlot } from '../../domain/types';
import { type PolicyEvaluationResult } from '../../domain/policy';
import { getPersonalizedPlan } from '../../ai/client';

export interface UsePersonalizedPlanResult {
  plan: Plan | null;
  isAiPersonalized: boolean;
  isSwapping: boolean;
}

/**
 * Hook to asynchronously request and swap in an AI-personalized plan overlay.
 *
 * Rules:
 * - Always provides the deterministic basePlan immediately (never blocks initial render).
 * - Only requests AI overlay if enabled (settingsStore aiEnabled).
 * - Enforces an 8-second client abort timeout.
 * - Client acts as safety authority: invalid responses fall back silently to basePlan.
 * - Clean teardown on unmount or input change.
 * - When basePlan is null, does nothing and sets no state.
 */
export function usePersonalizedPlan(
  basePlan: Plan | null,
  snapshot: AirSnapshot | null,
  profile: HouseholdProfile | null,
  slots: TimeSlot[],
  policyResult: PolicyEvaluationResult | null,
  enabled: boolean,
): UsePersonalizedPlanResult {
  const [activePlan, setActivePlan] = useState<Plan | null>(basePlan);
  const [isAiPersonalized, setIsAiPersonalized] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  // Keep ref to latest basePlan to ensure immediate fallback on dependency change
  const basePlanRef = useRef<Plan | null>(basePlan);
  basePlanRef.current = basePlan;

  useEffect(() => {
    // If basePlan is null, do nothing and set no state
    if (!basePlan) {
      return;
    }

    // Helper to skip updates when the new value is identical
    const updateActivePlan = (next: Plan | null) => {
      setActivePlan((prev) => (prev === next ? prev : next));
    };

    // If AI is disabled or required data is missing, immediately reset to basePlan
    if (!enabled || !snapshot || !profile || !policyResult) {
      updateActivePlan(basePlan);
      setIsAiPersonalized(false);
      setIsSwapping(false);
      return;
    }

    // Set basePlan immediately first
    updateActivePlan(basePlan);
    setIsAiPersonalized(false);
    setIsSwapping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    let isMounted = true;

    getPersonalizedPlan(
      basePlan,
      snapshot,
      profile,
      slots,
      policyResult,
      controller.signal,
    )
      .then((result) => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        setIsSwapping(false);
        updateActivePlan(result.plan);
        setIsAiPersonalized(result.isAIPersonalized);
      })
      .catch(() => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        setIsSwapping(false);
        updateActivePlan(basePlanRef.current);
        setIsAiPersonalized(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [basePlan, snapshot, profile, slots, policyResult, enabled]);

  return useMemo(
    () => ({
      plan: activePlan,
      isAiPersonalized,
      isSwapping,
    }),
    [activePlan, isAiPersonalized, isSwapping],
  );
}
