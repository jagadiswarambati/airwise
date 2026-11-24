import React from 'react';
import {
  type AirSnapshot,
  type HouseholdProfile,
  type RiskLevel,
  type RiskRadarResult,
} from '../../domain/types';
import { computeWakingPoints } from './hazeband/model';
import { HazeBandSvg } from './hazeband/HazeBandSvg';
import { HazeBandTable } from './hazeband/HazeBandTable';

export interface HazeBandProps {
  snapshot: AirSnapshot;
  profile: HouseholdProfile;
  radar?: RiskRadarResult;
  effectiveLevel?: RiskLevel;
}

/**
 * HazeBand: Inline SVG bar chart of forecast levels across the waking day.
 * Includes ticks every 3 hours, a "now" marker, household markers,
 * radar slot highlighting, an accessible summary aria-label, and a data table disclosure.
 */
export const HazeBand: React.FC<HazeBandProps> = ({
  snapshot,
  profile,
  radar,
}) => {
  const { wakingPoints, summaryAriaLabel } = computeWakingPoints(snapshot, profile, radar);

  const pmValues = wakingPoints.map((p) => Math.round(p.pm25));
  const maxPm = pmValues.length > 0 ? Math.max(...pmValues) : 50;

  return (
    <div className="aw-hazeband-container">
      <div
        className="aw-hazeband-svg-wrap"
        role="img"
        aria-label={summaryAriaLabel}
      >
        <HazeBandSvg wakingPoints={wakingPoints} maxPm={maxPm} />
      </div>

      <HazeBandTable wakingPoints={wakingPoints} />
    </div>
  );
};

export default HazeBand;
