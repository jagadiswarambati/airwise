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

const AtmosphereSpecks: React.FC<{ specks: AtmosphereModel['specks'] }> = ({ specks }) => (
  <>
    {specks.map((speck) => {
      const speckStyle: React.CSSProperties = {
        ['--speck-x' as string]: speck.xPct,
        ['--speck-y' as string]: speck.yPct,
        ['--speck-size' as string]: speck.sizePx,
        ['--speck-duration' as string]: speck.durationS,
        ['--speck-delay' as string]: speck.delayS,
      } as React.CSSProperties;

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
      const streakStyle: React.CSSProperties = {
        ['--streak-top' as string]: streak.topPct,
        ['--streak-width' as string]: streak.widthPx,
        ['--streak-duration' as string]: streak.durationS,
        ['--streak-delay' as string]: streak.delayS,
      } as React.CSSProperties;

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

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const celestialStyle: React.CSSProperties = {
    ['--sun-x' as string]: model.sunXPct,
    ['--sun-y' as string]: model.sunYPct,
  } as React.CSSProperties;

  const ringStyle: React.CSSProperties = {
    ['--ring-opacity' as string]: model.discRingOpacity,
  } as React.CSSProperties;

  const haze1Style: React.CSSProperties = {
    ['--haze-1-opacity' as string]: model.hazeBandOpacities[0],
  } as React.CSSProperties;

  const haze2Style: React.CSSProperties = {
    ['--haze-2-opacity' as string]: model.hazeBandOpacities[1],
  } as React.CSSProperties;

  return (
    <div
      className="aw-atmosphere"
      aria-hidden="true"
      data-motion={model.enabled ? 'on' : 'off'}
      data-hidden={isVisible ? 'false' : 'true'}
    >
      <div className="aw-atmosphere-sky" data-phase={model.dayPhase} />

      <div className="aw-atmosphere-celestial" style={celestialStyle}>
        <div
          className={
            model.celestial === 'sun'
              ? 'aw-atmosphere-disc-sun'
              : 'aw-atmosphere-disc-moon'
          }
        >
          <div className="aw-atmosphere-ring" style={ringStyle} />
        </div>
      </div>

      <div
        className="aw-atmosphere-haze-band aw-atmosphere-haze-band-1"
        style={haze1Style}
      />
      <div
        className="aw-atmosphere-haze-band aw-atmosphere-haze-band-2"
        style={haze2Style}
      />

      <AtmosphereSpecks specks={model.specks} />
      <AtmosphereStreaks windStreaks={model.windStreaks} />
    </div>
  );
};
