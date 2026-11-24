import React from 'react';
import {
  AirSnapshot,
  HouseholdProfile,
  Plan,
  RiskLevel,
  RiskRadarResult,
} from '../../domain/types';
import { LEVEL_NAMES, getLevelHeadline } from '../../domain/levels';
import { Atmosphere } from '../atmosphere/Atmosphere';
import { HazeBand } from './HazeBand';
import { Icon, IconName } from '../icons';
import { parseLocalTime } from '../../domain/time';

export interface LevelHeroProps {
  snapshot: AirSnapshot;
  profile: HouseholdProfile;
  plan: Plan;
  radar?: RiskRadarResult;
  effectiveLevel: RiskLevel;
  animatedSkyEnabled?: boolean;
  isFallback?: boolean;
}

function getIconForLevel(level: RiskLevel): IconName {
  switch (level) {
    case 0:
      return 'check';
    case 1:
      return 'info';
    case 2:
      return 'caution';
    case 3:
      return 'protect';
    case 4:
      return 'severe';
  }
}

function getDataAgeInWords(snapshot: AirSnapshot): string {
  if (snapshot.source.dataType === 'sample' && !snapshot.fetchedAt) {
    return 'Demo data';
  }
  if (!snapshot.fetchedAt) {
    return 'Recent forecast';
  }

  const fetched = new Date(snapshot.fetchedAt).getTime();
  const now = Date.now();
  const diffHours = Math.floor((now - fetched) / (1000 * 60 * 60));

  if (diffHours < 1) {
    return 'Updated just now';
  }
  if (diffHours === 1) {
    return 'Updated 1 hour ago';
  }
  return `Updated ${diffHours} hours ago`;
}

/**
 * LevelHero: Signature hero element spanning full container width.
 * Features decorative Sky Strip (Atmosphere) on top, solid color field
 * from --haze-N-bg/-ink with sentence-case level words, PM2.5 + unit + data type,
 * 3 trust chips, a single explanatory sentence, and the HazeBand.
 */
export const LevelHero: React.FC<LevelHeroProps> = ({
  snapshot,
  profile,
  plan,
  radar,
  effectiveLevel,
  animatedSkyEnabled,
  isFallback = false,
}) => {
  const localHour = parseLocalTime(
    snapshot.fetchedAt || snapshot.pm25.hourly[0]?.time || '',
    snapshot.utcOffsetSeconds,
  ).hour;

  const pm25Val =
    snapshot.pm25.now !== null && !isNaN(snapshot.pm25.now)
      ? Math.round(snapshot.pm25.now)
      : '—';

  const levelWord =
    effectiveLevel === 4
      ? 'Severe for your household'
      : `${LEVEL_NAMES[effectiveLevel]} for your household`;

  const dataTypeLabel =
    snapshot.source.dataType === 'sample' ? 'Sample' : 'Modelled';

  const dataAge = getDataAgeInWords(snapshot);

  // Validate supported AQI standards from DATA_SOURCES.md
  const aqiText =
    snapshot.aqi && (snapshot.aqi.standard === 'US' || snapshot.aqi.standard === 'EU')
      ? `${snapshot.aqi.standard === 'US' ? 'US AQI' : 'European AQI'} ${snapshot.aqi.value}`
      : null;

  return (
    <section
      className={`aw-level-hero aw-level-hero-${effectiveLevel}`}
      aria-label={`Current air risk status: ${levelWord}`}
    >
      {/* 1. Sky Strip (Atmosphere) */}
      <Atmosphere
        level={effectiveLevel}
        localHour={localHour}
        windKmh={snapshot.weather?.windSpeed10m ?? undefined}
        enabled={animatedSkyEnabled ?? true}
        isFallback={isFallback}
      />

      {/* 2. Solid Color Field */}
      <div className="aw-level-hero-body">
        {/* Level in words */}
        <div className="aw-level-hero-title-row">
          <Icon
            name={getIconForLevel(effectiveLevel)}
            size={28}
            className="aw-level-hero-icon"
            aria-hidden="true"
          />
          <span className="aw-level-hero-title">
            {levelWord}
          </span>
        </div>

        {/* PM2.5 Value with Unit and Data Type (never alone) */}
        <div className="aw-level-hero-reading">
          <span className="aw-level-hero-pm25-val">{pm25Val}</span>
          <span className="aw-level-hero-pm25-unit">µg/m³ PM2.5</span>
          <span className="aw-level-hero-data-type">({dataTypeLabel})</span>
          {aqiText && (
            <span className="aw-level-hero-aqi">
              ({aqiText})
            </span>
          )}
        </div>

        {/* Three Trust Chips */}
        <div className="aw-level-hero-chips" role="list" aria-label="Forecast metadata chips">
          <span className="aw-hero-chip" role="listitem">
            {snapshot.source.dataType === 'sample' ? 'Sample data' : 'Modelled data'}
          </span>
          <span className="aw-hero-chip" role="listitem">
            {dataAge}
          </span>
          <span className="aw-hero-chip" role="listitem">
            {plan.source === 'ai' ? 'AI-personalised plan' : 'Standard plan'}
          </span>
        </div>

        {/* One Plain Sentence */}
        <p className="aw-level-hero-sentence">
          {getLevelHeadline(effectiveLevel)}
        </p>

        {/* 3. Inline SVG Waking Day HazeBand */}
        <HazeBand
          snapshot={snapshot}
          profile={profile}
          radar={radar}
          effectiveLevel={effectiveLevel}
        />
      </div>
    </section>
  );
};
