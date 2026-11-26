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

/**
 * Curated online atmospheric video sources representing weather/air conditions based on result.
 * Videos loop seamlessly, muted and optimized for atmospheric background appearance.
 */
const RESULT_ATMOSPHERE_VIDEOS: Record<number, string> = {
  0: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  2: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  3: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  4: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
};

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

const AtmosphereVideo: React.FC<{ url: string; onError: () => void }> = ({
  url,
  onError,
}) => (
  <video
    key={url}
    className="aw-atmosphere-video"
    autoPlay
    loop
    muted
    playsInline
    aria-hidden="true"
    tabIndex={-1}
    onError={onError}
  >
    <source src={url} type="video/mp4" />
  </video>
);

const AtmosphereCelestial: React.FC<{
  celestial: 'sun' | 'moon';
  sunXPct: number;
  sunYPct: number;
  discRingOpacity: number;
}> = ({ celestial, sunXPct, sunYPct, discRingOpacity }) => {
  const celestialStyle: React.CSSProperties = {
    ['--sun-x' as string]: sunXPct,
    ['--sun-y' as string]: sunYPct,
  } as React.CSSProperties;

  const ringStyle: React.CSSProperties = {
    ['--ring-opacity' as string]: discRingOpacity,
  } as React.CSSProperties;

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
  const haze1Style: React.CSSProperties = {
    ['--haze-1-opacity' as string]: opacities[0],
  } as React.CSSProperties;

  const haze2Style: React.CSSProperties = {
    ['--haze-2-opacity' as string]: opacities[1],
  } as React.CSSProperties;

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
  const [videoError, setVideoError] = useState<boolean>(false);

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

  const videoUrl =
    level !== null
      ? RESULT_ATMOSPHERE_VIDEOS[level] || RESULT_ATMOSPHERE_VIDEOS[0]
      : RESULT_ATMOSPHERE_VIDEOS[0];

  return (
    <div
      className="aw-atmosphere"
      aria-hidden="true"
      data-motion={model.enabled ? 'on' : 'off'}
      data-hidden={isVisible ? 'false' : 'true'}
    >
      <div className="aw-atmosphere-sky" data-phase={model.dayPhase} />

      {/* Dynamic atmospheric online video overlay based on result */}
      {model.enabled && !videoError && (
        <AtmosphereVideo url={videoUrl} onError={() => setVideoError(true)} />
      )}

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
