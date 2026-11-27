import React, { useState, useEffect, useMemo } from 'react';
import { type RiskLevel } from '../../domain/types';
import { computeAtmosphereModel, type AtmosphereModel } from './model';
import './atmosphere.css';

export interface AtmosphereProps {
  level: RiskLevel | null;
  localHour: number;
  windKmh?: number;
  enabled: boolean;
  isFallback?: boolean;
}

function cssVars(vars: Record<`--${string}`, string | number>): React.CSSProperties {
  // React.CSSProperties does not include CSS custom properties (`--*`) in its index signature.
  return vars as React.CSSProperties;
}

const AtmosphereSpecks: React.FC<{ specks: AtmosphereModel['specks'] }> = ({ specks }) => (
  <>
    {specks.map((speck) => {
      const speckStyle = cssVars({
        '--speck-x': speck.xPct,
        '--speck-y': speck.yPct,
        '--speck-size': speck.sizePx,
        '--speck-duration': speck.durationS,
        '--speck-delay': speck.delayS,
      });

      return (
        <div
          key={speck.id}
          className="aw-atmosphere-speck"
          style={speckStyle}
        />
      );
    })}
  </>
);

const AtmosphereStreaks: React.FC<{ windStreaks: AtmosphereModel['windStreaks'] }> = ({
  windStreaks,
}) => (
  <>
    {windStreaks.map((streak) => {
      const streakStyle = cssVars({
        '--streak-top': streak.topPct,
        '--streak-width': streak.widthPx,
        '--streak-duration': streak.durationS,
        '--streak-delay': streak.delayS,
      });

      return (
        <div
          key={streak.id}
          className="aw-atmosphere-streak"
          style={streakStyle}
        />
      );
    })}
  </>
);

const AtmosphereCelestial: React.FC<{
  celestial: 'sun' | 'moon';
  sunXPct: number;
  sunYPct: number;
  discRingOpacity: number;
}> = ({ celestial, sunXPct, sunYPct, discRingOpacity }) => {
  const celestialStyle = cssVars({
    '--sun-x': sunXPct,
    '--sun-y': sunYPct,
  });

  const ringStyle = cssVars({
    '--ring-opacity': discRingOpacity,
  });

  return (
    <div className="aw-atmosphere-celestial" style={celestialStyle}>
      <div
        className={
          celestial === 'sun'
            ? 'aw-atmosphere-disc-sun'
            : 'aw-atmosphere-disc-moon'
        }
      >
        <div className="aw-atmosphere-ring" style={ringStyle} />
      </div>
    </div>
  );
};

const AtmosphereHaze: React.FC<{ opacities: [number, number] }> = ({ opacities }) => {
  const haze1Style = cssVars({
    '--haze-1-opacity': opacities[0],
  });

  const haze2Style = cssVars({
    '--haze-2-opacity': opacities[1],
  });

  return (
    <>
      <div className="aw-atmosphere-haze-band aw-atmosphere-haze-band-1" style={haze1Style} />
      <div className="aw-atmosphere-haze-band aw-atmosphere-haze-band-2" style={haze2Style} />
    </>
  );
};

export const Atmosphere: React.FC<AtmosphereProps> = ({
  level,
  localHour,
  windKmh,
  enabled,
  isFallback = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const model = useMemo(
    () =>
      computeAtmosphereModel({
        level,
        localHour,
        windKmh,
        enabled,
        isFallback,
      }),
    [level, localHour, windKmh, enabled, isFallback],
  );

  return (
    <div
      className="aw-atmosphere"
      aria-hidden="true"
      data-motion={model.enabled ? 'on' : 'off'}
      data-hidden={isVisible ? 'false' : 'true'}
    >
      <div className="aw-atmosphere-sky" data-phase={model.dayPhase} />

      <AtmosphereCelestial
        celestial={model.celestial}
        sunXPct={model.sunXPct}
        sunYPct={model.sunYPct}
        discRingOpacity={model.discRingOpacity}
      />

      <AtmosphereHaze opacities={model.hazeBandOpacities} />
      <AtmosphereSpecks specks={model.specks} />
      <AtmosphereStreaks windStreaks={model.windStreaks} />
    </div>
  );
};
