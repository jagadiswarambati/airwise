import React from 'react';
import { ActionCandidate } from '../../domain/types';
import { Sheet } from './Sheet';

interface ActionDetailModalProps {
  candidate: ActionCandidate | null;
  onClose: () => void;
}

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const { action, impact, fixedDisclaimers } = candidate;

  return (
    <Sheet
      isOpen={Boolean(candidate)}
      onClose={onClose}
      titleId="modal-action-title"
      title={action.title}
      subtitle={`Category: ${action.category.toUpperCase()}`}
    >
      <div className="action-detail-body">
        {/* Disclaimers & Safety Caveats */}
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

        {/* Dual-Axis Impact Breakdown */}
        <section aria-label="Dual-Axis Impact Breakdown" className="mb-4">
          <h3 className="modal-section-subtitle mb-2">DUAL-AXIS IMPACT</h3>

          <div className="dual-axis-grid">
            {/* Exposure Axis */}
            <div className="axis-card-exposure">
              <div className="axis-card-title text-exposure">EXPOSURE AXIS</div>
              <div className="axis-card-value">
                {impact.exposure.direction === 'reduces'
                  ? 'Reduces Exposure ↓'
                  : impact.exposure.direction === 'neutral'
                    ? 'Neutral —'
                    : 'Conditional'}
              </div>
              <div className="axis-card-label">
                Label: <strong>{impact.exposure.label}</strong> ({impact.exposure.confidence}{' '}
                confidence)
              </div>
              <p className="axis-card-note">{impact.exposure.note}</p>
            </div>

            {/* Emissions Axis */}
            <div className="axis-card-emissions">
              <div className="axis-card-title text-emissions">EMISSIONS AXIS</div>
              <div className="axis-card-value">
                {impact.emissions.direction === 'reduces'
                  ? 'Reduces Emissions ↓'
                  : impact.emissions.direction === 'neutral'
                    ? 'Neutral —'
                    : 'Conditional'}
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

        {/* Action Boundaries: What This Action Does NOT Change */}
        <section aria-label="What This Action Does Not Change" className="mb-4">
          <h3 className="modal-section-subtitle mb-1">WHAT THIS DOES NOT CHANGE</h3>
          <div className="card-subtle text-sm">
            <p className="text-muted">{impact.doesNotChange}</p>
          </div>
        </section>

        {/* Assumptions */}
        {impact.assumptions && impact.assumptions.length > 0 && (
          <section aria-label="Assumptions" className="mb-4">
            <h3 className="modal-section-subtitle mb-1">ASSUMPTIONS</h3>
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
