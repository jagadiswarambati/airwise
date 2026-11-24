import React, { useState } from 'react';
import { type HouseholdProfile, type AirSnapshot, type ActionCandidate } from '../../domain/types';
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
import { ActionRow } from '../components/ActionRow';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { AxisPair } from '../components/AxisPair';
import { Stat } from '../components/Stat';
import { Chip } from '../primitives/Chip';
import { Disclosure } from '../primitives/Disclosure';
import { PageHeader } from '../shell/PageHeader';
import { ROUTE_DESCRIPTIONS } from '../../state/route';
import { Icon } from '../icons';

interface ImpactScreenProps {
  profile: HouseholdProfile;
  snapshot: AirSnapshot;
}

const CATEGORY_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'indoor', label: 'At home' },
  { key: 'personal', label: 'Personal' },
  { key: 'mobility', label: 'Travel' },
  { key: 'community', label: 'Community' },
];

export const ImpactScreen: React.FC<ImpactScreenProps> = ({ profile, snapshot }) => {
  const [selectedAction, setSelectedAction] = useState<ActionCandidate | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
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

  const toggleExpand = (id: string) => {
    setExpandedActionId(expandedActionId === id ? null : id);
  };

  return (
    <div className="impact-screen screen-container">
      <PageHeader title="Dual-Axis Impact Overview" description={ROUTE_DESCRIPTIONS.impact} />

      {/* Dual-Axis Overview Banner */}
      <section className="card card-callout-primary mb-4" aria-labelledby="dual-axis-title">
        <h2 id="dual-axis-title" className="screen-section-title">
          <Icon name="chart" size={22} aria-hidden="true" />
          <span>Dual-Axis Impact</span>
        </h2>
        <p className="dual-axis-desc mb-3">
          AirWise tracks <strong>Exposure</strong> and <strong>Emissions</strong> on separate axes.
          Protecting yourself from dirty air does not clean the outdoors, and lowering vehicle
          emissions does not instantly lower ambient pollution outside your window.
        </p>

        <div className="dual-axis-overview-grid">
          <div className="box-highlight-exposure">
            <strong className="text-exposure block mb-1">
              <Icon name="protect" size={16} aria-hidden="true" /> Exposure Axis
            </strong>
            <span className="text-main text-xs">
              What you and your family inhale. Focuses on filtration, scheduling, and indoor
              sanctuaries.
            </span>
          </div>

          <div className="box-highlight-emissions">
            <strong className="text-emissions block mb-1">
              <Icon name="emissions" size={16} aria-hidden="true" /> Emissions Axis
            </strong>
            <span className="text-main text-xs">
              What your household emits. Focuses on vehicle trips avoided, carpooling, and
              anti-idling.
            </span>
          </div>
        </div>
      </section>

      <div className="aw-screen-layout-grid">
        {/* Left Column on Desktop / Main Flow */}
        <div className="aw-screen-layout-main">
          {/* Mobile Top Stat (< 1100px) */}
          <section
            className="card mb-4 aw-mobile-only"
            aria-labelledby="mobile-tally-heading"
          >
            <h2 id="mobile-tally-heading" className="section-heading mb-2">
              Weekly Household Defensible Tally
            </h2>
            <Stat
              value={roundedWeeklyVkm > 0 ? `~${roundedWeeklyVkm}` : '0'}
              unit="vehicle-km avoided / week (Estimated)"
              label={`About ${roundedWeeklyVkm} vehicle-km avoided per week (Estimated)`}
            />
            <Disclosure title="Show how this is calculated" className="mt-3">
              <div className="text-xs text-muted">
                <p className="font-semibold mb-1">{FORMULA_E1_TITLE}</p>
                <p className="mb-2">{FORMULA_E1_SUMMARY}</p>
                <p>• {FORMULA_E1_EQUATIONS[0]}</p>
                <p>• {FORMULA_E1_EQUATIONS[1]}</p>
                <div className="mt-2">
                  <strong>Documented Assumptions:</strong> Assumes round-trip distance of 2 ×{' '}
                  {profile.travel.oneWayKm} km; {DEFAULT_CARPOOL_OCCUPANCY}-person carpool saves{' '}
                  {Math.round((1 - 1 / DEFAULT_CARPOOL_OCCUPANCY) * 100)}% on shared days (
                  {DEFAULT_CARPOOL_DAYS} days/week); remote work eliminates {DEFAULT_REMOTE_DAYS}{' '}
                  round trip.
                </div>
              </div>
            </Disclosure>
          </section>

          {/* What Each Action Changes Catalog */}
          <section aria-labelledby="action-cards-heading" className="card mb-4">
            <div className="section-title-row mb-3">
              <h2 id="action-cards-heading" className="section-heading flex-row-center gap-1">
                <Icon name="copy" size={20} aria-hidden="true" />
                <span>What each action changes</span>
              </h2>
            </div>

            {/* Chip Filters with aria-pressed */}
            <div
              className="aw-filter-chips-container flex-wrap gap-2 mb-3"
              role="group"
              aria-label="Filter actions by category"
            >
              {CATEGORY_CHIPS.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  selected={categoryFilter === chip.key}
                  onClick={() => setCategoryFilter(chip.key)}
                />
              ))}
            </div>

            {/* Action Row Stack with Expansion to AxisPair */}
            <div className="actions-stack">
              {filteredCandidates.map((cand: ActionCandidate) => {
                const isExpanded = expandedActionId === cand.action.id;

                const expandedContent = (
                  <div className="aw-expanded-impact-box">
                    <AxisPair
                      exposure={{
                        direction: cand.impact.exposure.direction,
                        label: cand.impact.exposure.label,
                        confidence: cand.impact.exposure.confidence,
                        note: cand.impact.exposure.note,
                        magnitude: cand.impact.exposure.magnitude,
                      }}
                      emissions={{
                        direction: cand.impact.emissions.direction,
                        label: cand.impact.emissions.label,
                        confidence: cand.impact.emissions.confidence,
                        note: cand.impact.emissions.note,
                        value: cand.impact.emissions.value,
                      }}
                    />

                    <div className="catalog-boundary-box mt-3">
                      <strong>Does not change: </strong>
                      <span>{cand.impact.doesNotChange}</span>
                    </div>

                    {cand.impact.assumptions && cand.impact.assumptions.length > 0 && (
                      <div className="catalog-assumptions-text mt-2 text-xs text-muted">
                        <strong>Assumptions: </strong>
                        <span>{cand.impact.assumptions.join('; ')}</span>
                      </div>
                    )}

                    <div className="mt-3 flex-end">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => setSelectedAction(cand)}
                      >
                        View complete action guidance
                      </button>
                    </div>
                  </div>
                );

                return (
                  <ActionRow
                    key={cand.action.id}
                    candidate={cand}
                    showEffort
                    showAxisSummary
                    expandable
                    expanded={isExpanded}
                    onToggleExpand={() => toggleExpand(cand.action.id)}
                    expandedContent={expandedContent}
                  />
                );
              })}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="box-subtle">
                <p className="text-muted">No actions match the selected category filter.</p>
              </div>
            )}
          </section>
        </div>

        {/* Sticky Aside at >= 1100px */}
        <aside
          className="aw-screen-layout-aside"
          aria-label="Household tally and calculation formulas"
        >
          <div className="aw-screen-aside-sticky">
            {/* Desktop Weekly Tally Stat Card */}
            <section
              className="card mb-4 aw-desktop-only"
              aria-labelledby="desktop-tally-heading"
            >
              <h2 id="desktop-tally-heading" className="section-heading mb-2">
                Weekly Household Defensible Tally
              </h2>
              <Stat
                value={roundedWeeklyVkm > 0 ? `~${roundedWeeklyVkm}` : '0'}
                unit="vehicle-km avoided / week (Estimated)"
                label={`About ${roundedWeeklyVkm} vehicle-km avoided per week (Estimated)`}
              />

              {roundedWeeklyVkm > 0 ? (
                <div className="tally-breakdown-stack mt-3">
                  {weeklyVkmBreakdown.map((item) => (
                    <div key={item.id} className="tally-breakdown-row">
                      <div>
                        <strong>{item.title}</strong>
                        <div className="text-xs text-muted">{item.note}</div>
                      </div>
                      <span className="tally-row-vkm">~{item.vkm} vkm</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="box-subtle mt-3 text-xs text-muted">
                  <strong>0 vehicle-km recorded:</strong> Profile commute distance is 0 km or no
                  motorized vehicle commute indicated. Vehicle-km reductions are only estimated
                  where commuting distances and vehicle trips are explicitly documented in your
                  household profile.
                </div>
              )}

              <Disclosure title="Show how this is calculated" className="mt-3">
                <div className="text-xs text-muted">
                  <p className="font-semibold mb-1">{FORMULA_E1_TITLE}</p>
                  <p className="mb-2">{FORMULA_E1_SUMMARY}</p>
                  <p>• {FORMULA_E1_EQUATIONS[0]}</p>
                  <p>• {FORMULA_E1_EQUATIONS[1]}</p>
                  <div className="mt-2">
                    <strong>Documented Assumptions:</strong> Assumes round-trip distance of 2 ×{' '}
                    {profile.travel.oneWayKm} km; {DEFAULT_CARPOOL_OCCUPANCY}-person carpool saves{' '}
                    {Math.round((1 - 1 / DEFAULT_CARPOOL_OCCUPANCY) * 100)}% on shared days (
                    {DEFAULT_CARPOOL_DAYS} days/week); remote work eliminates {DEFAULT_REMOTE_DAYS}{' '}
                    full round trip.
                  </div>
                </div>
              </Disclosure>
            </section>

            {/* Community Aggregate Impact Card */}
            <section className="card mb-4" aria-labelledby="community-aggregate-heading">
              <div className="section-title-row mb-2">
                <h3
                  id="community-aggregate-heading"
                  className="section-heading flex-row-center gap-1"
                >
                  <Icon name="people" size={20} aria-hidden="true" />
                  <span>Community Aggregate Impact</span>
                </h3>
                <span className="aw-badge aw-badge-data-type">Demo data</span>
              </div>

              <p className="community-aggregate-desc text-xs text-muted mb-2">
                Collective emissions avoided across {GREEN_MEADOWS_SOCIETY.name} (
                {GREEN_MEADOWS_SOCIETY.totalHomes} homes).
              </p>

              <Stat
                value={`~${communityAggregateVkm}`}
                unit="community vehicle-km avoided / week (Estimated)"
                label="Estimated (Formula C1)"
              />

              <div className="text-xs text-muted mt-2">
                Formula C1: Combines {GREEN_MEADOWS_SOCIETY.seededWeeklyAvoidedVkm} vkm baseline (
                {SEEDED_CARPOOL_HOUSEHOLDS} carpooling homes) + {roundedWeeklyVkm} vkm household
                contribution.
              </div>
            </section>

            {/* How We Calculate This Card (Replaces Formulas & Methodology) */}
            <section className="card" aria-labelledby="formulas-heading">
              <h3 id="formulas-heading" className="section-heading mb-2 flex-row-center gap-1">
                <Icon name="info" size={20} aria-hidden="true" />
                <span>How we calculate this</span>
              </h3>
              <div className="formulas-stack text-xs">
                <div className="mb-2">
                  <strong className="text-accent">{FORMULA_E1_TITLE}</strong>
                  <p className="formula-desc mt-1">
                    {FORMULA_E1_SUMMARY}
                    <br />• <em>{FORMULA_E1_EQUATIONS[0]}</em>
                    <br />• <em>{FORMULA_E1_EQUATIONS[1]}</em>
                  </p>
                </div>

                <div className="mb-2">
                  <strong className="text-accent">{FORMULA_X1_TITLE}</strong>
                  <p className="formula-desc mt-1">
                    {FORMULA_X1_SUMMARY}
                    <br />• <em>{FORMULA_X1_EQUATION}</em>
                  </p>
                </div>

                <div>
                  <strong className="text-accent">{FORMULA_C1_TITLE}</strong>
                  <p className="formula-desc mt-1">
                    {FORMULA_C1_SUMMARY}
                    <br />• <em>{FORMULA_C1_EQUATION}</em>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {/* Action Detail Modal */}
      {selectedAction && (
        <ActionDetailModal candidate={selectedAction} onClose={() => setSelectedAction(null)} />
      )}
    </div>
  );
};

export default ImpactScreen;
