import React, { useEffect } from 'react';
import { ActionCandidate } from '../../domain/types';
import { Icon } from '../icons';

interface ActionDetailModalProps {
  candidate: ActionCandidate | null;
  onClose: () => void;
}

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({ candidate, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (candidate) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candidate, onClose]);

  if (!candidate) return null;

  const { action, impact, fixedDisclaimers } = candidate;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-action-title"
      onClick={onClose}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-action-title" className="action-modal-title">
            {action.title}
          </h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close action detail"
          >
            <Icon name="close" size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {/* Disclaimers & Safety Caveats */}
          {fixedDisclaimers && fixedDisclaimers.length > 0 && (
            <div className="banner banner-warning">
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
          <section aria-label="Dual-Axis Impact Breakdown">
            <h3 className="modal-section-subtitle">
              DUAL-AXIS IMPACT
            </h3>

            <div className="dual-axis-grid">
              {/* Exposure Axis */}
              <div className="axis-card-exposure">
                <div className="axis-card-title text-exposure">
                  EXPOSURE AXIS
                </div>
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
                {impact.exposure.magnitude && (
                  <div className="axis-card-sub text-exposure">
                    {impact.exposure.magnitude}
                  </div>
                )}
                <p className="axis-card-note">
                  {impact.exposure.note}
                </p>
              </div>

              {/* Emissions Axis */}
              <div className="axis-card-emissions">
                <div className="axis-card-title text-emissions">
                  EMISSIONS AXIS
                </div>
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
                <p className="axis-card-note">
                  {impact.emissions.note}
                </p>
              </div>
            </div>
          </section>

          {/* What this does NOT change */}
          <section>
            <h4 className="modal-section-heading">
              WHAT IT DOES NOT CHANGE
            </h4>
            <p className="modal-section-text">
              {impact.doesNotChange}
            </p>
          </section>

          {/* Assumptions */}
          <section>
            <h4 className="modal-section-heading">
              ASSUMPTIONS
            </h4>
            <ul className="modal-assumptions-list">
              {impact.assumptions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            className="btn-primary w-full mt-2"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
