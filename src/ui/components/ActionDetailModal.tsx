import React from 'react';
import { type ActionCandidate } from '../../domain/types';
import { Sheet } from './Sheet';

interface ActionDetailModalProps {
  candidate: ActionCandidate | null;
  onClose: () => void;
}

function formatAxisDirection(dir: string, axis: 'Exposure' | 'Emissions'): string {
  if (dir === 'reduces') return `Reduces ${axis} ↓`;
  if (dir === 'neutral') return 'Neutral —';
  return 'Conditional';
}

const DualAxisImpactSection: React.FC<{
  impact: ActionCandidate['impact'];
}> = ({ impact }) => (
  <section aria-label="Dual-Axis Impact Breakdown" className="mb-4">
    <h3 className="modal-section-subtitle mb-2">Dual-axis impact</h3>

    <div className="dual-axis-grid">
      <div className="axis-card-exposure">
        <div className="axis-card-title text-exposure">Exposure axis</div>
        <div className="axis-card-value">
          {formatAxisDirection(impact.exposure.direction, 'Exposure')}
        </div>
        <div className="axis-card-label">
          Label: <strong>{impact.exposure.label}</strong> ({impact.exposure.confidence}{' '}
          confidence)
        </div>
        <p className="axis-card-note">{impact.exposure.note}</p>
      </div>

      <div className="axis-card-emissions">
        <div className="axis-card-title text-emissions">Emissions axis</div>
        <div className="axis-card-value">
          {formatAxisDirection(impact.emissions.direction, 'Emissions')}
        </div>
        <div className="axis-card-label">
          Label: <strong>{impact.emissions.label}</strong> ({impact.emissions.confidence}{' '}
          confidence)
        </div>
        {impact.emissions.value && (
          <div className="axis-card-sub text-emissions">
            ≈ {impact.emissions.value.vkm} vkm avoided/wk
          </div>
        )}
        <p className="axis-card-note">{impact.emissions.note}</p>
      </div>
    </div>
  </section>
);

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const { action, impact, fixedDisclaimers } = candidate;

  return (
    <Sheet
      isOpen={Boolean(candidate)}
      onClose={onClose}
      titleId="modal-action-title"
      title={action.title}
      subtitle={`Category: ${action.category.charAt(0).toUpperCase() + action.category.slice(1)}`}
    >
      <div className="action-detail-body">
        {fixedDisclaimers && fixedDisclaimers.length > 0 && (
          <div className="banner banner-warning mb-4">
            <div>
              {fixedDisclaimers.map((caveat, idx) => (
                <p key={idx} className="disclaimer-text">
                  {caveat}
                </p>
              ))}
            </div>
          </div>
        )}

        <DualAxisImpactSection impact={impact} />

        <section aria-label="What This Action Does Not Change" className="mb-4">
          <h3 className="modal-section-subtitle mb-1">What this does not change</h3>
          <div className="card-subtle text-sm">
            <p className="text-muted">{impact.doesNotChange}</p>
          </div>
        </section>

        {impact.assumptions && impact.assumptions.length > 0 && (
          <section aria-label="Assumptions" className="mb-4">
            <h3 className="modal-section-subtitle mb-1">Assumptions</h3>
            <ul className="modal-assumptions-list text-sm text-muted">
              {impact.assumptions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Sheet>
  );
};
