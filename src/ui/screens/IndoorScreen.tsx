import { useState } from 'react';
import { HouseholdProfile, AirSnapshot, ActionCandidate } from '../../domain/types';
import { decideVentilation } from '../../domain/ventilation';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionCard } from '../components/ActionCard';
import { ActionDetailModal } from '../components/ActionDetailModal';

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

  return (
    <div className="indoor-screen" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Smart Ventilation Advisor */}
      <section className="card" aria-labelledby="vent-heading" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <h2 id="vent-heading" style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.25rem' }}>
          💨 Smart Ventilation Advisor
        </h2>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '1rem',
            backgroundColor:
              ventResult.verdict === 'open'
                ? '#e6f4ea'
                : ventResult.verdict === 'brief'
                ? '#e8f0fe'
                : '#fce8e6',
            color:
              ventResult.verdict === 'open'
                ? '#137333'
                : ventResult.verdict === 'brief'
                ? '#1a73e8'
                : '#c5221f',
            marginBottom: 'var(--space-3)',
          }}
        >
          <span>
            {ventResult.verdict === 'open' && '✅ Ventilate freely (Air is clean)'}
            {ventResult.verdict === 'brief' && '⏱️ Brief ventilation window'}
            {ventResult.verdict === 'closed' && '🚫 Keep windows closed'}
          </span>
        </div>

        <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
          {ventResult.explanation}
        </p>

        {ventResult.atHour !== undefined && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            <strong>Recommended window: </strong>
            Around {ventResult.atHour}:00
          </div>
        )}

        {/* P-22 Combustion Safety Warning */}
        {isCombustionRisk && (
          <div
            role="alert"
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-3)',
              backgroundColor: '#fff0f0',
              border: '1px solid #e00',
              borderRadius: 'var(--radius-sm)',
              color: '#900',
              fontSize: '0.85rem',
              lineHeight: 1.4,
            }}
          >
            <strong>⚠️ Carbon Monoxide Safety (Rule P-22):</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Your home uses unvented combustion heating or biomass cooking without an exhaust chimney. Never seal air gaps or
              keep the space 100% airtight. Ensure adequate fresh airflow to prevent lethal carbon monoxide accumulation.
            </p>
          </div>
        )}
      </section>

      {/* Cleaner Room Sanctuary */}
      <section className="card" aria-labelledby="cleaner-room-heading">
        <h2 id="cleaner-room-heading" style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.25rem' }}>
          🛡️ Cleaner-Room Sanctuary
        </h2>
        <p style={{ margin: '0 0 var(--space-3) 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Even without whole-home filtration, creating one designated cleaner room drastically cuts 8–10 hours of overnight exposure for
          vulnerable family members.
        </p>
        <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.9rem', lineHeight: 1.5 }}>
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
        <h2 id="indoor-actions-heading" style={{ margin: '0 0 var(--space-3) 0', fontSize: '1.15rem' }}>
          Household Indoor Recommendations
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
