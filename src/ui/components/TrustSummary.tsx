import React from 'react';
import { TrustModel } from '../../data/trust';
import { OPEN_METEO_ATTRIBUTION } from '../../config/site';
import { Icon } from '../icons';

export interface TrustSummaryProps {
  trust: TrustModel;
}

/**
 * TrustSummary: Accessible expandable disclosure.
 * Displays one always-visible line:
 * "Confidence: Medium. Modelled data, updated 2 hours ago."
 * Expands into source, data type, freshness, fallback status,
 * uncertainty note, attribution constant, plan source and plan confidence.
 */
export const TrustSummary: React.FC<TrustSummaryProps> = ({ trust }) => {
  const confTitle =
    trust.planConfidence.charAt(0).toUpperCase() + trust.planConfidence.slice(1);
  const typeText = trust.dataTypeBadge.includes('data')
    ? trust.dataTypeBadge
    : `${trust.dataTypeBadge} data`;
  const summaryLine = `Confidence: ${confTitle}. ${typeText}, updated ${trust.freshnessNote}.`;

  return (
    <section className="aw-trust-summary-section" aria-label="Forecast trust and provenance">
      <details className="aw-trust-disclosure">
        <summary className="aw-trust-summary-trigger">
          <div className="aw-trust-summary-line">
            <Icon name="protect" size={16} aria-hidden="true" />
            <span className="aw-trust-summary-text">{summaryLine}</span>
            <Icon name="chevron" size={14} className="aw-trust-chevron" aria-hidden="true" />
          </div>
        </summary>

        <div className="aw-trust-expanded-content">
          <dl className="aw-trust-dl">
            <div className="aw-trust-row">
              <dt>Data source</dt>
              <dd>{trust.sourceName}</dd>
            </div>
            <div className="aw-trust-row">
              <dt>Data type</dt>
              <dd>{trust.dataTypeBadge}</dd>
            </div>
            <div className="aw-trust-row">
              <dt>Freshness</dt>
              <dd>
                {trust.freshnessBadge} ({trust.freshnessNote})
              </dd>
            </div>
            <div className="aw-trust-row">
              <dt>Fallback status</dt>
              <dd>
                {trust.isFallback
                  ? trust.fallbackReason || 'Fallback mode active'
                  : 'Normal live operation'}
              </dd>
            </div>
            <div className="aw-trust-row">
              <dt>Uncertainty note</dt>
              <dd>{trust.resolutionNote}</dd>
            </div>
            <div className="aw-trust-row">
              <dt>Plan source</dt>
              <dd>{trust.planSource}</dd>
            </div>
            <div className="aw-trust-row">
              <dt>Plan confidence</dt>
              <dd>
                {trust.planConfidence} — {trust.confidenceReason}
              </dd>
            </div>
            <div className="aw-trust-row aw-trust-row-full">
              <dt>Attribution</dt>
              <dd className="aw-trust-attribution-text">{OPEN_METEO_ATTRIBUTION}</dd>
            </div>
          </dl>
        </div>
      </details>
    </section>
  );
};
