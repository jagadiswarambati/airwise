import React, { useState } from 'react';
import { HouseholdProfile, AirSnapshot, ActionCandidate } from '../../domain/types';
import { calculateAvoidedVkm } from '../../domain/impact';
import {
  calculateCommunityAggregateVkm,
  GREEN_MEADOWS_SOCIETY,
  SEEDED_CARPOOL_HOUSEHOLDS,
} from '../../data/community';
import {
  DEFAULT_CARPOOL_DAYS,
  DEFAULT_REMOTE_DAYS,
  DEFAULT_CARPOOL_OCCUPANCY,
} from '../../domain/config/thresholds';
import {
  FORMULA_E1_TITLE,
  FORMULA_E1_SUMMARY,
  FORMULA_E1_EQUATIONS,
  FORMULA_X1_TITLE,
  FORMULA_X1_SUMMARY,
  FORMULA_X1_EQUATION,
  FORMULA_C1_TITLE,
  FORMULA_C1_SUMMARY,
  FORMULA_C1_EQUATION,
} from '../../domain/config/impact-copy';
import { useDailyPlan } from '../hooks/useDailyPlan';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { Icon } from '../icons';

interface ImpactScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

export const ImpactScreen: React.FC<ImpactScreenProps> = ({ profile, snapshot }) => {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const { policyResult } = useDailyPlan(profile, snapshot, targetRegion, true);
  const approvedCandidates = policyResult?.approvedCandidates || [];

  const filteredCandidates =
    categoryFilter === 'all'
      ? approvedCandidates
      : approvedCandidates.filter((c: ActionCandidate) => c.action.category === categoryFilter);

  // Weekly defensible vehicle-km savings for household (Formula E1 for MO-03 & MO-05 only per §5)
  const carpoolVkm = calculateAvoidedVkm('MO-03', profile);
  const remoteVkm = calculateAvoidedVkm('MO-05', profile);

  const weeklyVkmBreakdown = [
    {
      id: 'MO-03',
      title: `Carpooling ${DEFAULT_CARPOOL_DAYS} days/week`,
      vkm: carpoolVkm,
      note: `Default ${DEFAULT_CARPOOL_OCCUPANCY}-person occupancy`,
    },
    {
      id: 'MO-05',
      title: `Remote work ${DEFAULT_REMOTE_DAYS} day/week`,
      vkm: remoteVkm,
      note: 'Eliminates 1 round trip commute',
    },
  ].filter((item) => item.vkm !== undefined && item.vkm > 0);

  const totalWeeklyVkm = weeklyVkmBreakdown.reduce((sum, item) => sum + (item.vkm || 0), 0);
  const roundedWeeklyVkm = Math.round(totalWeeklyVkm * 10) / 10;

  // Community aggregate avoided vkm (Formula C1)
  const communityAggregateVkm = calculateCommunityAggregateVkm(profile);

  return (
    <div className="impact-screen screen-container">
      <PageHeader
        title="Dual-Axis Impact Overview"
        description={ROUTE_DESCRIPTIONS.impact}
      />

      {/* Dual-Axis Philosophy Banner */}
      <section
        className="card card-callout-primary"
        aria-labelledby="dual-axis-title"
      >
        <h2 id="dual-axis-title" className="screen-section-title">
          <Icon name="chart" size={22} aria-hidden="true" />
          <span>Honest Dual-Axis Impact</span>
        </h2>
        <p className="dual-axis-desc">
          AirWise tracks <strong>Exposure</strong> and <strong>Emissions</strong> on separate axes.
          Protecting yourself from dirty air does not clean the outdoors, and lowering vehicle emissions does not
          instantly lower ambient pollution outside your window.
        </p>

        <div className="dual-axis-overview-grid">
          <div className="box-highlight-exposure">
            <strong className="text-exposure block mb-1">
              <Icon name="protect" size={16} aria-hidden="true" /> Exposure Axis
            </strong>
            <span className="text-main text-xs">
              What you and your family inhale. Focuses on filtration, scheduling, and indoor sanctuaries.
            </span>
          </div>

          <div className="box-highlight-emissions">
            <strong className="text-emissions block mb-1">
              <Icon name="emissions" size={16} aria-hidden="true" /> Emissions Axis
            </strong>
            <span className="text-main text-xs">
              What your household emits. Focuses on vehicle trips avoided, carpooling, and anti-idling.
            </span>
          </div>
        </div>
      </section>

      {/* Weekly Defensible Household Tally */}
      <section className="card" aria-labelledby="weekly-tally-heading">
        <h2 id="weekly-tally-heading" className="section-heading mb-1">
          <Icon name="chart" size={20} aria-hidden="true" />
          <span>Weekly Household Defensible Tally</span>
        </h2>
        <p className="tally-subtitle">
          Derived strictly from your profile travel parameters ({profile.travel.oneWayKm} km one-way, {profile.travel.tripsPerWeek} trips/week) using Formula E1.
        </p>

        {roundedWeeklyVkm > 0 ? (
          <div>
            <div className="tally-reading-box">
              <span className="tally-value-number">
                ~{roundedWeeklyVkm}
              </span>
              <span className="tally-value-unit">
                vehicle-km avoided / week (Estimated)
              </span>
            </div>

            <div className="tally-breakdown-stack">
              {weeklyVkmBreakdown.map((item) => (
                <div
                  key={item.id}
                  className="tally-breakdown-row"
                >
                  <div>
                    <strong>{item.title}</strong>
                    <div className="text-xs text-muted">{item.note}</div>
                  </div>
                  <span className="tally-row-vkm">~{item.vkm} vkm</span>
                </div>
              ))}
            </div>

            <div className="assumptions-box">
              <strong>Documented Assumptions:</strong> Assumes round-trip distance of 2 × {profile.travel.oneWayKm} km; {DEFAULT_CARPOOL_OCCUPANCY}-person carpool occupancy saves {Math.round((1 - 1 / DEFAULT_CARPOOL_OCCUPANCY) * 100)}% vehicle distance on shared days ({DEFAULT_CARPOOL_DAYS} days/week); remote work eliminates {DEFAULT_REMOTE_DAYS} full round trip. Qualitative actions (combining errands, anti-idling, walking) do not add numeric estimates.
            </div>
          </div>
        ) : (
          <div className="box-subtle">
            <strong>0 vehicle-km recorded:</strong> Profile commute distance is 0 km or no motorized vehicle commute indicated. Vehicle-km reductions are only estimated where commuting distances and vehicle trips are explicitly documented in your household profile.
          </div>
        )}
      </section>

      {/* Community Aggregate Estimate Card (Formula C1) */}
      <section className="card" aria-labelledby="community-aggregate-heading">
        <div className="section-title-row mb-2">
          <h2 id="community-aggregate-heading" className="section-heading flex-row-center gap-1">
            <Icon name="people" size={20} aria-hidden="true" />
            <span>Community Aggregate Impact</span>
          </h2>
          <span className="aw-badge aw-badge-data-type">
            Demo data
          </span>
        </div>

        <p className="community-aggregate-desc">
          Collective emissions avoided across {GREEN_MEADOWS_SOCIETY.name} ({GREEN_MEADOWS_SOCIETY.totalHomes} homes) combining baseline resident pledges with your household contribution.
        </p>

        <div className="community-tally-box">
          <span className="community-tally-num">
            ~{communityAggregateVkm}
          </span>
          <span className="community-tally-label">
            community vehicle-km avoided / week (Estimated)
          </span>
        </div>

        <div className="text-xs text-muted">
          Formula C1: Combines {GREEN_MEADOWS_SOCIETY.seededWeeklyAvoidedVkm} vkm baseline ({SEEDED_CARPOOL_HOUSEHOLDS} carpooling homes) + {roundedWeeklyVkm} vkm household contribution.
        </div>
      </section>

      {/* Transparent Formulas Card */}
      <section className="card" aria-labelledby="formulas-heading">
        <h2 id="formulas-heading" className="section-heading mb-2 flex-row-center gap-1">
          <Icon name="info" size={20} aria-hidden="true" />
          <span>Transparent Formulas &amp; Methodology</span>
        </h2>
        <div className="formulas-stack">
          <div>
            <strong className="text-accent">{FORMULA_E1_TITLE}</strong>
            <p className="formula-desc">
              {FORMULA_E1_SUMMARY}<br />
              • <em>{FORMULA_E1_EQUATIONS[0]}</em><br />
              • <em>{FORMULA_E1_EQUATIONS[1]}</em>
            </p>
          </div>

          <div>
            <strong className="text-accent">{FORMULA_X1_TITLE}</strong>
            <p className="formula-desc">
              {FORMULA_X1_SUMMARY}<br />
              • <em>{FORMULA_X1_EQUATION}</em>
            </p>
          </div>

          <div>
            <strong className="text-accent">{FORMULA_C1_TITLE}</strong>
            <p className="formula-desc">
              {FORMULA_C1_SUMMARY}<br />
              • <em>{FORMULA_C1_EQUATION}</em>
            </p>
          </div>
        </div>
      </section>

      {/* Per-Action Dual-Axis Impact Catalog */}
      <section aria-labelledby="action-cards-heading">
        <div className="section-title-row mb-3">
          <h2 id="action-cards-heading" className="section-heading flex-row-center gap-1">
            <Icon name="copy" size={20} aria-hidden="true" />
            <span>Per-Action Dual-Axis Verification</span>
          </h2>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter actions by category"
            className="category-filter-select"
          >
            <option value="all">All Categories ({approvedCandidates.length})</option>
            <option value="indoor">Indoor</option>
            <option value="personal">Personal</option>
            <option value="mobility">Mobility</option>
            <option value="community">Community</option>
          </select>
        </div>

        <div className="actions-stack">
          {filteredCandidates.map((cand: ActionCandidate) => {
            const exp = cand.impact.exposure;
            const em = cand.impact.emissions;

            return (
              <div
                key={cand.action.id}
                className="card catalog-action-card"
                onClick={() => setSelectedAction(cand)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedAction(cand)}
                tabIndex={0}
                role="button"
                aria-label={`View full details for ${cand.action.title}`}
              >
                {/* Header */}
                <div className="catalog-header-row">
                  <div>
                    <span className="catalog-action-id">
                      {cand.action.id} · {cand.action.category}
                    </span>
                    <h3 className="catalog-action-title">
                      {cand.action.title}
                    </h3>
                  </div>

                  <span className="catalog-cost-badge">
                    {cand.tags.cost} · {cand.tags.effort}
                  </span>
                </div>

                {/* Dual-Axis Cards Grid */}
                <div className="dual-axis-grid mt-1">
                  {/* Exposure Axis */}
                  <div className="axis-card-exposure">
                    <div className="flex-between mb-1">
                      <strong className="text-exposure">Exposure</strong>
                      <span className="tag-exposure-pill">
                        {exp.label}
                      </span>
                    </div>
                    <div className="catalog-axis-direction">
                      {exp.direction === 'reduces' && 'Reduces exposure ↓'}
                      {exp.direction === 'neutral' && 'Neutral exposure —'}
                      {exp.direction === 'conditional' && 'Conditional'}
                    </div>
                    {exp.magnitude && (
                      <div className="catalog-magnitude text-exposure">
                        {exp.magnitude}
                      </div>
                    )}
                    <div className="catalog-axis-note">
                      {exp.note}
                    </div>
                  </div>

                  {/* Emissions Axis */}
                  <div className="axis-card-emissions">
                    <div className="flex-between mb-1">
                      <strong className="text-emissions">Emissions</strong>
                      <span className="tag-emissions-pill">
                        {em.label}
                      </span>
                    </div>
                    <div className="catalog-axis-direction">
                      {em.direction === 'reduces' && 'Reduces emissions ↓'}
                      {em.direction === 'neutral' && 'Neutral emissions —'}
                      {em.direction === 'conditional' && 'Conditional'}
                    </div>
                    {em.value && (
                      <div className="catalog-magnitude text-emissions">
                        ~{em.value.vkm} vkm avoided
                      </div>
                    )}
                    <div className="catalog-axis-note">
                      {em.note}
                    </div>
                  </div>
                </div>

                {/* Honest Boundary Disclosure */}
                <div className="catalog-boundary-box">
                  <strong>Boundary:</strong> {cand.impact.doesNotChange}
                </div>

                {/* Documented Assumptions */}
                <div className="catalog-assumptions-text">
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

export default ImpactScreen;
