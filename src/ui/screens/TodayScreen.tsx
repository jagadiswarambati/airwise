import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { LevelHero } from '../components/LevelHero';
import { RadarLine } from '../components/RadarLine';
import { ActionRow } from '../components/ActionRow';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { QuickChecksCard } from '../components/QuickChecksCard';
import { TrustSummary } from '../components/TrustSummary';
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

  // Top 3 actions with mustInclude (mandatory) first
  const plan = activePlan.headline ? activePlan : deterministicPlan;
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

  if (loading && !snapshot) {
    return (
      <div className="aw-screen aw-screen-today">
        <PageHeader
          title="Today's Clean-Air Plan"
          description={ROUTE_DESCRIPTIONS.today}
        />
        <div className="aw-today-loading-skeleton" aria-label="Loading today's clean-air plan">
          <Skeleton count={1} variant="card" />
          <div className="aw-today-grid mt-6">
            <div className="aw-today-main">
              <Skeleton count={1} variant="text" />
              <div className="mt-4">
                <Skeleton count={3} variant="rect" />
              </div>
            </div>
            <aside className="aw-today-aside">
              <Skeleton count={2} variant="card" />
            </aside>
          </div>
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
        <div className="aw-today-error-state text-center py-6">
          <Icon name="warning" size={32} className="text-warning mb-2" aria-hidden="true" />
          <h2 className="text-lg font-bold mb-2">Unable to load air data</h2>
          <p className="error-message mb-4">
            {error || 'Network or service timeout. Check your connection or retry in a few moments.'}
          </p>
          <div className="aw-btn-row justify-center">
            <button type="button" className="aw-btn aw-btn-primary" onClick={onRetry}>
              Retry forecast
            </button>
            <button
              type="button"
              className="aw-btn aw-btn-secondary"
              onClick={() => onSelectScenario('moderate')}
            >
              Use demo data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot || !radar || !deterministicPlan || !plan) return null;

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
          onToggleManualOverride={onToggleSevere || (() => { })}
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
            <div>
              {fallbackReason || "We couldn't reach the air data service. Using cautious defaults."}
            </div>
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
        <aside className="banner banner-warning" role="status" aria-label="Stale data notice">
          <Icon name="warning" size={18} aria-hidden="true" />
          <div>
            Air data is 26 hours old. Treat advice as low confidence. Walking and open-window advice is hidden.
          </div>
        </aside>
      )}

      {/* Signature LevelHero spanning full container width */}
      <LevelHero
        snapshot={snapshot}
        profile={profile}
        plan={plan}
        radar={radar}
        effectiveLevel={effectiveLevel}
        animatedSkyEnabled={settings.animatedSky}
        isFallback={isFallback}
      />

      {/* Two-Column Responsive Grid (>=1100px) / Single Column (<1100px) */}
      <div className="aw-today-grid">
        {/* Main Column */}
        <div className="aw-today-main">
          {/* Radar Sentence */}
          <RadarLine radar={radar} profile={profile} />

          <hr className="aw-divider" />

          {/* "Do these first" section */}
          <section className="aw-today-section" aria-label="Do these first">
            <div className="aw-today-section-header">
              <h2 className="aw-section-title">Do these first</h2>
              <span
                className={
                  plan.source === 'ai'
                    ? 'plan-source-badge-ai'
                    : 'plan-source-badge-standard'
                }
              >
                <Icon
                  name={plan.source === 'ai' ? 'exposure' : 'protect'}
                  size={14}
                  aria-hidden="true"
                />
                <span>{plan.source === 'ai' ? 'AI-personalised' : 'Standard plan'}</span>
              </span>
            </div>

            <div className="aw-action-rows-stack">
              {topActions.map((cand, idx) => (
                <ActionRow
                  key={cand.action.id}
                  candidate={cand}
                  rank={idx + 1}
                  onSelect={(c) => setSelectedAction(c)}
                />
              ))}
            </div>
          </section>

          <hr className="aw-divider" />

          {/* "Your day" timeline */}
          <section className="aw-today-section" aria-label="Your day timeline">
            <h2 className="aw-section-title">Your day</h2>
            <div className="aw-timeline-slots">
              {plan.timeline.map((slot) => (
                <div key={slot.slotId} className="aw-timeline-slot-group">
                  <div className="aw-timeline-slot-header">
                    <span className="aw-slot-name">{slot.slotLabel}</span>
                    <span className="aw-slot-note">{slot.note}</span>
                  </div>
                  <div className="aw-slot-actions">
                    {slot.actions.map((cand) => (
                      <ActionRow
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
        </div>

        {/* Sticky Aside Column (>=1100px) / In-order below 1100px */}
        <aside className="aw-today-aside" aria-label="Forecast trust and quick questions">
          <TrustSummary trust={trust} />

          <hr className="aw-divider" />

          <QuickChecksCard checks={quickChecks} />
        </aside>
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
