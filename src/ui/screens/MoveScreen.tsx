import { useState } from 'react';
import { HouseholdProfile, AirSnapshot, ActionCandidate } from '../../domain/types';
import { hasSensitiveMembers } from '../../domain/levels';
import { evaluateMobilityPolicy } from '../../domain/mobility';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionCard } from '../components/ActionCard';
import { ActionDetailModal } from '../components/ActionDetailModal';

interface MoveScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export function MoveScreen({ profile, snapshot }: MoveScreenProps) {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { effectiveLevel, slots, policyResult } = useDailyPlan(profile, snapshot, targetRegion, false);

  const mobilityPolicy = evaluateMobilityPolicy(
    profile,
    effectiveLevel,
    snapshot.freshness,
    slots,
    hasSensitiveMembers(profile.members),
    snapshot.daylight,
    snapshot.observedAt,
    snapshot.utcOffsetSeconds,
  );

  const moveCandidates =
    policyResult?.approvedCandidates.filter((c: ActionCandidate) => c.action.category === 'mobility') || [];

  const isWalkingSuitable = effectiveLevel <= 1 && (snapshot.freshness === 'fresh' || snapshot.freshness === 'aging');
  const isWalkingForbidden = !isWalkingSuitable;

  return (
    <div className="move-screen" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Commute Exposure Planner */}
      <section className="card" aria-labelledby="commute-planner-heading" style={{ borderLeft: '4px solid #1a73e8' }}>
        <h2 id="commute-planner-heading" style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.25rem' }}>
          🚗 Commute Exposure Planner
        </h2>

        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          Usual departure: <strong>{profile.routine.leave}</strong> · Return: <strong>{profile.routine.returnHome}</strong> · Modes: <strong>{profile.travel.modes.join(', ')}</strong>
        </div>

        {mobilityPolicy.commuteShiftFeasible ? (
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: '#e8f0fe',
              borderRadius: 'var(--radius-sm)',
              color: '#1a73e8',
              fontSize: '0.9rem',
              lineHeight: 1.4,
            }}
          >
            <strong>✨ Commute timing window benefit detected (Rule P-16):</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Shifting departure by 1 hour reduces travel exposure by approximately{' '}
              <strong>{Math.round(mobilityPolicy.forecastDifferenceUgm3 || 0)} µg/m³</strong> compared to peak road stagnation.
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {profile.travel.canShiftTime
              ? 'Forecast pollution levels are relatively uniform across morning travel windows today; a timing shift does not exceed the required 15% and 5 µg/m³ improvement threshold.'
              : 'Commute shift is marked as not flexible in your household profile.'}
          </div>
        )}
      </section>

      {/* Walking and Cycling Suitability Banner */}
      <section
        className="card"
        style={{
          borderLeft: isWalkingForbidden ? '4px solid #c5221f' : '4px solid #137333',
          backgroundColor: isWalkingForbidden ? '#fffbfa' : '#f8fdf9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <span style={{ fontSize: '1.2rem' }}>{isWalkingForbidden ? '⚠️' : '🚲'}</span>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
            Walking & Cycling Suitability:{' '}
            <span style={{ color: isWalkingForbidden ? '#c5221f' : '#137333' }}>
              {isWalkingForbidden ? 'Not suitable today' : 'Suitable for short trips'}
            </span>
          </h3>
        </div>
        <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          {isWalkingForbidden
            ? 'Aerobic exertion increases inhaled particulate volume by 3–5x. With current elevated PM2.5 or dark/stale conditions, outdoor walking and cycling are suppressed (Rule P-08).'
            : 'Outdoor PM2.5 is low and daylight conditions are favorable for walking or cycling.'}
        </p>
      </section>

      {/* Recommended Mobility Actions */}
      <section aria-labelledby="move-actions-heading">
        <h2 id="move-actions-heading" style={{ margin: '0 0 var(--space-3) 0', fontSize: '1.15rem' }}>
          Travel & Commute Recommendations
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {moveCandidates.map((cand: ActionCandidate) => (
            <ActionCard
              key={cand.action.id}
              candidate={cand}
              onSelect={(c: ActionCandidate) => setSelectedAction(c)}
            />
          ))}
        </div>
      </section>

      {/* Action Detail Modal */}
      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
}
