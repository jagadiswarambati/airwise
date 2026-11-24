import React from 'react';
import { Icon } from '../icons';

export interface CompareBarsProps {
  commuteShiftFeasible: boolean;
  usualPm25?: number | null;
  alternativePm25?: number | null;
  differenceUgm3?: number;
  usualLabel?: string;
  alternativeLabel?: string;
  className?: string;
}

export const CompareBars: React.FC<CompareBarsProps> = ({
  commuteShiftFeasible,
  usualPm25,
  alternativePm25,
  differenceUgm3,
  usualLabel = 'Usual commute window',
  alternativeLabel = 'Best alternative window',
  className = '',
}) => {
  if (
    !commuteShiftFeasible ||
    usualPm25 === null ||
    alternativePm25 === null ||
    usualPm25 === undefined ||
    alternativePm25 === undefined
  ) {
    return (
      <div className={`box-subtle ${className}`.trim()}>
        <p className="text-muted">No meaningful difference today.</p>
      </div>
    );
  }

  const usualInt = Math.round(usualPm25);
  const altInt = Math.round(alternativePm25);
  const diffInt =
    differenceUgm3 !== undefined ? Math.round(differenceUgm3) : Math.max(0, usualInt - altInt);

  // Maximum for bar scale
  const maxVal = Math.max(usualInt, altInt, 1);
  const usualWidth = Math.max(12, Math.min(100, Math.round((usualInt / maxVal) * 100)));
  const altWidth = Math.max(12, Math.min(100, Math.round((altInt / maxVal) * 100)));

  const textAlternative = `Shifting departure reduces modelled outdoor PM2.5 from ${usualInt} µg/m³ to ${altInt} µg/m³ (about ${diffInt} µg/m³ lower).`;

  return (
    <div
      className={`aw-compare-bars-container ${className}`.trim()}
      role="group"
      aria-label="Commute exposure comparison"
    >
      <div className="aw-compare-bars-header">
        <div className="flex-row-center gap-1">
          <Icon name="exposure" size={16} aria-hidden="true" />
          <strong className="text-exposure text-sm">Commute Timing Window Comparison</strong>
        </div>
        <span className="aw-badge aw-badge-data-type">Modelled</span>
      </div>

      <div className="aw-compare-bars-stack">
        {/* Usual Window */}
        <div className="aw-compare-bar-row">
          <div className="aw-compare-bar-label">
            <span>{usualLabel}</span>
            <span className="aw-compare-bar-value">{usualInt} µg/m³</span>
          </div>
          <div className="aw-compare-bar-track">
            <div
              className="aw-compare-bar-fill aw-compare-bar-usual"
              style={{ ['--bar-width' as string]: `${usualWidth}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Alternative Window */}
        <div className="aw-compare-bar-row">
          <div className="aw-compare-bar-label">
            <span>{alternativeLabel}</span>
            <span className="aw-compare-bar-value text-exposure">{altInt} µg/m³</span>
          </div>
          <div className="aw-compare-bar-track">
            <div
              className="aw-compare-bar-fill aw-compare-bar-alt"
              style={{ ['--bar-width' as string]: `${altWidth}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Accessible Text Alternative */}
      <p className="aw-compare-text-alternative text-xs text-muted mt-2">
        {textAlternative}
      </p>
    </div>
  );
};

export default CompareBars;
