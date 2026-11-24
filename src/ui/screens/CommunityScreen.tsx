import React from 'react';
import { type HouseholdProfile, type AirSnapshot, type RiskLevel } from '../../domain/types';
import { LEVEL_NAMES } from '../../domain/levels';
import {
  GREEN_MEADOWS_SOCIETY,
  calculateCommunityAggregateVkm,
  generateShareableBriefing,
  SEEDED_CARPOOL_HOUSEHOLDS,
  SEEDED_BASELINE_CARPOOL_VKM,
} from '../../data/community';
import { useCommunityPledge } from '../../state/communityStore';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { BriefingPreview } from '../components/BriefingPreview';
import { Stat } from '../components/Stat';
import { Chip } from '../primitives/Chip';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { Icon } from '../icons';

interface CommunityScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ profile, snapshot }) => {
  const [hasPledged, setHasPledged] = useCommunityPledge();

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { effectiveLevel, plan } = useDailyPlan(profile, snapshot, targetRegion, true);

  const society = GREEN_MEADOWS_SOCIETY;
  const aggregateVkm = calculateCommunityAggregateVkm(profile, hasPledged);
  const topActionTitles = plan?.topActions.map((c) => c.action.title) || [];
  const shareableText = generateShareableBriefing(
    snapshot,
    effectiveLevel,
    topActionTitles,
    hasPledged,
  );

  const handleTogglePledge = () => {
    setHasPledged(!hasPledged);
  };

  const totalPledges = society.basePledges.noBurning + (hasPledged ? 1 : 0);
  const pm25Now = snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now) : null;
  const levelName = LEVEL_NAMES[effectiveLevel as RiskLevel] || 'Caution';

  return (
    <div className="community-screen screen-container">
      <PageHeader title="Community Action & Briefing" description={ROUTE_DESCRIPTIONS.community} />

      {/* For Your Building Header Banner */}
      <section
        className="card card-callout-exposure mb-4"
        aria-labelledby="community-header-title"
      >
        <div className="section-title-row mb-1">
          <h2 id="community-header-title" className="section-heading flex-row-center gap-1">
            <Icon name="people" size={20} aria-hidden="true" />
            <span>For your building</span>
          </h2>
          <Chip label="Demo data" selected={false} />
        </div>

        <p className="community-header-desc text-sm">
          Demonstrating collective building action at <strong>{society.name}</strong> (
          {society.totalHomes} homes). Helps housing societies coordinate waste burning bans, morning
          carpools, and vulnerable resident welfare.
        </p>
      </section>

      <div className="aw-screen-layout-grid">
        {/* Left Column on Desktop / Main Flow */}
        <div className="aw-screen-layout-main">
          {/* Society Daily Air Briefing Status Card */}
          <section className="card mb-4" aria-labelledby="society-briefing-title">
            <div className="society-briefing-header flex-between mb-2">
              <div>
                <span className="society-subtitle text-xs text-muted block">
                  Today's Society Briefing
                </span>
                <div className="flex-row-center gap-2 mt-1">
                  <h3 id="society-briefing-title" className="society-title">
                    {society.name}
                  </h3>
                  <Chip label="Demo data" selected={false} />
                </div>
              </div>

              {/* Level Shown by Name and Icon, Never "Level 3" */}
              <div
                className={`society-level-badge card-risk-level-${effectiveLevel} flex-col-center`}
              >
                <div className="society-level-pm25 font-bold">
                  {pm25Now !== null ? `${pm25Now} µg/m³` : 'Unmeasured'}
                </div>
                <div className="society-level-name flex-row-center gap-1 text-xs">
                  <Icon name="protect" size={12} aria-hidden="true" />
                  <span>{levelName} level</span>
                </div>
              </div>
            </div>

            <p className="society-briefing-summary text-sm text-muted mb-3">
              {effectiveLevel >= 3
                ? `Air is ${levelName} level for most households here. Residents should keep windows sealed and limit outdoor time for children and seniors.`
                : `Air is ${levelName} level for most households here. Maintain regular ventilation discipline and avoid smoke-generating activities.`}
            </p>

            {/* Briefing Preview with Copy Button and LiveRegion Announcement */}
            <BriefingPreview briefingText={shareableText} societyName={society.name} />
          </section>

          {/* Action CM-01: Zero Open Burning Pledge */}
          <section className="card mb-4" aria-labelledby="pledge-heading">
            <div className="pledge-header-row flex-between mb-2">
              <div>
                <span className="pledge-subtitle text-emissions text-xs font-semibold block">
                  Action CM-01 · Clean Air Pledge
                </span>
                <h3 id="pledge-heading" className="pledge-title text-base font-bold">
                  No-Burning Pledge
                </h3>
              </div>

              <span className="tag-emissions-pill">
                {totalPledges} / {society.totalHomes} Pledged
              </span>
            </div>

            <p className="pledge-desc text-sm text-muted mb-3">
              Open burning of leaves, garden waste, or rubbish creates dangerous localized PM2.5
              spikes.
            </p>

            {/* Pledge as Toggle Button with aria-pressed */}
            <button
              type="button"
              onClick={handleTogglePledge}
              className={`pledge-toggle-btn ${hasPledged ? 'pledge-toggle-pledged' : 'pledge-toggle-unpledged'}`}
              aria-pressed={hasPledged}
              aria-label={`Zero burning pledge. Currently ${hasPledged ? 'pledged' : 'unpledged'}. Total ${totalPledges} of ${society.totalHomes} pledged.`}
            >
              {hasPledged ? (
                <>
                  <Icon name="check" size={18} aria-hidden="true" />
                  <span>Pledged not to burn leaves, garden waste or rubbish</span>
                </>
              ) : (
                <span>Pledge not to burn leaves, garden waste or rubbish</span>
              )}
            </button>
          </section>

          {/* Action CM-02: Carpool Coordination Concept */}
          <section className="card mb-4" aria-labelledby="carpool-heading">
            <span className="carpool-subtitle text-exposure text-xs font-semibold block mb-1">
              Action CM-02 · Collective Mobility
            </span>
            <h3 id="carpool-heading" className="carpool-title text-base font-bold mb-1">
              Building Carpool Coordination
            </h3>
            <p className="carpool-desc text-sm text-muted mb-3">
              {SEEDED_CARPOOL_HOUSEHOLDS} residents at {society.name} coordinate morning departures
              on common corridor routes.
            </p>

            {/* Carpool Definition List */}
            <dl className="aw-definition-list" aria-label="Carpool statistics">
              <div className="aw-def-item">
                <dt className="aw-def-label">Commuters</dt>
                <dd className="aw-def-val">{SEEDED_CARPOOL_HOUSEHOLDS}</dd>
              </div>
              <div className="aw-def-item">
                <dt className="aw-def-label">Departure slot</dt>
                <dd className="aw-def-val">08:30</dd>
              </div>
              <div className="aw-def-item">
                <dt className="aw-def-label">Vehicle-km saved</dt>
                <dd className="aw-def-val">~{SEEDED_BASELINE_CARPOOL_VKM} vkm/wk</dd>
              </div>
            </dl>
          </section>

          {/* Action CM-03: Buddy-Check List for Vulnerable Neighbors */}
          <section className="card mb-4" aria-labelledby="buddy-check-heading">
            <span className="buddy-subtitle text-warning text-xs font-semibold block mb-1">
              Action CM-03 · Vulnerability Care
            </span>
            <h3 id="buddy-check-heading" className="buddy-title text-base font-bold mb-1">
              Vulnerable Resident Buddy Check
            </h3>
            <p className="buddy-desc text-sm text-muted mb-3">
              Healthy residents check on at-risk households during elevated pollution episodes.
            </p>

            {/* Buddy-Check Definition List */}
            <dl className="aw-definition-list" aria-label="Vulnerable resident census">
              <div className="aw-def-item">
                <dt className="aw-def-label">Seniors (65+)</dt>
                <dd className="aw-def-val">{society.vulnerableCensus.seniors}</dd>
              </div>
              <div className="aw-def-item">
                <dt className="aw-def-label">Children (&lt;12)</dt>
                <dd className="aw-def-val">{society.vulnerableCensus.childrenUnder12}</dd>
              </div>
              <div className="aw-def-item">
                <dt className="aw-def-label">Respiratory</dt>
                <dd className="aw-def-val">{society.vulnerableCensus.respiratoryFlagged}</dd>
              </div>
            </dl>

            <div className="buddy-note text-xs text-muted mt-3">
              Census displays aggregated, non-identifying counts only to preserve neighbor privacy.
            </div>
          </section>
        </div>

        {/* Sticky Aside at >= 1100px */}
        <aside
          className="aw-screen-layout-aside"
          aria-label="Community impact tally and coordination details"
        >
          <div className="aw-screen-aside-sticky">
            {/* Aggregate Community Vehicle-KM Avoided Card */}
            <section className="card mb-4" aria-labelledby="community-vkm-heading">
              <h3 id="community-vkm-heading" className="text-sm font-semibold mb-2">
                Aggregate Community Vehicle-KM Avoided
              </h3>
              <Stat
                value={`~${aggregateVkm}`}
                unit="vkm avoided this week (Formula C1)"
                label="Estimated, demo data"
              />

              <p className="community-vkm-desc text-xs text-muted mt-3">
                Combines {society.name}'s baseline (432 vkm across{' '}
                {SEEDED_CARPOOL_HOUSEHOLDS} carpooling residents) with your household's profile
                contribution.
              </p>
            </section>

            {/* Community Collective Impact Note */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-2 flex-row-center gap-1">
                <Icon name="people" size={16} aria-hidden="true" />
                <span>Neighbourhood coordination</span>
              </h3>
              <p className="text-xs text-muted">
                Local actions like stopping biomass burning and coordinating vehicle trips prevent
                hyper-local pollution hotspots right outside your building.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CommunityScreen;
