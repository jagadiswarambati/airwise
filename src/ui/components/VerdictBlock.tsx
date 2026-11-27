import React from 'react';
import { Icon } from '../icons';

export interface VerdictBlockProps {
  verdict: 'open' | 'brief' | 'closed';
  explanation: string;
  atHour?: number;
  durationMinutes?: number;
  className?: string;
  headingId?: string;
  ariaLabel?: string;
  as?: 'section' | 'div';
}

export const VerdictBlock: React.FC<VerdictBlockProps> = ({
  verdict,
  explanation,
  atHour,
  className = '',
  headingId,
  ariaLabel,
  as = 'section',
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

  const defaultHeadingId = 'verdict-heading';
  const effectiveHeadingId = headingId || defaultHeadingId;
  const Tag = as;
  const sectionProps = ariaLabel
    ? { 'aria-label': ariaLabel }
    : { 'aria-labelledby': effectiveHeadingId };
  const accessibilityProps = Tag === 'section' ? sectionProps : {};

  return (
    <Tag
      className={`card card-callout-primary aw-verdict-block ${className}`.trim()}
      {...accessibilityProps}
    >
      <div className="flex-between mb-2">
        <h2 id={effectiveHeadingId} className="screen-section-title">
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
    </Tag>
  );
};

export default VerdictBlock;
