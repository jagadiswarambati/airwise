import { RiskLevel } from '../types';

/**
 * Data freshness time windows in hours
 */
export const FRESH_THRESHOLD_HOURS = 3;
export const AGING_THRESHOLD_HOURS = 12;
export const STALE_THRESHOLD_HOURS = 48;

/**
 * Rule P-16 commute forecast shift threshold
 * Only recommend shifting commute timing if alternative window reduces PM2.5
 * by at least 5 µg/m³ AND by at least 15%.
 */
export const COMMUTE_DIFF_MIN_UGM3 = 5;
export const COMMUTE_DIFF_MIN_PERCENT = 0.15;

/**
 * Default carpooling vehicle occupancy assumption (occupants per vehicle)
 */
export const DEFAULT_CARPOOL_OCCUPANCY = 2;

/**
 * Default fallback risk level when air data is completely unavailable (P-04: Caution)
 */
export const DEFAULT_FALLBACK_RISK_LEVEL: RiskLevel = 2;

/**
 * Trend calculation minimum percentage and absolute delta thresholds
 */
export const TREND_CHANGE_MIN_PERCENT = 0.1; // 10%
export const TREND_CHANGE_MIN_UGM3 = 5; // 5 µg/m³

