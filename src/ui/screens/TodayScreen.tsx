import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActionCandidate,
  AirSnapshot,
  HouseholdProfile,
  Plan,
} from '../../domain/types';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { getAirSnapshot } from '../../data/fallback-chain';
import { buildTrustModel, TrustModel } from '../../data/trust';
import { useScenario } from '../../state/scenarioStore';
import { useManualSevereMode } from '../../state/severeModeStore';
import { useSettings } from '../../state/settingsStore';
import { usePersonalizedPlan } from '../hooks/usePersonalizedPlan';

import { Header } from '../components/Header';
import { AirBriefingCard } from '../components/AirBriefingCard';
import { RiskRadarCard } from '../components/RiskRadarCard';
import { ActionCard } from '../components/ActionCard';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { QuickChecksCard } from '../components/QuickChecksCard';
import { TrustPanel } from '../components/TrustPanel';
import { SevereSmogView } from '../components/SevereSmogView';
import { MenuModal } from '../components/MenuModal';
import { TabBar, AppTab } from '../components/TabBar';
import { IndoorScreen } from './IndoorScreen';
import { MoveScreen } from './MoveScreen';
import { ImpactScreen } from './ImpactScreen';
import { CommunityScreen } from './CommunityScreen';
import { Icon } from '../icons';

interface TodayScreenProps {
  profile: HouseholdProfile;
  onEditProfile: () => void;
  onLoadPriya: () => void;
  onDeleteProfile: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  profile,
  onEditProfile,
  onLoadPriya,
  onDeleteProfile,
}) => {
  const { scenario, setScenario } = useScenario();
  const { isManualSevereMode, toggleSevereMode } = useManualSevereMode();
  const [settings] = useSettings();

  const [currentTab, setCurrentTab] = useState<AppTab>('today');
  const [snapshot, setSnapshot] = useState<AirSnapshot | null>(null);
  const [sourceTier, setSourceTier] = useState<'live' | 'cached' | 'sample'>('sample');
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [dismissSevereView, setDismissSevereView] = useState<boolean>(false);

  // Accessible live-region polite announcement on AI plan swap-in
  const [announcement, setAnnouncement] = useState<string>('');
  const prevAiPersonalizedRef = useRef<boolean>(false);

  // Load Air Snapshot
  const loadAir = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAirSnapshot({
        location: profile.location,
        scenario,
      });
      setSnapshot(res.snapshot);
      setSourceTier(res.sourceTier);
      setIsFallback(res.isFallback);
      setFallbackReason(res.fallbackReason);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch air data');
    } finally {
      setLoading(false);
    }
  }, [profile.location, scenario]);

  useEffect(() => {
    loadAir();
    setDismissSevereView(false);
  }, [loadAir]);

  // Domain Calculations via unified useDailyPlan hook (single source of truth)
  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const {
    baseLevel: _baseLevel,
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
      <div className="app-container center-panel">
        <p>Loading air briefing &amp; generating Clean-Air Plan...</p>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="app-container center-panel">
        <h2>Unable to load air data</h2>
        <p className="error-message">{error}</p>
        <button type="button" className="btn-primary" onClick={loadAir}>
          Retry
        </button>
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
  const isSevere = effectiveLevel === 4 || isManualSevereMode || Boolean(snapshot.officialAlert?.active);

  if (isSevere && !dismissSevereView) {
    return (
      <div className="app-container">
        <SevereSmogView
          snapshot={snapshot}
          plan={plan}
          onExitSevereView={() => setDismissSevereView(true)}
          isManualOverride={isManualSevereMode}
          onToggleManualOverride={toggleSevereMode}
        />
        <MenuModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          profile={profile}
          onLoadPriya={onLoadPriya}
          onEditProfile={onEditProfile}
          onDeleteProfile={onDeleteProfile}
          currentScenario={scenario}
          onSelectScenario={setScenario}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Politely announced live region on plan swap-in without moving focus or scrolling */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <Header
        currentScenario={scenario}
        onSelectScenario={setScenario}
        isManualSevere={isManualSevereMode}
        onToggleSevere={toggleSevereMode}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <main className="main-content">
        {/* Navigation Tab Bar */}
        <TabBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isLowCostMode={plan.flags.lowCostMode}
        />

        {/* Offline / Fallback Notice */}
        {isFallback && (
          <div className="banner banner-offline" role="status">
            <Icon name="info" size={18} aria-hidden="true" />
            <div>
              <div>{fallbackReason || "We couldn't reach the air data service. Using cautious defaults."}</div>
              <button
                type="button"
                className="btn-secondary mt-1 text-xs"
                onClick={() => setScenario('moderate')}
              >
                Use demo data
              </button>
            </div>
          </div>
        )}

        {/* Stale Data Warning Banner (Rule P-03) */}
        {(snapshot.freshness === 'stale' || snapshot.freshness === 'none') && (
          <div className="banner banner-warning" role="alert">
            <Icon name="warning" size={18} aria-hidden="true" />
            <div>
              <strong>Stale / Unverified Air Data:</strong> Outdoor recommendations (ventilation and
              walking) are cautiously suppressed.
            </div>
          </div>
        )}

        {/* Tab Content Routing */}
        {currentTab === 'indoor' && (
          <IndoorScreen profile={profile} snapshot={snapshot} />
        )}

        {currentTab === 'move' && (
          <MoveScreen profile={profile} snapshot={snapshot} />
        )}

        {currentTab === 'impact' && (
          <ImpactScreen profile={profile} snapshot={snapshot} />
        )}

        {currentTab === 'community' && (
          <CommunityScreen profile={profile} snapshot={snapshot} />
        )}

        {currentTab === 'today' && (
          <>
            {/* Air Briefing Card */}
            <AirBriefingCard snapshot={snapshot} effectiveLevel={effectiveLevel} />

            {/* Household Risk Headline */}
            <section
              className={`card card-risk-level-${effectiveLevel}`}
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
            <TrustPanel trust={trust} />
          </>
        )}
      </main>

      {/* Action Detail Modal Sheet */}
      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}

      {/* Menu / Settings Modal */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        profile={profile}
        onLoadPriya={onLoadPriya}
        onEditProfile={onEditProfile}
        onDeleteProfile={onDeleteProfile}
        currentScenario={scenario}
        onSelectScenario={setScenario}
      />
    </div>
  );
};
