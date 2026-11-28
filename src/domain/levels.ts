import { type Member, type RiskLevel } from './types';
import { getBandForPm25 } from './config/bands';
import { DEFAULT_FALLBACK_RISK_LEVEL } from './config/thresholds';

/**
 * LEVEL_NAMES.
 */
export const LEVEL_NAMES: Record<RiskLevel, string> = {
  0: 'Clear',
  1: 'Watch',
  2: 'Caution',
  3: 'Protect',
  4: 'Severe for your household',
};

/**
 * Computes base risk level from PM2.5 physical concentration (µg/m³).
 * If PM2.5 is null, defaults to Level 2 (Caution) per Rule P-04.
 */
export function computeBaseLevel(pm25: number | null, region: 'IN' | 'US' = 'IN'): RiskLevel {
  if (pm25 === null || isNaN(pm25)) {
    return DEFAULT_FALLBACK_RISK_LEVEL;
  }
  return getBandForPm25(pm25, region);
}

/**
 * Sensitive members include:
 * - Children under 5 or 5-12
 * - Adults 65+
 * - Members with respiratory/COPD, heart conditions, pregnancy, or other documented sensitivity
 */
export function hasSensitiveMembers(members: Member[]): boolean {
  return members.some((m) => {
    if (m.ageGroup === 'u5' || m.ageGroup === '5-12' || m.ageGroup === '65+') {
      return true;
    }
    return m.flags.length > 0;
  });
}

/**
 * isRiskLevel.
 * @param val
 * @returns
 */
export function isRiskLevel(val: unknown): val is RiskLevel {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0 && val <= 4;
}

/**
 * clampToRiskLevel.
 * @param val
 * @returns
 */
export function clampToRiskLevel(val: number): RiskLevel {
  const clamped = Math.min(4, Math.max(0, Math.round(val)));
  if (clamped === 0) return 0;
  if (clamped === 1) return 1;
  if (clamped === 2) return 2;
  if (clamped === 3) return 3;
  return 4;
}

/**
 * Rule P-02: Effective level = base level + 1 if any sensitive member, capped at 4.
 * Outdoor-worker flag changes exposure guidance/emphasis, not the base household level.
 */
export function computeEffectiveLevel(baseLevel: RiskLevel, members: Member[]): RiskLevel {
  const isSensitive = hasSensitiveMembers(members);
  const adjusted = isSensitive ? baseLevel + 1 : baseLevel;
  return clampToRiskLevel(adjusted);
}

/**
 * Produces an actionable, sentence-case summary banner headline tailored to the effective risk level.
 */
export function getLevelHeadline(effectiveLevel: RiskLevel): string {
  switch (effectiveLevel) {
    case 0:
      return 'Air quality is clear. Ideal for normal outdoor ventilation and routine activities.';
    case 1:
      return 'Moderate air quality. Safe for most, but keep an eye on changing conditions.';
    case 2:
      return 'Caution advised. Sensitive members should reduce prolonged outdoor exertion.';
    case 3:
      return 'Air is at Protect level for your household today. Keep indoor air clean and limit time outside.';
    case 4:
      return 'Severe pollution conditions. Minimize outdoor exposure and maintain a clean indoor environment.';
  }
}

/**
 * Explains whether an extra vulnerability buffer was added to the base level to protect sensitive members.
 */
export function getLevelExplanation(effectiveLevel: RiskLevel, hasSensitive: boolean): string {
  const levelName = LEVEL_NAMES[effectiveLevel];
  if (hasSensitive && effectiveLevel > 0) {
    return `Assessed as ${levelName} for your household. An extra protection buffer is applied due to vulnerable members (children, seniors, or sensitive health flags).`;
  }
  return `Assessed as ${levelName} based on prevailing outdoor PM2.5 concentrations.`;
}

