/**
 * Master registry of all localStorage keys used by AirWise.
 * Enforces the airwise_ namespace prefix (SECURITY_PRIVACY.md §11).
 */
export const STORAGE_KEY_PROFILE = 'airwise_household_profile_v1';
/**
 * STORAGE_KEY_SCENARIO.
 */
export const STORAGE_KEY_SCENARIO = 'airwise_scenario_v1';
/**
 * STORAGE_KEY_SETTINGS.
 */
export const STORAGE_KEY_SETTINGS = 'airwise_settings_v1';
/**
 * STORAGE_KEY_MANUAL_SEVERE_MODE.
 */
export const STORAGE_KEY_MANUAL_SEVERE_MODE = 'airwise_manual_severe_mode';
/**
 * STORAGE_KEY_COMMUNITY_PLEDGE.
 */
export const STORAGE_KEY_COMMUNITY_PLEDGE = 'airwise_community_no_burning_pledge';
/**
 * STORAGE_PREFIX_AIR_CACHE.
 */
export const STORAGE_PREFIX_AIR_CACHE = 'airwise_air_cache_';

/**
 * ALL_STORAGE_KEYS.
 */
export const ALL_STORAGE_KEYS = [
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_SCENARIO,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_MANUAL_SEVERE_MODE,
  STORAGE_KEY_COMMUNITY_PLEDGE,
] as const;
