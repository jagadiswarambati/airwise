import { useState } from 'react';
import { type ActionCandidate } from '../../../domain/types';
import { Icon } from '../../icons';
import { Chip } from '../../primitives/Chip';
import { ActionRow } from '../ActionRow';
import { AxisPair } from '../AxisPair';

const CATEGORY_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'indoor', label: 'At home' },
  { key: 'personal', label: 'Personal' },
  { key: 'mobility', label: 'Travel' },
  { key: 'community', label: 'Community' },
];

interface ExpandedImpactProps {
  candidate: ActionCandidate;
  onViewDetails: (cand: ActionCandidate) => void;
}

function ExpandedImpactBox({ candidate, onViewDetails }: ExpandedImpactProps) {
  return (
    <div className="aw-expanded-impact-box">
      <AxisPair
        exposure={{
          direction: candidate.impact.exposure.direction,
          label: candidate.impact.exposure.label,
          confidence: candidate.impact.exposure.confidence,
          note: candidate.impact.exposure.note,
          magnitude: candidate.impact.exposure.magnitude,
        }}
        emissions={{
          direction: candidate.impact.emissions.direction,
          label: candidate.impact.emissions.label,
          confidence: candidate.impact.emissions.confidence,
          note: candidate.impact.emissions.note,
          value: candidate.impact.emissions.value,
        }}
      />

      <div className="catalog-boundary-box mt-3">
        <strong>Does not change: </strong>
        <span>{candidate.impact.doesNotChange}</span>
      </div>

      {candidate.impact.assumptions && candidate.impact.assumptions.length > 0 && (
        <div className="catalog-assumptions-text mt-2 text-xs text-muted">
          <strong>Assumptions: </strong>
          <span>{candidate.impact.assumptions.join('; ')}</span>
        </div>
      )}

      <div className="mt-3 flex-end">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => onViewDetails(candidate)}
        >
          View complete action guidance
        </button>
      </div>
    </div>
  );
}

export interface ImpactActionListProps {
  candidates: ActionCandidate[];
  onSelectAction: (c: ActionCandidate) => void;
}

export function ImpactActionList({ candidates, onSelectAction }: ImpactActionListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const filteredCandidates =
    categoryFilter === 'all'
      ? candidates
      : candidates.filter((c: ActionCandidate) => c.action.category === categoryFilter);

  const toggleExpand = (id: string) => {
    setExpandedActionId(expandedActionId === id ? null : id);
  };

  return (
    <section aria-labelledby="action-cards-heading" className="card mb-4">
      <div className="section-title-row mb-3">
        <h2 id="action-cards-heading" className="section-heading flex-row-center gap-1">
          <Icon name="copy" size={20} aria-hidden="true" />
          <span>What each action changes</span>
        </h2>
      </div>

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

      <div className="actions-stack">
        {filteredCandidates.map((cand: ActionCandidate) => {
          const isExpanded = expandedActionId === cand.action.id;
          return (
            <ActionRow
              key={cand.action.id}
              candidate={cand}
              showEffort
              showAxisSummary
              expandable
              expanded={isExpanded}
              onToggleExpand={() => toggleExpand(cand.action.id)}
              expandedContent={
                <ExpandedImpactBox candidate={cand} onViewDetails={onSelectAction} />
              }
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
  );
}
