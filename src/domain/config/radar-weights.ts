import { AgeGroup, Flag, Mode, SlotId } from '../types';

/**
 * Member age vulnerability weights
 * Under-5 and 65+ carry higher physiological sensitivity
 */
export const AGE_WEIGHTS: Record<AgeGroup, number> = {
  u5: 3,
  '65+': 3,
  '5-12': 2,
  '13-17': 1,
  '18-64': 1,
};

/**
 * Health flag sensitivity weights
 * Respiratory and cardiovascular conditions carry highest weight
 */
export const FLAG_WEIGHTS: Record<Flag, number> = {
  asthma_copd: 4,
  heart: 4,
  pregnancy: 3,
  other_sensitivity: 2,
};

/**
 * Calculate member vulnerability weight according to Decision A-27:
 * member weight = max(ageWeight, ...flagWeights) — no summing.
 */
export function calculateMemberWeight(ageGroup: AgeGroup, flags: Flag[]): number {
  let maxWeight = AGE_WEIGHTS[ageGroup] || 1;
  for (const flag of flags) {
    const flagWeight = FLAG_WEIGHTS[flag] || 0;
    if (flagWeight > maxWeight) {
      maxWeight = flagWeight;
    }
  }
  return maxWeight;
}

/**
 * Baseline slot exposure multiplier based on time-of-day routine
 */
export const SLOT_OUTDOOR_FACTORS: Record<SlotId, number> = {
  'early-morning': 1.2,
  'commute-out': 1.5,
  daytime: 1.0,
  'commute-back': 1.5,
  evening: 1.3,
  night: 0.8,
};

/**
 * Mode of travel exposure multiplier
 * Direct outdoor exertion (walking/cycling) increases respiratory uptake
 */
export const MODE_EXPOSURE_FACTORS: Record<Mode, number> = {
  walk: 2.0,
  cycle: 2.0,
  two_wheeler: 1.8,
  auto_rickshaw: 1.5,
  bus: 1.3,
  metro_rail: 1.1,
  car: 1.0,
};

