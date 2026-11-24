import React from 'react';
import { AirSnapshot, RiskLevel } from '../../domain/types';
import { RiskBadge } from './RiskBadge';
import { Badge } from '../primitives';

interface AirBriefingCardProps {
  snapshot: AirSnapshot;
  effectiveLevel: RiskLevel;
}

export const AirBriefingCard: React.FC<AirBriefingCardProps> = ({ snapshot, effectiveLevel }) => {
  const pm25Now = snapshot.pm25.now;
  const aqi = snapshot.aqi;

  const trendLabels = {
    rising: 'Rising',
    falling: 'Falling',
    steady: 'Steady',
    unknown: 'Trend unknown',
  };

  return (
    <section className="card" aria-label="Current Air Quality Briefing">
      <div className="card-header">
        <span className="card-title">Air Briefing</span>
        <div className="briefing-badges">
          <Badge type="freshness" variant={snapshot.freshness}>
            {snapshot.freshness === 'fresh'
              ? 'Fresh'
              : snapshot.freshness === 'aging'
                ? 'Aging'
                : 'Stale data'}
          </Badge>
          <Badge type="data-type">
            {snapshot.source.dataType === 'sample' ? 'Sample' : 'Modelled'}
          </Badge>
        </div>
      </div>

      <div className="briefing-main">
        <div>
          <div className="pm25-reading">
            <span className="pm25-val">{pm25Now !== null ? Math.round(pm25Now) : '—'}</span>
            <span className="pm25-unit">µg/m³ PM2.5</span>
          </div>
          {aqi && (
            <div className="aqi-reading">
              AQI {aqi.value} ({aqi.standard} standard)
            </div>
          )}
        </div>

        <div className="briefing-meta">
          <RiskBadge level={effectiveLevel} />
          <div className="trend-badge">
            <span>{trendLabels[snapshot.trend]}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
