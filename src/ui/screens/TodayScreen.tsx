import React, { useState, useEffect, useCallback } from 'react';
import {
  ActionCandidate,
  AirSnapshot,
  HouseholdProfile,
  Plan,
} from '../../domain/types';
import { computeBaseLevel, computeEffectiveLevel } from '../../domain/levels';
import { deriveTimeSlots, computeRiskRadar } from '../../domain/radar';
import { buildDeterministicPlan } from '../../domain/plan-builder';
import { evaluateQuickChecks } from '../../domain/quickchecks';
import { getAirSnapshot } from '../../data/fallback-chain';
import { buildTrustModel, TrustModel } from '../../data/trust';
import { useScenario } from '../../state/scenarioStore';
import { useManualSevereMode } from '../../state/severeModeStore';

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

  if (loading && !snapshot) {
    return (
      <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading air briefing &amp; generating Clean-Air Plan...</p>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Unable to load air data</h2>
        <p style={{ color: 'var(--level-3-text)', margin: '12px 0' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={loadAir}>
          Retry
        </button>
      </div>
    );
  }

  if (!snapshot) return null;

  // Domain Calculations
  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
  const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
  const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, targetRegion);
  const radar = computeRiskRadar(profile, snapshot, slots);
  const plan: Plan = buildDeterministicPlan(profile, snapshot, {
    targetRegion,
  });
  const quickChecks = evaluateQuickChecks(profile, snapshot, targetRegion);

  const trust: TrustModel = buildTrustModel(
    snapshot,
    plan.planConfidence,
    plan.confidenceReason,
    sourceTier,
    isFallback,
    fallbackReason,
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
        {isFallback && fallbackReason && (
          <div className="banner banner-offline" role="status">
            <span>ℹ️</span>
            <div>{fallbackReason}</div>
          </div>
        )}

        {/* Stale Data Warning Banner (Rule P-03) */}
        {(snapshot.freshness === 'stale' || snapshot.freshness === 'none') && (
          <div className="banner banner-warning" role="alert">
            <span>⚠️</span>
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

        {currentTab === 'today' && (
          <>
            {/* Air Briefing Card */}
            <AirBriefingCard snapshot={snapshot} effectiveLevel={effectiveLevel} />

            {/* Household Risk Headline */}
            <section
              className="card"
              style={{
                backgroundColor: `var(--level-${effectiveLevel}-bg)`,
                borderColor: `var(--level-${effectiveLevel}-border)`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1rem', color: `var(--level-${effectiveLevel}-text)` }}>
                {plan.headline}
              </div>
            </section>

            {/* Household Risk Radar */}
            <RiskRadarCard radar={radar} />

            {/* Top 3 Actions */}
            <section aria-label="Today's Top 3 Actions">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Today's Top Actions</h2>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: plan.source === 'ai' ? '#1a73e8' : 'var(--color-text-muted)',
                  }}
                >
                  {plan.source === 'ai' ? '✨ AI-personalised' : '🛡️ Standard plan'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
                Daily Clean-Air Timeline
              </h2>

              <div className="timeline-list">
                {plan.timeline.map((slot) => (
                  <div key={slot.slotId} className="timeline-slot">
                    <div className="slot-header">
                      <span className="slot-title">{slot.slotLabel}</span>
                      <span className="slot-time">{slot.note}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
