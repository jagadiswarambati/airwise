import React from 'react';
import { Icon } from '../icons';

export interface VerdictBlockProps {
  verdict: 'open' | 'brief' | 'closed';
  explanation: string;
  atHour?: number;
  durationMinutes?: number;
  className?: string;
}

export const VerdictBlock: React.FC<VerdictBlockProps> = ({
  verdict,
  explanation,
  atHour,
  className = '',
}) => {
  const getHeadline = (): string => {
    switch (verdict) {
      case 'open':
        return 'Ventilate freely';
      case 'brief':
        return atHour !== undefined
          ? `Open a window briefly around ${atHour}:00`
          : 'Open a window briefly';
      case 'closed':
      default:
        return 'Keep windows closed';
    }
  };

  const getIconName = () => {
    switch (verdict) {
      case 'open':
        return 'check';
      case 'brief':
        return 'watch';
      case 'closed':
      default:
        return 'close';
    }
  };

  const getVerdictBadgeClass = (v: string) => {
    if (v === 'open') return 'vent-badge-open';
    if (v === 'brief') return 'vent-badge-brief';
    return 'vent-badge-closed';
  };

  const badgeClass = getVerdictBadgeClass(verdict);

  return (
    <section
      className={`card card-callout-primary aw-verdict-block ${className}`.trim()}
      aria-labelledby="verdict-heading"
    >
      <div className="flex-between mb-2">
        <h2 id="verdict-heading" className="screen-section-title">
          <Icon name="wind" size={22} aria-hidden="true" />
          <span>Smart Ventilation Advisor</span>
        </h2>
        <span className={`vent-badge ${badgeClass}`}>
          <Icon name={getIconName()} size={16} aria-hidden="true" />
          <span>{getHeadline()}</span>
        </span>
      </div>

      <p className="vent-explanation mb-2">{explanation}</p>

      {atHour !== undefined && verdict === 'brief' && (
        <div className="box-subtle">
          <strong>Recommended window: </strong>
          Around {atHour}:00
        </div>
      )}
    </section>
  );
};

export default VerdictBlock;
