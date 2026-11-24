import React, { useState } from 'react';
import { type TrustModel } from '../../data/trust';
import { Icon } from '../icons';

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
        className="trust-toggle-btn"
        aria-expanded={isOpen}
      >
        <div className="trust-title-row">
          <Icon name="protect" size={18} aria-hidden="true" />
          <span className="card-title">
            Trust &amp; Data Transparency
          </span>
        </div>
        <div className="trust-badges-row">
          <span className="tag tag-cost">{trust.dataTypeBadge}</span>
          <Icon name="chevron" size={16} aria-hidden="true" />
        </div>
      </button>

      {isOpen && (
        <div className="trust-details">
          <div className="trust-item">
            <strong>Data Source:</strong> {trust.sourceName}
          </div>

          <div className="trust-item">
            <strong>Freshness:</strong>{' '}
            <span className="tag tag-cost">{trust.freshnessBadge}</span> {trust.freshnessNote}
          </div>

          <div className="trust-item">
            <strong>Resolution:</strong> {trust.resolutionNote}
          </div>

          <div className="trust-item">
            <strong>Plan Confidence:</strong>{' '}
            <span className="tag tag-exposure">
              {trust.planConfidence}
            </span>
            <div className="trust-subnote">{trust.confidenceReason}</div>
          </div>

          <div className="trust-item">
            <strong>Plan Source:</strong> {trust.planSource}
          </div>

          {trust.isFallback && trust.fallbackReason && (
            <div className="banner banner-offline">
              {trust.fallbackReason}
            </div>
          )}

          <div className="trust-box">
            <p>
              <strong>Attribution:</strong> {trust.attribution}
            </p>
            <p className="trust-subnote">
              <strong>Notice:</strong> {trust.uncertaintyDisclaimer}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
