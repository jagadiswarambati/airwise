import React, { useEffect } from 'react';
import { ActionCandidate } from '../../domain/types';

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
          <h2 id="modal-action-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {action.title}
          </h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close action detail"
            style={{ fontSize: '1.25rem' }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Disclaimers & Safety Caveats */}
          {fixedDisclaimers && fixedDisclaimers.length > 0 && (
            <div className="banner banner-warning">
              <div>
                {fixedDisclaimers.map((caveat, idx) => (
                  <p key={idx} style={{ margin: 0, fontWeight: 500 }}>
                    {caveat}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Dual-Axis Impact Breakdown */}
          <section aria-label="Dual-Axis Impact Breakdown">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              DUAL-AXIS IMPACT
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Exposure Axis */}
              <div
                style={{
                  border: '1px solid #bae6fd',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>
                  EXPOSURE AXIS
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, margin: '4px 0' }}>
                  {impact.exposure.direction === 'reduces'
                    ? 'Reduces Exposure ↓'
                    : impact.exposure.direction === 'neutral'
                      ? 'Neutral —'
                      : 'Conditional'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Label: <strong>{impact.exposure.label}</strong> ({impact.exposure.confidence}{' '}
                  confidence)
                </div>
                {impact.exposure.magnitude && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>
                    {impact.exposure.magnitude}
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--color-text-main)' }}>
                  {impact.exposure.note}
                </p>
              </div>

              {/* Emissions Axis */}
              <div
                style={{
                  border: '1px solid #bbf7d0',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                  EMISSIONS AXIS
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, margin: '4px 0' }}>
                  {impact.emissions.direction === 'reduces'
                    ? 'Reduces Emissions ↓'
                    : impact.emissions.direction === 'neutral'
                      ? 'Neutral —'
                      : 'Conditional'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Label: <strong>{impact.emissions.label}</strong> ({impact.emissions.confidence}{' '}
                  confidence)
                </div>
                {impact.emissions.value && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>
                    ≈ {impact.emissions.value.vkm} vkm avoided/wk
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--color-text-main)' }}>
                  {impact.emissions.note}
                </p>
              </div>
            </div>
          </section>

          {/* What this does NOT change */}
          <section>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              WHAT IT DOES NOT CHANGE
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '4px' }}>
              {impact.doesNotChange}
            </p>
          </section>

          {/* Assumptions */}
          <section>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              ASSUMPTIONS
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {impact.assumptions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

