import React, { useState, useEffect, useRef } from 'react';
import {
  ActionCandidate,
  AirSnapshot,
  HouseholdProfile,
  Plan,
} from '../../domain/types';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { buildTrustModel, TrustModel } from '../../data/trust';
import { ScenarioType } from '../../data/fallback-chain';
import { useSettings } from '../../state/settingsStore';
import { usePersonalizedPlan } from '../hooks/usePersonalizedPlan';
import { ROUTE_DESCRIPTIONS } from '../../state/route';

import { PageHeader } from '../shell/PageHeader';
import { AirBriefingCard } from '../components/AirBriefingCard';
import { RiskRadarCard } from '../components/RiskRadarCard';
import { ActionCard } from '../components/ActionCard';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { QuickChecksCard } from '../components/QuickChecksCard';
import { TrustPanel } from '../components/TrustPanel';
import { SevereSmogView } from '../components/SevereSmogView';
import { Skeleton } from '../components/Skeleton';
import { Icon } from '../icons';

export interface TodayScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot | null;
  sourceTier: 'live' | 'cached' | 'sample';
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
  const [settings] = useSettings();
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);
  const [dismissSevereView, setDismissSevereView] = useState<boolean>(false);

  // Polite announcement on AI plan swap-in
  const [announcement, setAnnouncement] = useState<string>('');
  const prevAiPersonalizedRef = useRef<boolean>(false);

  // Reset dismissed severe view when snapshot changes
  useEffect(() => {
    setDismissSevereView(false);
  }, [snapshot]);

  // Unified useDailyPlan hook
  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const {
    effectiveLevel,
    slots,
    radar,
    policyResult,
    plan: deterministicPlan,
    quickChecks,
  } = useDailyPlan(profile, snapshot, targetRegion, false);

  // Asynchronous AI Plan Overlay Swap-in
  const { plan: activePlan, isAiPersonalized } = usePersonalizedPlan(
    deterministicPlan || ({} as Plan),
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

  if (loading && !snapshot) {
    return (
      <div className="aw-screen aw-screen-today">
        <PageHeader
          title="Today's Clean-Air Plan"
          description={ROUTE_DESCRIPTIONS.today}
        />
        <div className="center-panel py-8">
          <Skeleton count={3} variant="card" />
        </div>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="aw-screen aw-screen-today">
        <PageHeader
          title="Today's Clean-Air Plan"
          description={ROUTE_DESCRIPTIONS.today}
        />
        <div className="card text-center py-6">
          <h2 className="text-lg font-bold mb-2">Unable to load air data</h2>
          <p className="error-message mb-4">{error}</p>
          <button type="button" className="aw-btn aw-btn-primary" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot || !radar || !deterministicPlan) return null;

  const plan = activePlan.headline ? activePlan : deterministicPlan;

  const trust: TrustModel = buildTrustModel(
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

  // Severe Smog Mode Active Trigger (P-01 or manual override)
  const isSevere = effectiveLevel === 4 || isManualSevere || Boolean(snapshot.officialAlert?.active);

  if (isSevere && !dismissSevereView) {
    return (
      <div className="aw-screen aw-screen-severe">
        <SevereSmogView
          snapshot={snapshot}
          plan={plan}
          onExitSevereView={() => setDismissSevereView(true)}
          isManualOverride={isManualSevere}
          onToggleManualOverride={onToggleSevere || (() => {})}
        />
        {selectedAction && (
          <ActionDetailModal
            candidate={selectedAction}
            onClose={() => setSelectedAction(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="aw-screen aw-screen-today">
      {/* Politely announced live region on plan swap-in */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <PageHeader
        title="Today's Clean-Air Plan"
        description={ROUTE_DESCRIPTIONS.today}
        isLowCostMode={plan.flags.lowCostMode}
      />

      {/* Offline / Fallback Notice */}
      {isFallback && (
        <aside className="banner banner-offline" role="status" aria-label="Fallback mode notice">
          <Icon name="info" size={18} aria-hidden="true" />
          <div>
            <div>{fallbackReason || "We couldn't reach the air data service. Using cautious defaults."}</div>
            <button
              type="button"
              className="aw-btn aw-btn-secondary mt-1 text-xs"
              onClick={() => onSelectScenario('moderate')}
            >
              Use demo data
            </button>
          </div>
        </aside>
      )}

      {/* Stale Data Warning Banner (Rule P-03) */}
      {(snapshot.freshness === 'stale' || snapshot.freshness === 'none') && (
        <aside className="banner banner-warning" role="alert" aria-label="Stale data warning">
          <Icon name="warning" size={18} aria-hidden="true" />
          <div>
            <strong>Stale / Unverified Air Data:</strong> Outdoor recommendations (ventilation and
            walking) are cautiously suppressed.
          </div>
        </aside>
      )}

      {/* Air Briefing Card */}
      <AirBriefingCard snapshot={snapshot} effectiveLevel={effectiveLevel} />

      {/* Household Risk Headline */}
      <section
        className={`card card-risk-level-${effectiveLevel}`}
        aria-label="Household Risk Headline"
      >
        <div className="risk-headline-text">
          {plan.headline}
        </div>
      </section>

      {/* Household Risk Radar */}
      <RiskRadarCard radar={radar} />

      {/* Top 3 Actions */}
      <section aria-label="Today's Top 3 Actions">
        <div className="section-title-row">
          <h2 className="section-heading">Today's Top Actions</h2>
          <span
            className={plan.source === 'ai' ? 'plan-source-badge-ai' : 'plan-source-badge-standard'}
          >
            <Icon name={plan.source === 'ai' ? 'exposure' : 'protect'} size={14} aria-hidden="true" />
            <span>{plan.source === 'ai' ? 'AI-personalised' : 'Standard plan'}</span>
          </span>
        </div>

        <div className="actions-stack">
          {plan.topActions.map((cand) => (
            <ActionCard
              key={cand.action.id}
              candidate={cand}
              onSelect={(c) => setSelectedAction(c)}
            />
          ))}
        </div>
      </section>

      {/* 6-Slot Daily Timeline */}
      <section aria-label="Daily Clean-Air Timeline">
        <h2 className="section-heading mb-3">
          Daily Clean-Air Timeline
        </h2>

        <div className="timeline-list">
          {plan.timeline.map((slot) => (
            <div key={slot.slotId} className="timeline-slot">
              <div className="slot-header">
                <span className="slot-title">{slot.slotLabel}</span>
                <span className="slot-time">{slot.note}</span>
              </div>

              <div className="timeline-slot-actions">
                {slot.actions.map((cand) => (
                  <ActionCard
                    key={cand.action.id}
                    candidate={cand}
                    onSelect={(c) => setSelectedAction(c)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Checks */}
      <QuickChecksCard checks={quickChecks} />

      {/* Trust Panel */}
      <div id="trust-panel">
        <TrustPanel trust={trust} />
      </div>

      {/* Action Detail Modal Sheet */}
      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
};

export default TodayScreen;
