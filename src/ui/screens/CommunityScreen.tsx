import React, { useState } from 'react';
import { HouseholdProfile, AirSnapshot, RiskLevel } from '../../domain/types';
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
import { Icon } from '../icons';

interface CommunityScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ profile, snapshot }) => {
  const [hasPledged, setHasPledged] = useCommunityPledge();
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

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

  const handleCopyBriefing = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableText);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = shareableText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    } catch {
      // Fallback
    }
  };

  const totalPledges = society.basePledges.noBurning + (hasPledged ? 1 : 0);
  const pm25Now = snapshot.pm25.now !== null ? Math.round(snapshot.pm25.now) : null;
  const levelName = LEVEL_NAMES[effectiveLevel as RiskLevel] || 'Caution';

  return (
    <div className="community-screen screen-container">
      {/* Demo Data Header Banner */}
      <section
        className="card card-callout-exposure"
        aria-labelledby="community-header-title"
      >
        <div className="section-title-row mb-1">
          <h2 id="community-header-title" className="section-heading flex-row-center gap-1">
            <Icon name="people" size={20} aria-hidden="true" />
            <span>Residential Community Mode</span>
          </h2>
          <span className="aw-badge aw-badge-data-type">
            Demo data
          </span>
        </div>

        <p className="community-header-desc">
          Demonstrating collective building action at <strong>{society.name}</strong> ({society.totalHomes} homes).
          Helps housing societies coordinate waste burning bans, morning carpools, and vulnerable resident welfare.
        </p>
      </section>

      {/* Society Daily Air Briefing Card */}
      <section className="card" aria-labelledby="society-briefing-title">
        <div className="society-briefing-header">
          <div>
            <span className="society-subtitle">
              Today's Society Briefing
            </span>
            <h3 id="society-briefing-title" className="society-title">
              {society.name}
            </h3>
          </div>

          <div className={`society-level-badge card-risk-level-${effectiveLevel}`}>
            <div className="society-level-pm25">
              {pm25Now !== null ? `${pm25Now} µg/m³` : 'Unmeasured'}
            </div>
            <div className="society-level-name">
              {levelName} level
            </div>
          </div>
        </div>

        <p className="society-briefing-summary">
          {effectiveLevel >= 3
            ? `Air is ${levelName} level for most households here. Residents should keep windows sealed and limit outdoor time for children and seniors.`
            : `Air is ${levelName} level for most households here. Maintain regular ventilation discipline and avoid smoke-generating activities.`}
        </p>

        {/* Copyable Plain-Text Briefing for WhatsApp / Notice Board (Rule CM-04) */}
        <div className="shareable-box">
          <div className="shareable-header">
            <span className="shareable-title">
              WhatsApp / Notice Board Format
            </span>
            <button
              type="button"
              onClick={handleCopyBriefing}
              className="btn-secondary shareable-copy-btn"
              aria-label="Copy plain text briefing to clipboard"
            >
              <Icon name="copy" size={16} aria-hidden="true" />
              <span>{copyFeedback ? 'Copied' : 'Copy Briefing'}</span>
            </button>
          </div>

          <pre className="code-snippet">
            {shareableText}
          </pre>
        </div>

        {copyFeedback && (
          <div
            role="status"
            className="box-highlight-emissions text-xs font-semibold"
          >
            Daily clean-air briefing copied to clipboard. Ready to paste into society chat.
          </div>
        )}
      </section>

      {/* Action CM-01: Zero Open Burning Pledge */}
      <section className="card" aria-labelledby="pledge-heading">
        <div className="pledge-header-row">
          <div>
            <span className="pledge-subtitle text-emissions">
              Action CM-01 · Clean Air Pledge
            </span>
            <h3 id="pledge-heading" className="pledge-title">
              No-Burning Pledge
            </h3>
          </div>

          <span className="tag-emissions-pill">
            {totalPledges} / {society.totalHomes} Pledged
          </span>
        </div>

        <p className="pledge-desc">
          Open burning of leaves, garden waste, or rubbish creates dangerous localized PM2.5 spikes.
        </p>

        <button
          type="button"
          onClick={handleTogglePledge}
          className={`pledge-toggle-btn ${hasPledged ? 'pledge-toggle-pledged' : 'pledge-toggle-unpledged'}`}
          aria-pressed={hasPledged}
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
      <section className="card" aria-labelledby="carpool-heading">
        <span className="carpool-subtitle text-exposure">
          Action CM-02 · Collective Mobility
        </span>
        <h3 id="carpool-heading" className="carpool-title">
          Building Carpool Coordination
        </h3>
        <p className="carpool-desc">
          {SEEDED_CARPOOL_HOUSEHOLDS} residents at {society.name} coordinate morning departures on common tech corridor routes.
        </p>

        <div className="carpool-stats-grid">
          <div>
            <div className="carpool-stat-val">{SEEDED_CARPOOL_HOUSEHOLDS}</div>
            <div className="carpool-stat-label">Commuters</div>
          </div>
          <div>
            <div className="carpool-stat-val">08:30</div>
            <div className="carpool-stat-label">Departure Slot</div>
          </div>
          <div>
            <div className="carpool-stat-val">~{SEEDED_BASELINE_CARPOOL_VKM}</div>
            <div className="carpool-stat-label">vkm saved/wk</div>
          </div>
        </div>
      </section>

      {/* Action CM-03: Buddy-Check List for Vulnerable Neighbors */}
      <section className="card" aria-labelledby="buddy-check-heading">
        <span className="buddy-subtitle text-warning">
          Action CM-03 · Vulnerability Care
        </span>
        <h3 id="buddy-check-heading" className="buddy-title">
          Vulnerable Resident Buddy Check
        </h3>
        <p className="buddy-desc">
          Healthy residents check on at-risk households during elevated pollution episodes.
        </p>

        <div className="buddy-census-grid">
          <div className="buddy-census-card">
            <div className="buddy-census-num">
              {society.vulnerableCensus.seniors}
            </div>
            <div className="buddy-census-label">Seniors (65+)</div>
          </div>

          <div className="buddy-census-card">
            <div className="buddy-census-num">
              {society.vulnerableCensus.childrenUnder12}
            </div>
            <div className="buddy-census-label">Children (&lt;12)</div>
          </div>

          <div className="buddy-census-card">
            <div className="buddy-census-num">
              {society.vulnerableCensus.respiratoryFlagged}
            </div>
            <div className="buddy-census-label">Respiratory</div>
          </div>
        </div>

        <div className="buddy-note">
          Census displays aggregated, non-identifying counts only to preserve neighbor privacy.
        </div>
      </section>

      {/* Aggregate Community Vehicle-KM Avoided (Formula C1) */}
      <section className="card" aria-labelledby="community-vkm-heading">
        <h3 id="community-vkm-heading" className="community-vkm-title">
          Aggregate Community Vehicle-KM Avoided
        </h3>
        <div className="community-tally-box">
          <span className="community-tally-num">
            ~{aggregateVkm}
          </span>
          <span className="community-tally-label">
            vkm avoided this week (Formula C1)
          </span>
        </div>

        <p className="community-vkm-desc">
          Combines {society.name}'s baseline ({SEEDED_BASELINE_CARPOOL_VKM} vkm across {SEEDED_CARPOOL_HOUSEHOLDS} carpooling residents) with your household's profile contribution.
        </p>
      </section>
    </div>
  );
};
