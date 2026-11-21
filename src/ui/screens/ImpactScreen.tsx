import React, { useState } from 'react';
import { HouseholdProfile, AirSnapshot, ActionCandidate } from '../../domain/types';
import { computeBaseLevel, computeEffectiveLevel } from '../../domain/levels';
import { deriveTimeSlots } from '../../domain/radar';
import { evaluatePolicy } from '../../domain/policy';
import { calculateAvoidedVkm } from '../../domain/impact';
import { calculateCommunityAggregateVkm, GREEN_MEADOWS_SOCIETY } from '../../data/community';
import { ActionDetailModal } from '../components/ActionDetailModal';

interface ImpactScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export const ImpactScreen: React.FC<ImpactScreenProps> = ({ profile, snapshot }) => {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const baseLevel = computeBaseLevel(snapshot.pm25.now, targetRegion);
  const effectiveLevel = computeEffectiveLevel(baseLevel, profile.members);
  const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, targetRegion);

  // Evaluate policy with community mode enabled so all applicable actions are represented
  const policyResult = evaluatePolicy(profile, snapshot, slots, true, targetRegion);
  const approvedCandidates = policyResult.approvedCandidates;

  const filteredCandidates =
    categoryFilter === 'all'
      ? approvedCandidates
      : approvedCandidates.filter((c) => c.action.category === categoryFilter);

  // Weekly defensible vehicle-km savings for household
  const carpoolVkm = calculateAvoidedVkm('MO-03', profile);
  const errandsVkm = calculateAvoidedVkm('MO-04', profile);
  const remoteVkm = calculateAvoidedVkm('MO-05', profile);
  const walkingVkm = effectiveLevel <= 1 ? calculateAvoidedVkm('MO-07', profile) : undefined;

  const weeklyVkmBreakdown = [
    { id: 'MO-03', title: 'Carpooling 2 days/week', vkm: carpoolVkm, note: 'Default 2-person occupancy' },
    { id: 'MO-04', title: 'Combining errands', vkm: errandsVkm, note: 'Saves 1 short round trip' },
    { id: 'MO-05', title: 'Remote work 1 day/week', vkm: remoteVkm, note: 'Eliminates 1 round trip commute' },
    { id: 'MO-07', title: 'Walking short trips', vkm: walkingVkm, note: 'Replaces ~2 km weekly short trip (clean days only)' },
  ].filter((item) => item.vkm !== undefined && item.vkm > 0);

  const totalWeeklyVkm = weeklyVkmBreakdown.reduce((sum, item) => sum + (item.vkm || 0), 0);
  const roundedWeeklyVkm = Math.round(totalWeeklyVkm * 10) / 10;

  // Community aggregate avoided vkm (Formula C1)
  const communityAggregateVkm = calculateCommunityAggregateVkm(profile);

  return (
    <div className="impact-screen" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Dual-Axis Philosophy Banner */}
      <section
        className="card"
        aria-labelledby="dual-axis-title"
        style={{ borderLeft: '4px solid var(--color-primary)' }}
      >
        <h2 id="dual-axis-title" style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.25rem' }}>
          ⚖️ Honest Dual-Axis Impact
        </h2>
        <p style={{ margin: '0 0 var(--space-3) 0', fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          AirWise tracks <strong>Exposure</strong> and <strong>Emissions</strong> on separate axes.
          Protecting yourself from dirty air does not clean the outdoors, and lowering vehicle emissions does not
          instantly lower ambient pollution outside your window.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: '#e8f0fe',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #c2e7ff',
            }}
          >
            <strong style={{ color: '#1a73e8', display: 'block', marginBottom: '4px' }}>🛡️ Exposure Axis</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
              What you and your family inhale. Focuses on filtration, scheduling, and indoor sanctuaries.
            </span>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: '#e6f4ea',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #ceead6',
            }}
          >
            <strong style={{ color: '#137333', display: 'block', marginBottom: '4px' }}>🌱 Emissions Axis</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
              What your household emits. Focuses on vehicle trips avoided, carpooling, and anti-idling.
            </span>
          </div>
        </div>
      </section>

      {/* Weekly Defensible Household Tally */}
      <section className="card" aria-labelledby="weekly-tally-heading">
        <h2 id="weekly-tally-heading" style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.15rem' }}>
          📊 Weekly Household Defensible Tally
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>
          Derived strictly from your profile travel parameters ({profile.travel.oneWayKm} km one-way, {profile.travel.tripsPerWeek} trips/week) using Formula E1.
        </p>

        {roundedWeeklyVkm > 0 ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: 'var(--space-3)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#137333' }}>
                ~{roundedWeeklyVkm}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                vehicle-km avoided / week (Estimated)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-3)' }}>
              {weeklyVkmBreakdown.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.note}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#137333' }}>~{item.vkm} vkm</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              <strong>Documented Assumptions:</strong> Assumes round-trip distance of 2 × {profile.travel.oneWayKm} km; 2-person carpool occupancy saves 50% vehicle distance on shared days; remote work eliminates 1 full round trip.
            </div>
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
            <strong>0 vehicle-km recorded:</strong> Profile commute distance is 0 km or no motorized vehicle commute indicated. Vehicle-km reductions are only estimated where commuting distances and vehicle trips are explicitly documented in your household profile.
          </div>
        )}
      </section>

      {/* Community Aggregate Estimate Card (Formula C1) */}
      <section className="card" aria-labelledby="community-aggregate-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 id="community-aggregate-heading" style={{ margin: 0, fontSize: '1.15rem' }}>
            👥 Community Aggregate Impact
          </h2>
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: '#f1f3f4',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            Demo data
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>
          Collective emissions avoided across {GREEN_MEADOWS_SOCIETY.name} ({GREEN_MEADOWS_SOCIETY.totalHomes} homes) combining baseline resident pledges with your household contribution.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            padding: 'var(--space-3)',
            backgroundColor: '#e6f4ea',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #ceead6',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#137333' }}>
            ~{communityAggregateVkm}
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#137333' }}>
            community vehicle-km avoided / week (Estimated)
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          Formula C1: Combines {GREEN_MEADOWS_SOCIETY.seededWeeklyAvoidedVkm} vkm baseline (18 carpooling homes) + {roundedWeeklyVkm} vkm household contribution.
        </div>
      </section>

      {/* Transparent Formulas Card */}
      <section className="card" aria-labelledby="formulas-heading">
        <h2 id="formulas-heading" style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.15rem' }}>
          📐 Transparent Formulas &amp; Methodology
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '0.85rem' }}>
          <div>
            <strong style={{ color: 'var(--color-primary)' }}>Formula E1 — Avoided Vehicle-Kilometers (vkm):</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
              • <em>Carpooling (MO-03, CM-02):</em> vkm = oneWayKm × 2 × sharedTrips × (1 - 1 / occupancy). Default occupancy = 2.<br />
              • <em>Remote Work (MO-05):</em> vkm = oneWayKm × 2 × 1 round trip eliminated.<br />
              • <em>Combining Errands (MO-04):</em> vkm = min(oneWayKm × 2, 10 km).<br />
              • <em>Walking Short Trips (MO-07):</em> vkm = 2.0 km/week on Clear/Watch days only.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--color-primary)' }}>Formula X1 — Commute Exposure Delta:</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
              Δ exposure = peakDepartureHourMean - shiftedDepartureHourMean (µg/m³ PM2.5). Requires ≥ 5 µg/m³ reduction and ≥ 15% delta to recommend.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--color-primary)' }}>Formula C1 — Community Aggregate Vehicle-Kilometers:</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
              C1 = SeededSocietyBaseline + Σ HouseholdAvoidedVkm across active participating residents.
            </p>
          </div>
        </div>
      </section>

      {/* Per-Action Dual-Axis Impact Catalog */}
      <section aria-labelledby="action-cards-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h2 id="action-cards-heading" style={{ margin: 0, fontSize: '1.15rem' }}>
            📋 Per-Action Dual-Axis Verification
          </h2>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter actions by category"
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          >
            <option value="all">All Categories ({approvedCandidates.length})</option>
            <option value="indoor">Indoor</option>
            <option value="personal">Personal</option>
            <option value="mobility">Mobility</option>
            <option value="community">Community</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filteredCandidates.map((cand) => {
            const exp = cand.impact.exposure;
            const em = cand.impact.emissions;

            return (
              <div
                key={cand.action.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
                onClick={() => setSelectedAction(cand)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedAction(cand)}
                tabIndex={0}
                role="button"
                aria-label={`View full details for ${cand.action.title}`}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                      {cand.action.id} · {cand.action.category}
                    </span>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 700 }}>
                      {cand.action.title}
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {cand.tags.cost} · {cand.tags.effort}
                  </span>
                </div>

                {/* Dual-Axis Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  {/* Exposure Axis */}
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#e8f0fe',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #c2e7ff',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#1a73e8' }}>Exposure</strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff',
                          color: '#1a73e8',
                        }}
                      >
                        {exp.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                      {exp.direction === 'reduces' && '⬇️ Reduces exposure'}
                      {exp.direction === 'neutral' && '↔️ Neutral exposure'}
                      {exp.direction === 'conditional' && '⚖️ Conditional'}
                    </div>
                    {exp.magnitude && (
                      <div style={{ fontWeight: 700, color: '#1a73e8', marginBottom: '2px' }}>
                        {exp.magnitude}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                      {exp.note}
                    </div>
                  </div>

                  {/* Emissions Axis */}
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#e6f4ea',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #ceead6',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#137333' }}>Emissions</strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff',
                          color: '#137333',
                        }}
                      >
                        {em.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                      {em.direction === 'reduces' && '⬇️ Reduces emissions'}
                      {em.direction === 'neutral' && '↔️ Neutral emissions'}
                      {em.direction === 'conditional' && '⚖️ Conditional'}
                    </div>
                    {em.value && (
                      <div style={{ fontWeight: 700, color: '#137333', marginBottom: '2px' }}>
                        ~{em.value.vkm} vkm avoided
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                      {em.note}
                    </div>
                  </div>
                </div>

                {/* Honest Boundary Disclosure */}
                <div
                  style={{
                    padding: '6px 8px',
                    backgroundColor: '#fff7ed',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #fed7aa',
                    fontSize: '0.75rem',
                    color: '#9a3412',
                    lineHeight: 1.3,
                  }}
                >
                  <strong>Boundary:</strong> {cand.impact.doesNotChange}
                </div>

                {/* Documented Assumptions */}
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <strong>Assumptions:</strong> {cand.impact.assumptions.join('; ')}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Detail Modal Sheet */}
      {selectedAction && (
        <ActionDetailModal
          candidate={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
};
