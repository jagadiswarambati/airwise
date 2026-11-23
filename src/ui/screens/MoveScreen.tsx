import { useState } from 'react';
import { HouseholdProfile, AirSnapshot, ActionCandidate } from '../../domain/types';
import { hasSensitiveMembers } from '../../domain/levels';
import { evaluateMobilityPolicy } from '../../domain/mobility';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionCard } from '../components/ActionCard';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { Icon } from '../icons';

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
    <div className="move-screen screen-container">
      {/* Commute Exposure Planner */}
      <section className="card card-callout-exposure" aria-labelledby="commute-planner-heading">
        <h2 id="commute-planner-heading" className="screen-section-title">
          <Icon name="car" size={22} aria-hidden="true" />
          <span>Commute Exposure Planner</span>
        </h2>

        <div className="commute-meta-text">
          Usual departure: <strong>{profile.routine.leave}</strong> · Return: <strong>{profile.routine.returnHome}</strong> · Modes: <strong>{profile.travel.modes.join(', ')}</strong>
        </div>

        {mobilityPolicy.commuteShiftFeasible ? (
          <div className="box-highlight-exposure">
            <div className="flex-row-center gap-1">
              <Icon name="exposure" size={16} aria-hidden="true" />
              <strong>Commute timing window benefit detected (Rule P-16):</strong>
            </div>
            <p className="mt-1">
              Shifting departure by 1 hour reduces travel exposure by approximately{' '}
              <strong>{Math.round(mobilityPolicy.forecastDifferenceUgm3 || 0)} µg/m³</strong> compared to peak road stagnation.
            </p>
          </div>
        ) : (
          <div className="box-subtle">
            {profile.travel.canShiftTime
              ? 'Forecast pollution levels are relatively uniform across morning travel windows today; a timing shift does not exceed the required 15% and 5 µg/m³ improvement threshold.'
              : 'Commute shift is marked as not flexible in your household profile.'}
          </div>
        )}
      </section>

      {/* Walking and Cycling Suitability Banner */}
      <section
        className={`card ${isWalkingForbidden ? 'card-callout-warning' : 'card-callout-emissions'}`}
      >
        <div className="flex-row-center gap-2 mb-1">
          <Icon name={isWalkingForbidden ? 'warning' : 'clear'} size={20} aria-hidden="true" />
          <h3 className="walking-title">
            Walking &amp; Cycling Suitability:{' '}
            <span className={isWalkingForbidden ? 'text-warning' : 'text-emissions'}>
              {isWalkingForbidden ? 'Not suitable today' : 'Suitable for short trips'}
            </span>
          </h3>
        </div>
        <p className="walking-explanation">
          {isWalkingForbidden
            ? 'Aerobic exertion increases inhaled particulate volume by 3–5x. With current elevated PM2.5 or dark/stale conditions, outdoor walking and cycling are suppressed (Rule P-08).'
            : 'Outdoor PM2.5 is low and daylight conditions are favorable for walking or cycling.'}
        </p>
      </section>

      {/* Recommended Mobility Actions */}
      <section aria-labelledby="move-actions-heading">
        <h2 id="move-actions-heading" className="section-heading mb-3">
          Travel &amp; Commute Recommendations
        </h2>
        <div className="actions-stack">
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
