import { useState } from 'react';
import { type HouseholdProfile, type AirSnapshot, type ActionCandidate } from '../../domain/types';
import { hasSensitiveMembers } from '../../domain/levels';
import { evaluateMobilityPolicy } from '../../domain/mobility';
import { calculateAvoidedVkm } from '../../domain/impact';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionRow } from '../components/ActionRow';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { PageHeader } from '../shell/PageHeader';
import { CompareBars } from '../components/CompareBars';
import { Stat } from '../components/Stat';
import { Disclosure } from '../primitives/Disclosure';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { Icon } from '../icons';

interface MoveScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

const CommutePlannerCard: React.FC<{
  profile: HouseholdProfile;
  commuteShiftFeasible: boolean;
  usualPm25: number | null;
  altPm25: number | null;
  differenceUgm3: number | null | undefined;
}> = ({ profile, commuteShiftFeasible, usualPm25, altPm25, differenceUgm3 }) => (
  <section
    className="card card-callout-exposure mb-4"
    aria-labelledby="commute-planner-heading"
  >
    <h2 id="commute-planner-heading" className="screen-section-title">
      <Icon name="car" size={22} aria-hidden="true" />
      <span>Commute Exposure Planner</span>
    </h2>

    <div className="commute-meta-text mb-3">
      Usual departure: <strong>{profile.routine.leave}</strong>, return:{' '}
      <strong>{profile.routine.returnHome}</strong>, modes:{' '}
      <strong>{profile.travel.modes.join(', ')}</strong>
    </div>

    <CompareBars
      commuteShiftFeasible={commuteShiftFeasible}
      usualPm25={usualPm25}
      alternativePm25={altPm25}
      differenceUgm3={differenceUgm3 ?? undefined}
      usualLabel={`Usual departure (${profile.routine.leave})`}
      alternativeLabel="Shifted window (±1 hour)"
    />
  </section>
);

const WalkingSuitabilityCard: React.FC<{
  isWalkingForbidden: boolean;
}> = ({ isWalkingForbidden }) => (
  <section
    className={`card mb-4 ${isWalkingForbidden ? 'card-callout-warning' : 'card-callout-emissions'}`}
    aria-labelledby="walking-heading"
  >
    <div className="flex-row-center gap-2 mb-1">
      <Icon
        name={isWalkingForbidden ? 'warning' : 'clear'}
        size={20}
        aria-hidden="true"
      />
      <h3 id="walking-heading" className="walking-title">
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
);

const MoveAside: React.FC<{
  profile: HouseholdProfile;
  totalTravelVkm: number;
}> = ({ profile, totalTravelVkm }) => (
  <aside
    className="aw-screen-layout-aside"
    aria-label="Travel impact and commute vehicle-km context"
  >
    <div className="aw-screen-aside-sticky">
      <section className="card mb-4" aria-labelledby="travel-stat-heading">
        <h3 id="travel-stat-heading" className="text-sm font-semibold mb-2">
          Estimated vehicle-km avoided
        </h3>
        <Stat
          value={totalTravelVkm > 0 ? `~${totalTravelVkm}` : '0'}
          unit="vkm / week"
          label="Estimated (Rule E1)"
        />

        <Disclosure title="Show how this is calculated" className="mt-3">
          <div className="text-xs text-muted">
            <p className="font-semibold mb-1">Formula E1: Avoided vehicle-km</p>
            <p>
              Carpooling: oneWayKm × 2 × days × (1 - 1/occupancy). Remote work: oneWayKm × 2 ×
              days.
            </p>
            <div className="mt-2">
              <strong>Household inputs:</strong> {profile.travel.oneWayKm} km one-way,{' '}
              {profile.travel.tripsPerWeek} trips/week, remote work eligible:{' '}
              {profile.travel.canWorkRemotely ? 'yes' : 'no'}.
            </div>
          </div>
        </Disclosure>
      </section>

      <div className="card">
        <h3 className="text-sm font-semibold mb-2 flex-row-center gap-1">
          <Icon name="info" size={16} aria-hidden="true" />
          <span>Commute guidance context</span>
        </h3>
        <p className="text-xs text-muted">
          Roadside PM2.5 levels spike near idling queues and diesel corridors. Shifting timing
          or using covered transit reduces direct tailpipe exposure while cutting overall
          road vehicle-km.
        </p>
      </div>
    </div>
  </aside>
);

function deriveMoveData(
  slots: ReturnType<typeof useDailyPlan>['slots'],
  effectiveLevel: ReturnType<typeof useDailyPlan>['effectiveLevel'],
  snapshot: AirSnapshot,
  profile: HouseholdProfile,
) {
  const morningCommuteSlot = slots.find((s) => s.id === 'commute-out');
  const earlierSlot = slots.find((s) => s.id === 'early-morning');
  const daytimeSlot = slots.find((s) => s.id === 'daytime');
  const usualPm25 = morningCommuteSlot?.forecastMeanPm25 ?? null;
  const altPm25 = earlierSlot?.forecastMeanPm25 ?? daytimeSlot?.forecastMeanPm25 ?? null;

  const isFreshOrAging = snapshot.freshness === 'fresh' || snapshot.freshness === 'aging';
  const isWalkingSuitable = effectiveLevel <= 1 && isFreshOrAging;
  const isWalkingForbidden = !isWalkingSuitable;

  const carpoolVkm = calculateAvoidedVkm('MO-03', profile) || 0;
  const remoteVkm = calculateAvoidedVkm('MO-05', profile) || 0;
  const totalTravelVkm = Math.round((carpoolVkm + remoteVkm) * 10) / 10;

  return { usualPm25, altPm25, isWalkingForbidden, totalTravelVkm };
}

export function MoveScreen({ profile, snapshot }: MoveScreenProps) {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { effectiveLevel, slots, policyResult } = useDailyPlan(
    profile,
    snapshot,
    targetRegion,
    false,
  );

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
    policyResult?.approvedCandidates.filter(
      (c: ActionCandidate) => c.action.category === 'mobility',
    ) || [];

  const { usualPm25, altPm25, isWalkingForbidden, totalTravelVkm } = deriveMoveData(
    slots,
    effectiveLevel,
    snapshot,
    profile,
  );

  return (
    <div className="move-screen screen-container">
      <PageHeader title="Travel & Commute Planner" description={ROUTE_DESCRIPTIONS.move} />

      <div className="aw-screen-layout-grid">
        <div className="aw-screen-layout-main">
          <CommutePlannerCard
            profile={profile}
            commuteShiftFeasible={mobilityPolicy.commuteShiftFeasible}
            usualPm25={usualPm25}
            altPm25={altPm25}
            differenceUgm3={mobilityPolicy.forecastDifferenceUgm3}
          />

          <WalkingSuitabilityCard isWalkingForbidden={isWalkingForbidden} />

          <section aria-labelledby="move-actions-heading" className="card mb-4">
            <h2 id="move-actions-heading" className="section-heading mb-3">
              Travel &amp; Commute Recommendations
            </h2>
            <div className="actions-stack">
              {moveCandidates.map((cand: ActionCandidate) => (
                <ActionRow
                  key={cand.action.id}
                  candidate={cand}
                  showEffort
                  showAxisSummary
                  onSelect={(c: ActionCandidate) => setSelectedAction(c)}
                />
              ))}
            </div>
          </section>
        </div>

        <MoveAside profile={profile} totalTravelVkm={totalTravelVkm} />
      </div>

      {selectedAction && (
        <ActionDetailModal candidate={selectedAction} onClose={() => setSelectedAction(null)} />
      )}
    </div>
  );
}

export default MoveScreen;
