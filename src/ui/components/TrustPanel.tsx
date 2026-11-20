import React, { useState } from 'react';
import { TrustModel } from '../../data/trust';

interface TrustPanelProps {
  trust: TrustModel;
}

export const TrustPanel: React.FC<TrustPanelProps> = ({ trust }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="card" aria-label="Data Trust & Plan Provenance Panel">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          cursor: 'pointer',
        }}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span aria-hidden="true">🛡️</span>
          <span className="card-title" style={{ fontSize: '0.9rem' }}>
            Trust &amp; Data Transparency
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tag tag-cost">{trust.dataTypeBadge}</span>
          <span style={{ fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <div>
            <strong>Data Source:</strong> {trust.sourceName}
          </div>

          <div>
            <strong>Freshness:</strong>{' '}
            <span className="tag tag-cost">{trust.freshnessBadge}</span> {trust.freshnessNote}
          </div>

          <div>
            <strong>Resolution:</strong> {trust.resolutionNote}
          </div>

          <div>
            <strong>Plan Confidence:</strong>{' '}
            <span className="tag tag-exposure" style={{ textTransform: 'capitalize' }}>
              {trust.planConfidence}
            </span>
            <div style={{ marginTop: '2px' }}>{trust.confidenceReason}</div>
          </div>

          <div>
            <strong>Plan Source:</strong> {trust.planSource}
          </div>

          {trust.isFallback && trust.fallbackReason && (
            <div className="banner banner-offline" style={{ fontSize: '0.75rem' }}>
              {trust.fallbackReason}
            </div>
          )}

          <div
            style={{
              padding: '8px',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              lineHeight: 1.35,
            }}
          >
            <p>
              <strong>Attribution:</strong> {trust.attribution}
            </p>
            <p style={{ marginTop: '4px' }}>
              <strong>Notice:</strong> {trust.uncertaintyDisclaimer}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

