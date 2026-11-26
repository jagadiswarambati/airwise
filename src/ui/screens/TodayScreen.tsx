import React, { useState, useEffect } from 'react';
import {
  type ActionCandidate,
  type AirSnapshot,
  type HouseholdProfile,
} from '../../domain/types';
import { type ScenarioType } from '../../data/fallback-chain';
import { TodayLoadingView, TodayErrorView } from '../components/today/TodayLoadingState';
import { useTodayPlanModel } from '../components/today/useTodayPlanModel';
import { TodaySevereScreen } from '../components/today/TodayStateViews';
import { TodayPlanView } from '../components/today/TodayPlanView';

export interface TodayScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot | null;
  sourceTier: 'live' | 'cached' | 'sample' | 'none';
  isFallback: boolean;
  fallbackReason?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectScenario: (s: ScenarioType) => void;
  isManualSevere?: boolean;
  onToggleSevere?: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  profile,
  snapshot,
  sourceTier,
  isFallback,
  fallbackReason,
  loading,
  error,
  onRetry,
  onSelectScenario,
  isManualSevere = false,
  onToggleSevere,
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);
  const [dismissSevereView, setDismissSevereView] = useState<boolean>(false);

  useEffect(() => {
    setDismissSevereView(false);
  }, [snapshot]);

  const {
    effectiveLevel,
    radar,
    plan,
    topActions,
    quickChecks,
    settings,
    announcement,
    isReady,
    isSevere,
  } = useTodayPlanModel(profile, snapshot, isManualSevere);

  if (loading && !snapshot) return <TodayLoadingView />;
  if (error && !snapshot) {
    return <TodayErrorView error={error} onRetry={onRetry} onSelectScenario={onSelectScenario} />;
  }
  if (!isReady || !snapshot || !plan || !radar) return null;

  if (isSevere && !dismissSevereView) {
    return (
      <TodaySevereScreen
        snapshot={snapshot}
        plan={plan}
        isManualSevere={isManualSevere}
        onToggleSevere={onToggleSevere}
        onExit={() => setDismissSevereView(true)}
        selectedAction={selectedAction}
        onCloseAction={() => setSelectedAction(null)}
      />
    );
  }

  return (
    <TodayPlanView
      profile={profile}
      snapshot={snapshot}
      plan={plan}
      topActions={topActions}
      radar={radar}
      effectiveLevel={effectiveLevel}
      quickChecks={quickChecks}
      settings={settings}
      announcement={announcement}
      sourceTier={sourceTier}
      isFallback={isFallback}
      fallbackReason={fallbackReason}
      onSelectScenario={onSelectScenario}
      selectedAction={selectedAction}
      onSelectAction={setSelectedAction}
    />
  );
};

export default TodayScreen;
