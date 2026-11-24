import React from 'react';
import {
  type AirSnapshot,
  type HouseholdProfile,
  type Plan,
  type RiskLevel,
  type RiskRadarResult,
} from '../../domain/types';
import { LEVEL_NAMES, getLevelHeadline } from '../../domain/levels';
import { Atmosphere } from '../atmosphere/Atmosphere';
import { HazeBand } from './HazeBand';
import { Icon, type IconName } from '../icons';
import { parseLocalTime } from '../../domain/time';
import { type Clock, systemClock } from '../../lib/clock';

export interface LevelHeroProps {
  snapshot: AirSnapshot;
  profile: HouseholdProfile;
  plan: Plan;
  radar?: RiskRadarResult;
  effectiveLevel: RiskLevel;
  animatedSkyEnabled?: boolean;
  isFallback?: boolean;
  clock?: Clock;
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

function getDataAgeInWords(snapshot: AirSnapshot, clock: Clock = systemClock): string {
  if (snapshot.source.dataType === 'sample' && !snapshot.fetchedAt) {
    return 'Demo data';
  }
  if (!snapshot.fetchedAt) {
    return 'Recent forecast';
  }

  const fetched = new Date(snapshot.fetchedAt).getTime();
  const now = clock().getTime();
  const diffHours = Math.floor((now - fetched) / (1000 * 60 * 60));

  if (diffHours < 1) {
    return 'Updated just now';
  }
  if (diffHours === 1) {
    return 'Updated 1 hour ago';
  }
  return `Updated ${diffHours} hours ago`;
}

const LevelHeroHeader: React.FC<{
  effectiveLevel: RiskLevel;
  levelWord: string;
  pm25Val: number | string;
  dataTypeLabel: string;
  aqiText: string | null;
}> = ({ effectiveLevel, levelWord, pm25Val, dataTypeLabel, aqiText }) => (
  <>
    <div className="aw-level-hero-title-row">
      <Icon
        name={getIconForLevel(effectiveLevel)}
        size={28}
        className="aw-level-hero-icon"
        aria-hidden="true"
      />
      <span className="aw-level-hero-title">{levelWord}</span>
    </div>

    <div className="aw-level-hero-reading">
      <span className="aw-level-hero-pm25-val">{pm25Val}</span>
      <span className="aw-level-hero-pm25-unit">µg/m³ PM2.5</span>
      <span className="aw-level-hero-data-type">({dataTypeLabel})</span>
      {aqiText && <span className="aw-level-hero-aqi">({aqiText})</span>}
    </div>
  </>
);

const LevelHeroChips: React.FC<{
  dataType: string;
  dataAge: string;
  isAiPlan: boolean;
}> = ({ dataType, dataAge, isAiPlan }) => (
  <div className="aw-level-hero-chips" role="list" aria-label="Forecast metadata chips">
    <span className="aw-hero-chip" role="listitem">
      {dataType === 'sample' ? 'Sample data' : 'Modelled data'}
    </span>
    <span className="aw-hero-chip" role="listitem">
      {dataAge}
    </span>
    <span className="aw-hero-chip" role="listitem">
      {isAiPlan ? 'AI-personalised plan' : 'Standard plan'}
    </span>
  </div>
);

function formatAqiBadge(aqi?: { standard: string; value: number } | null): string | null {
  if (!aqi) return null;
  if (aqi.standard === 'US') return `US AQI ${aqi.value}`;
  if (aqi.standard === 'EU') return `European AQI ${aqi.value}`;
  return null;
}

function deriveHeroViewModel(
  snapshot: AirSnapshot,
  effectiveLevel: RiskLevel,
  clock: Clock,
) {
  const timeStr = snapshot.fetchedAt || snapshot.pm25.hourly[0]?.time || '';
  const localHour = parseLocalTime(timeStr, snapshot.utcOffsetSeconds).hour;

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

  const dataAge = getDataAgeInWords(snapshot, clock);
  const aqiText = formatAqiBadge(snapshot.aqi);

  return { localHour, pm25Val, levelWord, dataTypeLabel, dataAge, aqiText };
}

export const LevelHero: React.FC<LevelHeroProps> = ({
  snapshot,
  profile,
  plan,
  radar,
  effectiveLevel,
  animatedSkyEnabled,
  isFallback = false,
  clock = systemClock,
}) => {
  const vm = deriveHeroViewModel(snapshot, effectiveLevel, clock);

  return (
    <section
      className={`aw-level-hero aw-level-hero-${effectiveLevel}`}
      aria-label={`Current air risk status: ${vm.levelWord}`}
    >
      <Atmosphere
        level={effectiveLevel}
        localHour={vm.localHour}
        windKmh={snapshot.weather?.windSpeed10m ?? undefined}
        enabled={animatedSkyEnabled ?? true}
        isFallback={isFallback}
      />

      <div className="aw-level-hero-body">
        <LevelHeroHeader
          effectiveLevel={effectiveLevel}
          levelWord={vm.levelWord}
          pm25Val={vm.pm25Val}
          dataTypeLabel={vm.dataTypeLabel}
          aqiText={vm.aqiText}
        />

        <LevelHeroChips
          dataType={snapshot.source.dataType}
          dataAge={vm.dataAge}
          isAiPlan={plan.source === 'ai'}
        />

        <p className="aw-level-hero-sentence">
          {getLevelHeadline(effectiveLevel)}
        </p>

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
