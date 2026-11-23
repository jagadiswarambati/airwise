import { useState } from 'react';
import { HouseholdProfile, AirSnapshot, ActionCandidate } from '../../domain/types';
import { decideVentilation } from '../../domain/ventilation';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionCard } from '../components/ActionCard';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { Icon } from '../icons';

interface IndoorScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export function IndoorScreen({ profile, snapshot }: IndoorScreenProps) {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { effectiveLevel, slots, policyResult } = useDailyPlan(profile, snapshot, targetRegion, false);

  const ventResult = decideVentilation({ snapshot, effectiveLevel, slots, targetRegion });
  const indoorCandidates =
    policyResult?.approvedCandidates.filter((c: ActionCandidate) => c.action.category === 'indoor') || [];

  const isCombustionRisk =
    profile.homeHeating === 'combustion' ||
    (profile.cooking.fuel === 'biomass' && !profile.cooking.hasExhaust);

  const hasPurifier = profile.equipment.purifier;

  const ventBadgeClass =
    ventResult.verdict === 'open'
      ? 'vent-badge-open'
      : ventResult.verdict === 'brief'
        ? 'vent-badge-brief'
        : 'vent-badge-closed';

  return (
    <div className="indoor-screen screen-container">
      <PageHeader
        title="At Home Clean-Air Guide"
        description={ROUTE_DESCRIPTIONS.indoor}
      />

      {/* Smart Ventilation Advisor */}
      <section className="card card-callout-primary" aria-labelledby="vent-heading">
        <h2 id="vent-heading" className="screen-section-title">
          <Icon name="wind" size={22} aria-hidden="true" />
          <span>Smart Ventilation Advisor</span>
        </h2>

        <div className={`vent-badge ${ventBadgeClass}`}>
          {ventResult.verdict === 'open' && (
            <>
              <Icon name="check" size={16} aria-hidden="true" />
              <span>Ventilate freely (Air is clean)</span>
            </>
          )}
          {ventResult.verdict === 'brief' && (
            <>
              <Icon name="watch" size={16} aria-hidden="true" />
              <span>Brief ventilation window</span>
            </>
          )}
          {ventResult.verdict === 'closed' && (
            <>
              <Icon name="close" size={16} aria-hidden="true" />
              <span>Keep windows closed</span>
            </>
          )}
        </div>

        <p className="vent-explanation">
          {ventResult.explanation}
        </p>

        {ventResult.atHour !== undefined && (
          <div className="box-subtle">
            <strong>Recommended window: </strong>
            Around {ventResult.atHour}:00
          </div>
        )}

        {/* P-22 Combustion Safety Warning */}
        {isCombustionRisk && (
          <div
            role="alert"
            className="combustion-alert"
          >
            <div className="flex-row-center gap-1">
              <Icon name="warning" size={18} aria-hidden="true" />
              <strong>Carbon Monoxide Safety (Rule P-22):</strong>
            </div>
            <p className="mt-1">
              Your home uses unvented combustion heating or biomass cooking without an exhaust chimney. Never seal air gaps or
              keep the space 100% airtight. Ensure adequate fresh airflow to prevent lethal carbon monoxide accumulation.
            </p>
          </div>
        )}
      </section>

      {/* Cleaner Room Sanctuary */}
      <section className="card" aria-labelledby="cleaner-room-heading">
        <h2 id="cleaner-room-heading" className="screen-section-title">
          <Icon name="protect" size={22} aria-hidden="true" />
          <span>Cleaner-Room Sanctuary</span>
        </h2>
        <p className="sanctuary-desc">
          Even without whole-home filtration, creating one designated cleaner room drastically cuts 8–10 hours of overnight exposure for
          vulnerable family members.
        </p>
        <ul className="cleaner-room-list">
          <li>Choose a bedroom with the fewest exterior doors and windows.</li>
          <li>Keep interior doors closed to isolate cooking and outside drafts.</li>
          {hasPurifier ? (
            <li>Run your air purifier continuously in this designated room with doors closed.</li>
          ) : (
            <li>Damp-wipe surfaces and avoid moving rugs or sweeping in this room during peak smog.</li>
          )}
        </ul>
      </section>

      {/* Recommended Indoor Actions */}
      <section aria-labelledby="indoor-actions-heading">
        <h2 id="indoor-actions-heading" className="section-heading mb-3">
          Household Indoor Recommendations
        </h2>
        <div className="actions-stack">
          {indoorCandidates.map((cand: ActionCandidate) => (
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

export default IndoorScreen;
