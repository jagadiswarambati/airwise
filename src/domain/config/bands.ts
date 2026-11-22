import { RiskLevel } from '../types';

export interface BandBreakpoint {
  max: number; // Upper bound (inclusive)
  level: RiskLevel;
  name: string;
  officialCategory: string;
}

export interface RegionBandProfile {
  region: 'IN' | 'US';
  name: string;
  sourceNote: string;
  verified: boolean;
  bands: BandBreakpoint[];
}

/**
 * India default profile aligned with CPCB PM2.5 categories:
 * <= 30: Good (Level 0: Clear)
 * 31 - 60: Satisfactory (Level 1: Watch)
 * 61 - 90: Moderate (Level 2: Caution)
 * 91 - 120: Poor (Level 3: Protect)
 * >= 121: Very Poor / Severe (Level 4: Severe for your household)
 */
export const INDIA_CPCB_BANDS: RegionBandProfile = {
  region: 'IN',
  name: 'CPCB (India)',
  sourceNote: 'CPCB National Air Quality Index breakpoints for 24h PM2.5 (µg/m³).',
  verified: true,
  bands: [
    { max: 30.0, level: 0, name: 'Clear', officialCategory: 'Good' },
    { max: 60.0, level: 1, name: 'Watch', officialCategory: 'Satisfactory' },
    { max: 90.0, level: 2, name: 'Caution', officialCategory: 'Moderate' },
    { max: 120.0, level: 3, name: 'Protect', officialCategory: 'Poor' },
    { max: Infinity, level: 4, name: 'Severe for your household', officialCategory: 'Very Poor / Severe' },
  ],
};

/**
 * US EPA profile aligned with revised 2024 PM2.5 annual and 24h standards:
 * <= 9.0: Good (Level 0: Clear)
 * 9.1 - 35.4: Moderate (Level 1: Watch)
 * 35.5 - 55.4: USG (Level 2: Caution)
 * 55.5 - 125.4: Unhealthy (Level 3: Protect)
 * >= 125.5: Very Unhealthy / Hazardous (Level 4: Severe for your household)
 */
export const US_EPA_BANDS: RegionBandProfile = {
  region: 'US',
  name: 'US EPA',
  sourceNote: 'US EPA 2024 PM2.5 Breakpoints (µg/m³).',
  verified: true,
  bands: [
    { max: 9.0, level: 0, name: 'Clear', officialCategory: 'Good' },
    { max: 35.4, level: 1, name: 'Watch', officialCategory: 'Moderate' },
    { max: 55.4, level: 2, name: 'Caution', officialCategory: 'Unhealthy for Sensitive Groups' },
    { max: 125.4, level: 3, name: 'Protect', officialCategory: 'Unhealthy' },
    { max: Infinity, level: 4, name: 'Severe for your household', officialCategory: 'Very Unhealthy / Hazardous' },
  ],
};

export function getBandProfile(region: 'IN' | 'US' = 'IN'): RegionBandProfile {
  return region === 'US' ? US_EPA_BANDS : INDIA_CPCB_BANDS;
}

export function getBandForPm25(pm25: number, region: 'IN' | 'US' = 'IN'): RiskLevel {
  if (pm25 < 0) {
    return 0; // Safeguard negative sensor glitches to clean baseline
  }
  const profile = getBandProfile(region);
  for (const band of profile.bands) {
    if (pm25 <= band.max) {
      return band.level;
    }
  }
  return 4;
}

export function getBandBreakpointInfo(level: RiskLevel, region: 'IN' | 'US' = 'IN'): BandBreakpoint {
  const profile = getBandProfile(region);
  const found = profile.bands.find((b) => b.level === level);
  return found || profile.bands[profile.bands.length - 1];
}

/**
 * Returns the upper threshold (inclusive) for Level 1 (Watch).
 * Air at or below this concentration qualifies for ventilation windows and outdoor active travel.
 * Returns 60.0 µg/m³ for India (CPCB Satisfactory) and 35.4 µg/m³ for US (EPA Moderate).
 */
export function getLevel1Threshold(region: 'IN' | 'US' = 'IN'): number {
  const profile = getBandProfile(region);
  const band1 = profile.bands.find((b) => b.level === 1);
  return band1 ? band1.max : 60.0;
}


