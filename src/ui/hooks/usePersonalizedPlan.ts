import { useState, useEffect, useRef } from 'react';
import { type AirSnapshot, type HouseholdProfile, type Plan, type TimeSlot } from '../../domain/types';
import { type PolicyEvaluationResult } from '../../domain/policy';
import { getPersonalizedPlan } from '../../ai/client';

export interface UsePersonalizedPlanResult {
  plan: Plan;
  isAiPersonalized: boolean;
  statusMessage?: string;
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
 */
export function usePersonalizedPlan(
  basePlan: Plan,
  snapshot: AirSnapshot | null,
  profile: HouseholdProfile | null,
  slots: TimeSlot[],
  policyResult: PolicyEvaluationResult | null,
  enabled: boolean,
): UsePersonalizedPlanResult {
  const [activePlan, setActivePlan] = useState<Plan>(basePlan);
  const [isAiPersonalized, setIsAiPersonalized] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  // Keep ref to latest basePlan to ensure immediate fallback on dependency change
  const basePlanRef = useRef(basePlan);
  basePlanRef.current = basePlan;

  useEffect(() => {
    // If AI is disabled or required data is missing, immediately reset to basePlan
    if (!enabled || !snapshot || !profile || !policyResult) {
      setActivePlan(basePlan);
      setIsAiPersonalized(false);
      setStatusMessage(undefined);
      setIsSwapping(false);
      return;
    }

    // Set basePlan immediately first
    setActivePlan(basePlan);
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
        setActivePlan(result.plan);
        setIsAiPersonalized(result.isAIPersonalized);
        setStatusMessage(result.statusMessage);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        setIsSwapping(false);
        setActivePlan(basePlanRef.current);
        setIsAiPersonalized(false);
        setStatusMessage(err instanceof Error ? err.message : 'Plan personalization failed');
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [basePlan, snapshot, profile, slots, policyResult, enabled]);

  return {
    plan: activePlan,
    isAiPersonalized,
    statusMessage,
    isSwapping,
  };
}
