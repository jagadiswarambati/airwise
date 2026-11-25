import { useState, useEffect, useMemo, useRef } from 'react';
import {
  type AirSnapshot,
  type HouseholdProfile,
} from '../../../domain/types';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { usePersonalizedPlan } from '../../hooks/usePersonalizedPlan';
import { useSettings } from '../../../state/settingsStore';

export function useTodayPlanModel(
  profile: HouseholdProfile,
  snapshot: AirSnapshot | null,
  isManualSevere: boolean,
) {
  const [settings] = useSettings();
  const [announcement, setAnnouncement] = useState<string>('');
  const prevAiPersonalizedRef = useRef<boolean>(false);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const {
    effectiveLevel,
    slots,
    radar,
    policyResult,
    plan: deterministicPlan,
    quickChecks,
  } = useDailyPlan(profile, snapshot, targetRegion, false);

  const { plan: activePlan, isAiPersonalized } = usePersonalizedPlan(
    deterministicPlan,
    snapshot,
    profile,
    slots,
    policyResult,
    settings.aiEnabled,
  );

  useEffect(() => {
    if (isAiPersonalized && !prevAiPersonalizedRef.current) {
      setAnnouncement('Plan updated with personalised order');
    }
    prevAiPersonalizedRef.current = isAiPersonalized;
  }, [isAiPersonalized]);

  const plan = activePlan?.headline ? activePlan : deterministicPlan;
  const topActions = useMemo(() => {
    if (!plan || !plan.topActions) return [];
    const list = [...plan.topActions];
    list.sort((a, b) => {
      if (a.isMandatory && !b.isMandatory) return -1;
      if (!a.isMandatory && b.isMandatory) return 1;
      return 0;
    });
    return list.slice(0, 3);
  }, [plan]);

  const isReady = Boolean(snapshot && radar && deterministicPlan && plan);
  const isSevere = Boolean(
    effectiveLevel === 4 || isManualSevere || snapshot?.officialAlert?.active,
  );

  return {
    effectiveLevel,
    radar,
    deterministicPlan,
    plan,
    topActions,
    quickChecks,
    settings,
    announcement,
    isReady,
    isSevere,
  };
}
