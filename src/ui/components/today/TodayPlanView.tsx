import {
  type ActionCandidate,
  type AirSnapshot,
  type HouseholdProfile,
  type Plan,
  type RiskLevel,
  type RiskRadarResult,
} from '../../../domain/types';
import { type QuickCheckResult } from '../../../domain/quickchecks';
import { type ScenarioType } from '../../../data/fallback-chain';
import { type AirWiseSettings } from '../../../state/settingsStore';
import { buildTrustModel } from '../../../data/trust';
import { ROUTE_DESCRIPTIONS } from '../../../state/route';
import { PageHeader } from '../../shell/PageHeader';
import { LevelHero } from '../LevelHero';
import { ActionDetailModal } from '../ActionDetailModal';
import { TodayBanners } from './TodayBanners';
import { TodayContentGrid } from './TodayContentGrid';

export interface TodayPlanViewProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
  plan: Plan;
  topActions: ActionCandidate[];
  radar: RiskRadarResult;
  effectiveLevel: RiskLevel;
  quickChecks?: QuickCheckResult[];
  settings: AirWiseSettings;
  announcement: string;
  sourceTier: 'live' | 'cached' | 'sample';
  isFallback: boolean;
  fallbackReason?: string;
  onSelectScenario: (s: ScenarioType) => void;
  selectedAction: ActionCandidate | null;
  onSelectAction: (c: ActionCandidate | null) => void;
}

export function TodayPlanView({
  profile,
  snapshot,
  plan,
  topActions,
  radar,
  effectiveLevel,
  quickChecks,
  settings,
  announcement,
  sourceTier,
  isFallback,
  fallbackReason,
  onSelectScenario,
  selectedAction,
  onSelectAction,
}: TodayPlanViewProps) {
  const trust = buildTrustModel(
    snapshot,
    plan.planConfidence,
    plan.confidenceReason,
    sourceTier,
    isFallback,
    fallbackReason,
    plan.source === 'ai'
      ? 'AI-personalised plan (constrained Gemini overlay)'
      : 'Standard deterministic plan (rule-based)',
  );

  return (
    <div className="aw-screen aw-screen-today">
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <PageHeader
        title="Today's Clean-Air Plan"
        description={ROUTE_DESCRIPTIONS.today}
        isLowCostMode={plan.flags.lowCostMode}
      />

      <TodayBanners
        isFallback={isFallback}
        fallbackReason={fallbackReason}
        snapshot={snapshot}
        onSelectScenario={onSelectScenario}
      />

      <LevelHero
        snapshot={snapshot}
        profile={profile}
        plan={plan}
        radar={radar}
        effectiveLevel={effectiveLevel}
        animatedSkyEnabled={settings.animatedSky}
        isFallback={isFallback}
      />

      <TodayContentGrid
        radar={radar}
        profile={profile}
        plan={plan}
        topActions={topActions}
        trust={trust}
        quickChecks={quickChecks}
        onSelectAction={onSelectAction}
      />

      {selectedAction && (
        <ActionDetailModal candidate={selectedAction} onClose={() => onSelectAction(null)} />
      )}
    </div>
  );
}
