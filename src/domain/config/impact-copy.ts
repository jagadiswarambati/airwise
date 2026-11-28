/**
 * Authoritative methodology and formula descriptions (IMPACT_METHODOLOGY.md).
 * No raw formulas are typed directly into JSX components.
 */

export const FORMULA_E1_TITLE = 'Formula E1 — Avoided Vehicle-Kilometers (vkm):';
/**
 * FORMULA_E1_SUMMARY.
 */
export const FORMULA_E1_SUMMARY =
  'Avoided vehicle-kilometers are estimated from self-reported round trips and one-way distance for motorized modes (car, two-wheeler, auto-rickshaw).';
/**
 * FORMULA_E1_EQUATIONS.
 */
export const FORMULA_E1_EQUATIONS = [
  'Skipped or remote trip: vkm = oneWayKm × 2 × tripsAvoided',
  'Carpool: vkm = oneWayKm × 2 × tripsAvoided × (1 − 1 / occupancy)',
];
/**
 * FORMULA_E1_ASSUMPTIONS.
 */
export const FORMULA_E1_ASSUMPTIONS = [
  'Commute distances and trips per week are as entered in your household profile.',
  'Default carpool occupancy is 2 persons per shared vehicle unless customized.',
  'Qualitative trip reductions (combining errands, anti-idling, walking) do not add numeric estimates.',
];

/**
 * FORMULA_X1_TITLE.
 */
export const FORMULA_X1_TITLE = 'Formula X1 — Commute Exposure Delta:';
/**
 * FORMULA_X1_SUMMARY.
 */
export const FORMULA_X1_SUMMARY =
  'Compares average outdoor PM2.5 in your usual commute window against candidate 1-hour shifts (up to ±2 hours) using hourly forecast data.';
/**
 * FORMULA_X1_EQUATION.
 */
export const FORMULA_X1_EQUATION =
  'Δ = mean(PM2.5 over usual window) − mean(PM2.5 over shifted window)';
/**
 * FORMULA_X1_ASSUMPTIONS.
 */
export const FORMULA_X1_ASSUMPTIONS = [
  'Requires at least 5 µg/m³ difference and 15% relative improvement to show.',
  'Window averages reflect regional modeled surface data (~25 km grid).',
];

/**
 * FORMULA_C1_TITLE.
 */
export const FORMULA_C1_TITLE = 'Formula C1 — Community Aggregate Vehicle-Kilometers:';
/**
 * FORMULA_C1_SUMMARY.
 */
export const FORMULA_C1_SUMMARY =
  'Calculates collective weekly avoided vehicle-kilometers across all participating households in the residential community.';
/**
 * FORMULA_C1_EQUATION.
 */
export const FORMULA_C1_EQUATION =
  'C1 = Seeded Baseline (18 carpooling households × 24 vkm) + Your Household E1 Contribution';
/**
 * FORMULA_C1_ASSUMPTIONS.
 */
export const FORMULA_C1_ASSUMPTIONS = [
  'Combines fixed, documented demo community parameters with your profile contribution.',
  'Assumes participating households maintain their pledged travel patterns.',
];

/**
 * DUAL_AXIS_PHILOSOPHY.
 */
export const DUAL_AXIS_PHILOSOPHY = {
  exposureTitle: 'Exposure Axis (Inhaled)',
  exposureDesc:
    'What you and your family inhale. Focuses on filtration, scheduling, and indoor sanctuaries.',
  emissionsTitle: 'Emissions Axis (Caused)',
  emissionsDesc:
    'What your household emits. Focuses on vehicle trips avoided, carpooling, and anti-idling.',
  boundaryNote:
    'Protecting yourself from dirty air does not clean the outdoors, and lowering vehicle emissions does not instantly lower ambient pollution outside your window.',
};
