import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PRIYA_PRESET } from '../../src/state/profileStore';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { computeBaseLevel, computeEffectiveLevel } from '../../src/domain/levels';
import { deriveTimeSlots, computeRiskRadar } from '../../src/domain/radar';
import { evaluateQuickChecks } from '../../src/domain/quickchecks';
import { buildTrustModel } from '../../src/data/trust';

import { AirBriefingCard } from '../../src/ui/components/AirBriefingCard';
import { RiskRadarCard } from '../../src/ui/components/RiskRadarCard';
import { QuickChecksCard } from '../../src/ui/components/QuickChecksCard';
import { TrustPanel } from '../../src/ui/components/TrustPanel';
import { IndoorScreen } from '../../src/ui/screens/IndoorScreen';
import { MoveScreen } from '../../src/ui/screens/MoveScreen';
import { ImpactScreen } from '../../src/ui/screens/ImpactScreen';
import { CommunityScreen } from '../../src/ui/screens/CommunityScreen';

describe('Render Smoke Test: Full User Journey & Multi-Tab Life Cycle', () => {
  const profile = PRIYA_PRESET;
  const scenarios = ['clear', 'moderate', 'severe', 'stale'] as const;

  it('completes the full pipeline across all 4 scenarios without crashing', () => {
    for (const sc of scenarios) {
      const snapshot = getSampleScenarioSnapshot(sc);
      const baseLevel = computeBaseLevel(snapshot.pm25.now, 'IN');
      const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
      const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, 'IN');
      const radar = computeRiskRadar(profile, snapshot, slots);
      const plan = buildDeterministicPlan(profile, snapshot);
      const checks = evaluateQuickChecks(profile, snapshot);
      const trust = buildTrustModel(
        snapshot,
        plan.planConfidence,
        plan.confidenceReason,
        'sample',
        sc === 'stale',
      );

      expect(effectiveLevel).toBeGreaterThanOrEqual(baseLevel);
      expect(radar.slotId).toBeDefined();
      expect(plan.topActionIds).toHaveLength(3);
      expect(checks).toHaveLength(4);
      expect(trust.sourceTier).toBe('sample');
    }
  });

  it('renders all 5 primary application screens successfully for Priya profile', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const baseLevel = computeBaseLevel(snapshot.pm25.now, 'IN');
    const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
    const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, 'IN');
    const radar = computeRiskRadar(profile, snapshot, slots);
    const checks = evaluateQuickChecks(profile, snapshot);
    const trust = buildTrustModel(snapshot, 'high', 'Demo scenario', 'sample', false);

    // 1. Today View components
    const briefingHtml = renderToString(
      <AirBriefingCard snapshot={snapshot} effectiveLevel={effectiveLevel} />,
    );
    const radarHtml = renderToString(<RiskRadarCard radar={radar} />);
    const checksHtml = renderToString(<QuickChecksCard checks={checks} />);
    const trustHtml = renderToString(<TrustPanel trust={trust} />);

    expect(briefingHtml).toContain('µg/m³ PM2.5');
    expect(radarHtml).toContain('Household Risk Radar');
    expect(checksHtml).toContain('Quick Checks');
    expect(trustHtml).toContain('Trust &amp; Data Transparency');

    // 2. Indoor Screen
    const indoorHtml = renderToString(<IndoorScreen profile={profile} snapshot={snapshot} />);
    expect(indoorHtml).toContain('Smart Ventilation Advisor');
    expect(indoorHtml).toContain('Cleaner room');

    // 3. Move Screen
    const moveHtml = renderToString(<MoveScreen profile={profile} snapshot={snapshot} />);
    expect(moveHtml).toContain('Commute Exposure Planner');
    expect(moveHtml).toContain('Walking &amp; Cycling Suitability');

    // 4. Impact Screen
    const impactHtml = renderToString(<ImpactScreen profile={profile} snapshot={snapshot} />);
    expect(impactHtml).toContain('Dual-Axis Impact');
    expect(impactHtml).toContain('Weekly Household Defensible Tally');
    expect(impactHtml).toContain('Community Aggregate Impact');
    expect(impactHtml).toContain('How we calculate this');

    // 5. Community Screen
    const communityHtml = renderToString(<CommunityScreen profile={profile} snapshot={snapshot} />);
    expect(communityHtml).toContain('For your building');
    expect(communityHtml).toContain('Demo data');
    expect(communityHtml).toContain('No-Burning Pledge');
    expect(communityHtml).toContain('Building Carpool Coordination');
    expect(communityHtml).toContain('Vulnerable Resident Buddy Check');
  });

  it('renders all four redesigned screens across the 4 scenarios with exactly one h1 and present headings', () => {
    for (const sc of scenarios) {
      const snap = getSampleScenarioSnapshot(sc);

      // IndoorScreen
      const indoorHtml = renderToString(<IndoorScreen profile={profile} snapshot={snap} />);
      const indoorH1Count = (indoorHtml.match(/<h1\b/g) || []).length;
      expect(indoorH1Count, `IndoorScreen has ${indoorH1Count} h1s in ${sc}`).toBe(1);
      expect(indoorHtml).toContain('Smart Ventilation Advisor');
      expect(indoorHtml).toContain('Cleaner room');

      // MoveScreen
      const moveHtml = renderToString(<MoveScreen profile={profile} snapshot={snap} />);
      const moveH1Count = (moveHtml.match(/<h1\b/g) || []).length;
      expect(moveH1Count, `MoveScreen has ${moveH1Count} h1s in ${sc}`).toBe(1);
      expect(moveHtml).toContain('Commute Exposure Planner');
      expect(moveHtml).toContain('Walking &amp; Cycling Suitability');

      // ImpactScreen
      const impactHtml = renderToString(<ImpactScreen profile={profile} snapshot={snap} />);
      const impactH1Count = (impactHtml.match(/<h1\b/g) || []).length;
      expect(impactH1Count, `ImpactScreen has ${impactH1Count} h1s in ${sc}`).toBe(1);
      expect(impactHtml).toContain('Dual-Axis Impact');
      expect(impactHtml).toContain('What each action changes');

      // CommunityScreen
      const communityHtml = renderToString(<CommunityScreen profile={profile} snapshot={snap} />);
      const communityH1Count = (communityHtml.match(/<h1\b/g) || []).length;
      expect(communityH1Count, `CommunityScreen has ${communityH1Count} h1s in ${sc}`).toBe(1);
      expect(communityHtml).toContain('For your building');
      expect(communityHtml).toContain('No-Burning Pledge');
    }
  });

  it('activates Severe Smog Mode correctly and preserves mandatory invariants', () => {
    const severeSnapshot = getSampleScenarioSnapshot('severe');
    const plan = buildDeterministicPlan(profile, severeSnapshot);

    expect(plan.flags.severeMode).toBe(true);
    expect(plan.topActionIds).toContain('IN-01'); // Windows closed mandatory
    expect(plan.topActionIds).toContain('PE-03'); // Indoor play mandatory
    expect(plan.topActionIds).not.toContain('MO-07'); // Outdoor walking forbidden
  });
});
