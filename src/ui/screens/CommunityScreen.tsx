import React, { useState, useEffect } from 'react';
import { HouseholdProfile, AirSnapshot } from '../../domain/types';
import { computeBaseLevel, computeEffectiveLevel } from '../../domain/levels';
import {
  GREEN_MEADOWS_SOCIETY,
  calculateCommunityAggregateVkm,
  generateShareableBriefing,
} from '../../data/community';

interface CommunityScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

const STORAGE_KEY_PLEDGE = 'airwise_community_no_burning_pledge';

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ profile, snapshot }) => {
  const [hasPledged, setHasPledged] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
  const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);

  const society = GREEN_MEADOWS_SOCIETY;
  const aggregateVkm = calculateCommunityAggregateVkm(profile);
  const shareableText = generateShareableBriefing(snapshot, effectiveLevel, society);

  // Initialize pledge from localStorage safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY_PLEDGE);
        if (stored === 'true') {
          setHasPledged(true);
        }
      }
    } catch {
      // Storage unavailable / blocked
    }
  }, []);

  const handleTogglePledge = () => {
    const nextState = !hasPledged;
    setHasPledged(nextState);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_PLEDGE, String(nextState));
      }
    } catch {
      // Storage unavailable
    }
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

  return (
    <div className="community-screen" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Demo Data Header Banner */}
      <section
        className="card"
        style={{
          borderLeft: '4px solid #1a73e8',
          backgroundColor: '#f8fafc',
        }}
        aria-labelledby="community-header-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 id="community-header-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
            👥 Residential Community Mode
          </h2>
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: '#e8f0fe',
              color: '#1a73e8',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Demo data
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          Demonstrating collective building action at <strong>{society.name}</strong> ({society.totalHomes} homes).
          Helps housing societies coordinate waste burning bans, morning carpools, and vulnerable resident welfare.
        </p>
      </section>

      {/* Society Daily Air Briefing Card */}
      <section className="card" aria-labelledby="society-briefing-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Today's Society Briefing
            </span>
            <h3 id="society-briefing-title" style={{ margin: '2px 0 0 0', fontSize: '1.1rem' }}>
              {society.name}
            </h3>
          </div>

          <div
            style={{
              textAlign: 'right',
              padding: '4px 10px',
              backgroundColor: `var(--level-${effectiveLevel}-bg)`,
              border: `1px solid var(--level-${effectiveLevel}-border)`,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: `var(--level-${effectiveLevel}-text)` }}>
              {pm25Now !== null ? `${pm25Now} µg/m³` : 'Unmeasured'}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: `var(--level-${effectiveLevel}-text)` }}>
              Level {effectiveLevel}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>
          {effectiveLevel >= 3
            ? 'Smog advisory active. Residents should keep windows sealed and limit outdoor time for children and seniors.'
            : 'Moderate baseline conditions. Maintain regular ventilation discipline and avoid smoke-generating activities.'}
        </p>

        {/* Copyable Plain-Text Briefing for WhatsApp / Notice Board (Rule CM-04) */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              📱 WhatsApp / Notice Board Format
            </span>
            <button
              type="button"
              onClick={handleCopyBriefing}
              className="btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '0.8rem',
                minHeight: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              aria-label="Copy plain text briefing to clipboard"
            >
              {copyFeedback ? '✓ Copied!' : '📋 Copy Briefing'}
            </button>
          </div>

          <pre
            style={{
              margin: 0,
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--color-text-muted)',
              fontFamily: 'monospace',
              maxHeight: '140px',
              overflowY: 'auto',
              lineHeight: 1.4,
            }}
          >
            {shareableText}
          </pre>
        </div>

        {copyFeedback && (
          <div
            role="status"
            style={{
              padding: '6px 12px',
              backgroundColor: '#e6f4ea',
              color: '#137333',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            ✓ Daily clean-air briefing copied to clipboard. Ready to paste into society chat!
          </div>
        )}
      </section>

      {/* Action CM-01: Zero Open Burning Pledge */}
      <section className="card" aria-labelledby="pledge-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#137333', textTransform: 'uppercase' }}>
              Action CM-01 · Clean Air Pledge
            </span>
            <h3 id="pledge-heading" style={{ margin: '2px 0 0 0', fontSize: '1.05rem' }}>
              Zero Open Burning Pledge
            </h3>
          </div>

          <span
            style={{
              padding: '2px 8px',
              backgroundColor: '#e6f4ea',
              color: '#137333',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {totalPledges} / {society.totalHomes} Pledged
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0', lineHeight: 1.4 }}>
          Open burning of leaves, garden cuttings, or domestic waste creates dangerous localized PM2.5 spikes.
          Pledging commits your household and staff to 100% municipal waste collection.
        </p>

        <button
          type="button"
          onClick={handleTogglePledge}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: hasPledged ? '1px solid #ceead6' : '1px solid #137333',
            backgroundColor: hasPledged ? '#e6f4ea' : '#137333',
            color: hasPledged ? '#137333' : '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          aria-pressed={hasPledged}
        >
          {hasPledged ? '✓ Household Pledged to Zero Burning' : '✍️ Sign No-Burning Pledge'}
        </button>
      </section>

      {/* Action CM-02: Carpool Coordination Concept */}
      <section className="card" aria-labelledby="carpool-heading">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase' }}>
          Action CM-02 · Collective Mobility
        </span>
        <h3 id="carpool-heading" style={{ margin: '2px 0 6px 0', fontSize: '1.05rem' }}>
          Building Carpool Coordination
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0', lineHeight: 1.4 }}>
          {society.basePledges.carpoolParticipants} residents at {society.name} coordinate morning departures on common tech corridor routes.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '10px',
            backgroundColor: '#e8f0fe',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a73e8' }}>18</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Commuters</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a73e8' }}>08:30</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Departure Slot</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a73e8' }}>~180+</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>vkm saved/wk</div>
          </div>
        </div>
      </section>

      {/* Action CM-03: Buddy-Check List for Vulnerable Neighbors */}
      <section className="card" aria-labelledby="buddy-check-heading">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>
          Action CM-03 · Vulnerability Care
        </span>
        <h3 id="buddy-check-heading" style={{ margin: '2px 0 6px 0', fontSize: '1.05rem' }}>
          Vulnerable Resident Buddy Check
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0', lineHeight: 1.4 }}>
          In severe smog episodes, healthy residents check on at-risk households to deliver groceries or help seal drafty windows.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: 'var(--space-2)' }}>
          <div
            style={{
              padding: '8px',
              backgroundColor: '#fff7ed',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #fed7aa',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9a3412' }}>
              {society.vulnerableCensus.seniors}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9a3412' }}>Seniors (65+)</div>
          </div>

          <div
            style={{
              padding: '8px',
              backgroundColor: '#fff7ed',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #fed7aa',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9a3412' }}>
              {society.vulnerableCensus.childrenUnder12}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9a3412' }}>Children (&lt;12)</div>
          </div>

          <div
            style={{
              padding: '8px',
              backgroundColor: '#fff7ed',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #fed7aa',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9a3412' }}>
              {society.vulnerableCensus.respiratoryFlagged}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9a3412' }}>Respiratory</div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          Census displays aggregated, non-identifying counts only to preserve neighbor privacy.
        </div>
      </section>

      {/* Aggregate Community Vehicle-KM Avoided (Formula C1) */}
      <section className="card" aria-labelledby="community-vkm-heading">
        <h3 id="community-vkm-heading" style={{ margin: '0 0 6px 0', fontSize: '1.05rem' }}>
          🌱 Aggregate Community Vehicle-KM Avoided
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#137333' }}>
            ~{aggregateVkm}
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#137333' }}>
            vkm avoided this week (Formula C1)
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          Combines {society.name}'s baseline ({society.seededWeeklyAvoidedVkm} vkm across 18 carpooling residents) with your household's profile contribution.
        </p>
      </section>
    </div>
  );
};
