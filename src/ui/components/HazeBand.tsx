import React from 'react';
import {
  type AirSnapshot,
  type HouseholdProfile,
  type RiskLevel,
  type RiskRadarResult,
} from '../../domain/types';
import { parseLocalTime, parseTimeToMinutes, formatMinutesToTime } from '../../domain/time';
import { computeBaseLevel, LEVEL_NAMES } from '../../domain/levels';
import { deriveTimeSlots } from '../../domain/radar';
import { isMinuteInSlot } from '../../domain/time';

export interface HazeBandProps {
  snapshot: AirSnapshot;
  profile: HouseholdProfile;
  radar?: RiskRadarResult;
  effectiveLevel?: RiskLevel;
}

interface WakingPoint {
  hour: number;
  timeLabel: string;
  pm25: number;
  level: RiskLevel;
  levelWord: string;
  isNow: boolean;
  isRadarSlot: boolean;
  marker?: string;
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
  const targetRegion = profile.location.country === 'IN' ? 'IN' : 'US';
  const utcOffset = snapshot.utcOffsetSeconds;

  // 1. Determine waking range
  const routine = profile.routine || {
    wake: '07:00',
    bed: '22:00',
    leave: '08:00',
    returnHome: '18:00',
    cooking: ['07:30', '19:30'],
  };
  const wakeM = parseTimeToMinutes(routine.wake || '07:00');
  const bedM = parseTimeToMinutes(routine.bed || '22:00');
  const wakeH = Math.floor(wakeM / 60);
  const bedH = Math.floor(bedM / 60);

  const startH = bedH > wakeH ? wakeH : 6;
  const endH = bedH > wakeH ? bedH : 22;

  // Household routine markers
  const leaveH = Math.floor(parseTimeToMinutes(routine.leave || '08:00') / 60);
  const returnH = Math.floor(parseTimeToMinutes(routine.returnHome || '18:00') / 60);
  const cookHours = (routine.cooking || ['07:30', '19:30']).map((t) =>
    Math.floor(parseTimeToMinutes(t) / 60),
  );

  // Radar slot time definition
  const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, targetRegion, utcOffset);
  const targetRadarSlot = radar ? slots.find((s) => s.id === radar.slotId) : undefined;

  // Current local hour
  const nowHour = parseLocalTime(
    snapshot.fetchedAt || snapshot.pm25.hourly[0]?.time || '',
    utcOffset,
  ).hour;

  // 2. Build hourly waking points from snapshot series
  const hourlyMap = new Map<number, number>();
  for (const pt of snapshot.pm25.hourly) {
    if (!pt.time) continue;
    const h = parseLocalTime(pt.time, utcOffset).hour;
    if (pt.pm25 !== null && !isNaN(pt.pm25)) {
      hourlyMap.set(h, pt.pm25);
    }
  }

  const wakingPoints: WakingPoint[] = [];
  for (let h = startH; h <= endH; h++) {
    const pm25 = hourlyMap.get(h) ?? snapshot.pm25.now ?? 25;
    const level = computeBaseLevel(pm25, targetRegion);
    const levelWord = LEVEL_NAMES[level];
    const isNow = h === nowHour;

    let isRadarSlot = false;
    if (targetRadarSlot) {
      const startM = parseTimeToMinutes(targetRadarSlot.startTime);
      const endM = parseTimeToMinutes(targetRadarSlot.endTime);
      isRadarSlot = isMinuteInSlot(h * 60 + 30, startM, endM);
    }

    let marker: string | undefined = undefined;
    if (h === leaveH) marker = 'Leave';
    else if (h === returnH) marker = 'Return';
    else if (cookHours.includes(h)) marker = 'Cook';

    wakingPoints.push({
      hour: h,
      timeLabel: formatMinutesToTime(h * 60),
      pm25,
      level,
      levelWord,
      isNow,
      isRadarSlot,
      marker,
    });
  }

  // 3. Compute Summary Sentence for aria-label
  const pmValues = wakingPoints.map((p) => Math.round(p.pm25));
  const minPm = pmValues.length > 0 ? Math.min(...pmValues) : 20;
  const maxPm = pmValues.length > 0 ? Math.max(...pmValues) : 50;

  const peakPoint =
    wakingPoints.find((p) => Math.round(p.pm25) === maxPm) || wakingPoints[0];
  const peakTime = peakPoint ? peakPoint.timeLabel : '';
  const peakLevelWord = peakPoint ? peakPoint.levelWord : '';

  const firstTime = wakingPoints[0]?.timeLabel || '07:00';
  const lastTime = wakingPoints[wakingPoints.length - 1]?.timeLabel || '22:00';

  const summaryAriaLabel = `Hourly PM2.5 forecast for waking hours (${firstTime} to ${lastTime}): ranges from ${minPm} to ${maxPm} µg/m³, peaking around ${peakTime} in the ${peakLevelWord} band.`;

  // 4. SVG Layout coordinates
  const svgWidth = 640;
  const svgHeight = 175;
  const marginLeft = 20;
  const marginRight = 20;
  const plotWidth = svgWidth - marginLeft - marginRight;
  const count = Math.max(1, wakingPoints.length);
  const stepX = plotWidth / count;
  const barWidth = Math.max(10, stepX - 6);

  const baselineY = 125;
  const maxBarH = 75;
  const maxScalePm = Math.max(80, maxPm * 1.15);

  return (
    <div className="aw-hazeband-container">
      <div
        className="aw-hazeband-svg-wrap"
        role="img"
        aria-label={summaryAriaLabel}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="aw-hazeband-svg"
          preserveAspectRatio="none"
        >
          {/* Baseline */}
          <line
            x1={marginLeft}
            y1={baselineY}
            x2={svgWidth - marginRight}
            y2={baselineY}
            className="aw-hazeband-axis"
          />

          {/* Hourly Bars */}
          {wakingPoints.map((pt, idx) => {
            const x = marginLeft + idx * stepX + (stepX - barWidth) / 2;
            const barH = Math.max(14, Math.round((pt.pm25 / maxScalePm) * maxBarH));
            const y = baselineY - barH;
            const isTick = pt.hour % 3 === 0;

            return (
              <g
                key={pt.hour}
                className={`aw-haze-group aw-haze-level-${pt.level} ${
                  pt.isRadarSlot ? 'aw-haze-radar-slot' : ''
                }`}
              >
                {/* Radar slot highlight background */}
                {pt.isRadarSlot && (
                  <rect
                    x={x - 2}
                    y={22}
                    width={barWidth + 4}
                    height={baselineY - 22}
                    className="aw-haze-radar-bg"
                    rx={3}
                  />
                )}

                {/* Primary bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  className="aw-haze-bar"
                />

                {/* Household marker label at top */}
                {pt.marker && (
                  <text
                    x={x + barWidth / 2}
                    y={16}
                    textAnchor="middle"
                    className="aw-haze-marker-text"
                  >
                    {pt.marker}
                  </text>
                )}

                {/* "Now" tick / label */}
                {pt.isNow && (
                  <g className="aw-haze-now-group">
                    <circle
                      cx={x + barWidth / 2}
                      cy={baselineY + 8}
                      r={3}
                      className="aw-haze-now-dot"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={baselineY + 22}
                      textAnchor="middle"
                      className="aw-haze-now-text"
                    >
                      Now
                    </text>
                  </g>
                )}

                {/* 3-hour tick labels */}
                {isTick && !pt.isNow && (
                  <text
                    x={x + barWidth / 2}
                    y={baselineY + 22}
                    textAnchor="middle"
                    className="aw-haze-tick-text"
                  >
                    {pt.timeLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Accessible Disclosure with Complete Hourly Values Table */}
      <details className="aw-haze-disclosure">
        <summary className="aw-haze-disclosure-summary">
          Show hourly values
        </summary>
        <div className="aw-haze-table-wrap">
          <table className="aw-haze-table">
            <caption>Hourly forecast for waking day</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">PM2.5 (µg/m³)</th>
                <th scope="col">Level</th>
              </tr>
            </thead>
            <tbody>
              {wakingPoints.map((pt) => (
                <tr key={pt.hour}>
                  <td>{pt.timeLabel}</td>
                  <td>{Math.round(pt.pm25)} µg/m³</td>
                  <td>{pt.levelWord}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
