import React from 'react';
import { Icon } from '../icons';

export interface AxisDetails {
  direction?: 'unknown' | 'reduces' | 'neutral' | 'increases' | 'conditional' | string;
  label?: string;
  confidence?: string;
  note?: string;
  value?: { vkm?: number; raw?: number };
  magnitude?: string;
}

export interface AxisPairProps {
  exposure?: React.ReactNode | AxisDetails;
  emissions?: React.ReactNode | AxisDetails;
  variant?: 'full' | 'summary';
  className?: string;
}

function formatDirectionWord(direction?: string, axis?: 'exposure' | 'emissions'): string {
  if (direction === 'reduces') {
    return axis === 'exposure' ? 'Lowers exposure' : 'Lowers emissions';
  }
  if (direction === 'neutral') {
    return 'No change';
  }
  if (direction === 'conditional') {
    return 'Conditional';
  }
  return direction || 'Neutral';
}

function formatConfidenceWord(confidence?: string): string {
  if (!confidence) return '';
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    default:
      return `${confidence} confidence`;
  }
}

export const AxisPair: React.FC<AxisPairProps> = ({
  exposure,
  emissions,
  variant = 'full',
  className = '',
}) => {
  // If children/ReactNodes are passed directly and it's not an AxisDetails object
  const isExposureNode = React.isValidElement(exposure) || typeof exposure === 'string';
  const isEmissionsNode = React.isValidElement(emissions) || typeof emissions === 'string';

  if (isExposureNode || isEmissionsNode) {
    return (
      <div className={`aw-axis-pair ${className}`.trim()}>
        <div className="aw-axis-card aw-axis-exposure">{exposure as React.ReactNode}</div>
        <div className="aw-axis-card aw-axis-emissions">{emissions as React.ReactNode}</div>
      </div>
    );
  }

  const exp = (exposure || {}) as AxisDetails;
  const em = (emissions || {}) as AxisDetails;

  if (variant === 'summary') {
    return (
      <div className={`aw-axis-summary-row flex-row-center gap-2 text-xs ${className}`.trim()}>
        <span className="flex-row-center gap-1 text-exposure">
          <Icon name="protect" size={14} aria-hidden="true" />
          <span>Exposure: {exp.direction === 'reduces' ? 'lowers' : exp.direction === 'neutral' ? 'no change' : 'conditional'}</span>
        </span>
        <span className="text-muted" aria-hidden="true">·</span>
        <span className="flex-row-center gap-1 text-emissions">
          <Icon name="emissions" size={14} aria-hidden="true" />
          <span>Emissions: {em.direction === 'reduces' ? 'lowers' : em.direction === 'neutral' ? 'no change' : 'conditional'}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`aw-axis-pair-grid ${className}`.trim()}>
      {/* Exposure Axis */}
      <div className="axis-card-exposure">
        <div className="flex-between mb-1">
          <strong className="text-exposure flex-row-center gap-1">
            <Icon name="protect" size={16} aria-hidden="true" />
            <span>Exposure</span>
          </strong>
          {exp.label && <span className="tag-exposure-pill">{exp.label}</span>}
        </div>
        <div className="catalog-axis-direction">
          {formatDirectionWord(exp.direction, 'exposure')}
        </div>
        {exp.confidence && (
          <div className="text-xs text-muted mt-1">
            {formatConfidenceWord(exp.confidence)}
          </div>
        )}
        {exp.magnitude && (
          <div className="catalog-magnitude text-exposure">{exp.magnitude}</div>
        )}
        {exp.note && <div className="catalog-axis-note mt-1">{exp.note}</div>}
      </div>

      {/* Emissions Axis */}
      <div className="axis-card-emissions">
        <div className="flex-between mb-1">
          <strong className="text-emissions flex-row-center gap-1">
            <Icon name="emissions" size={16} aria-hidden="true" />
            <span>Emissions</span>
          </strong>
          {em.label && <span className="tag-emissions-pill">{em.label}</span>}
        </div>
        <div className="catalog-axis-direction">
          {formatDirectionWord(em.direction, 'emissions')}
        </div>
        {em.confidence && (
          <div className="text-xs text-muted mt-1">
            {formatConfidenceWord(em.confidence)}
          </div>
        )}
        {em.value && (
          <div className="catalog-magnitude text-emissions">
            ~{em.value.vkm} vkm avoided
          </div>
        )}
        {em.note && <div className="catalog-axis-note mt-1">{em.note}</div>}
      </div>
    </div>
  );
};

export default AxisPair;
