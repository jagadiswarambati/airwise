import { type RiskLevel } from '../../domain/types';

export type DayPhase = 'day' | 'dusk' | 'night';
export type CelestialType = 'sun' | 'moon';

export interface SpeckConfig {
  id: number;
  xPct: number;
  yPct: number;
  sizePx: number;
  durationS: number;
  delayS: number;
}

export interface WindStreakConfig {
  id: number;
  topPct: number;
  widthPx: number;
  durationS: number;
  delayS: number;
}

export interface AtmosphereModelInput {
  level: RiskLevel | null;
  localHour: number; // 0..23
  windKmh?: number;
  enabled: boolean;
  isFallback?: boolean;
}

export interface AtmosphereModel {
  dayPhase: DayPhase;
  celestial: CelestialType;
  sunXPct: number;
  sunYPct: number;
  discRingOpacity: number;
  hazeBandOpacities: [number, number];
  specks: SpeckConfig[];
  windStreaks: WindStreakConfig[];
  enabled: boolean;
  isNeutral: boolean;
}

/**
 * Determines day phase from local hour.
 * Spec: 06-17 day, 17-19 and 05-06 dusk, else night.
 */
export function computeDayPhase(localHour: number): DayPhase {
  const h = ((localHour % 24) + 24) % 24;
  if (h >= 6 && h < 17) {
    return 'day';
  }
  if ((h >= 17 && h < 19) || (h >= 5 && h < 6)) {
    return 'dusk';
  }
  return 'night';
}

/**
 * Computes celestial body type and arc position (0..100%).
 */
export function computeCelestialPosition(
  localHour: number,
  dayPhase: DayPhase,
): { celestial: CelestialType; sunXPct: number; sunYPct: number } {
  const h = ((localHour % 24) + 24) % 24;

  if (dayPhase === 'night') {
    // Night spans roughly 19:00 to 05:00 (10 hours)
    const nightProgress = h >= 19 ? (h - 19) / 10 : (h + 5) / 10;
    const clamped = Math.max(0, Math.min(1, nightProgress));
    const sunXPct = Math.round(15 + clamped * 70);
    const sunYPct = Math.round(50 - Math.sin(clamped * Math.PI) * 28);
    return { celestial: 'moon', sunXPct, sunYPct };
  }

  // Day or dusk spans 05:00 to 19:00 (14 hours)
  const dayProgress = Math.max(0, Math.min(1, (h - 5) / 14));
  const sunXPct = Math.round(10 + dayProgress * 80);
  const sunYPct = Math.round(55 - Math.sin(dayProgress * Math.PI) * 35);
  return { celestial: 'sun', sunXPct, sunYPct };
}

/**
 * Computes disc ring opacity. Dimmer as level rises, never hidden.
 * Spec: disc ring opacity falls as level rises.
 */
export function computeDiscRingOpacity(level: RiskLevel | null, isNeutral: boolean): number {
  if (isNeutral || level === null) {
    return 0.75;
  }
  // Level 0: 0.85, 1: 0.70, 2: 0.55, 3: 0.40, 4: 0.25
  const opacities = [0.85, 0.7, 0.55, 0.4, 0.25];
  return opacities[level] ?? 0.5;
}

/**
 * Computes haze band opacities.
 * Spec: [0, 0.15, 0.3, 0.45, 0.6] by level.
 */
export function computeHazeOpacities(
  level: RiskLevel | null,
  isNeutral: boolean,
): [number, number] {
  if (isNeutral || level === null) {
    return [0, 0];
  }
  const BASE_OPACITIES: [number, number][] = [
    [0, 0],
    [0.15, 0.12],
    [0.3, 0.24],
    [0.45, 0.36],
    [0.6, 0.48],
  ];
  return BASE_OPACITIES[level] || [0, 0];
}

/**
 * Computes deterministic specks list.
 * Spec: count [0, 4, 8, 14, 22] by level, duration 14-30 s.
 */
export function computeSpecks(level: RiskLevel | null, isNeutral: boolean): SpeckConfig[] {
  if (isNeutral || level === null) {
    return [];
  }
  const SPECK_COUNTS = [0, 4, 8, 14, 22];
  const count = SPECK_COUNTS[level] || 0;
  const specks: SpeckConfig[] = [];

  for (let i = 0; i < count; i++) {
    const xPct = Math.round(((i * 47 + 13) % 90) + 5);
    const yPct = Math.round(((i * 31 + 19) % 76) + 12);
    let sizePx = 1.5;
    if (i % 3 === 0) {
      sizePx = 3;
    } else if (i % 2 === 0) {
      sizePx = 2;
    }
    const durationS = 14 + ((i * 7) % 17); // 14s .. 30s
    const delayS = Math.round((((i * 5) % 11) * 0.7) * 10) / 10;
    specks.push({ id: i, xPct, yPct, sizePx, durationS, delayS });
  }

  return specks;
}

/**
 * Computes wind streaks when windKmh >= 15.
 * Spec: up to 3 thin lines only when windKmh >= 15; speed scales with wind.
 */
export function computeWindStreaks(windKmh?: number): WindStreakConfig[] {
  if (windKmh === undefined || windKmh === null || windKmh < 15) {
    return [];
  }

  let count = 1;
  if (windKmh >= 40) {
    count = 3;
  } else if (windKmh >= 25) {
    count = 2;
  }

  const clampedWind = Math.min(80, Math.max(15, windKmh));
  const baseDurationS = Math.round((5.0 - ((clampedWind - 15) / (80 - 15)) * 3.5) * 10) / 10;

  const tops = [26, 52, 74];
  const widths = [130, 190, 150];
  const streaks: WindStreakConfig[] = [];

  for (let i = 0; i < count; i++) {
    streaks.push({
      id: i,
      topPct: tops[i],
      widthPx: widths[i],
      durationS: Math.round((baseDurationS + i * 0.4) * 10) / 10,
      delayS: Math.round((i * 0.6) * 10) / 10,
    });
  }

  return streaks;
}

/**
 * Pure function computing the complete Atmosphere presentation model.
 */
export function computeAtmosphereModel(input: AtmosphereModelInput): AtmosphereModel {
  const isNeutral = input.level === null || input.isFallback === true;
  const dayPhase = computeDayPhase(input.localHour);
  const { celestial, sunXPct, sunYPct } = computeCelestialPosition(input.localHour, dayPhase);
  const discRingOpacity = computeDiscRingOpacity(input.level, isNeutral);
  const hazeBandOpacities = computeHazeOpacities(input.level, isNeutral);
  const specks = computeSpecks(input.level, isNeutral);
  const windStreaks = computeWindStreaks(input.windKmh);

  return {
    dayPhase,
    celestial,
    sunXPct,
    sunYPct,
    discRingOpacity,
    hazeBandOpacities,
    specks,
    windStreaks,
    enabled: input.enabled,
    isNeutral,
  };
}
