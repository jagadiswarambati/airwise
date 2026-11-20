import { HouseholdProfile, AirSnapshot } from '../../src/domain/types';

/**
 * Persona: Priya, 34
 * Working parent, child (7) with asthma, elder (68).
 * Budget: low, window AC, no purifier, LPG with no exhaust.
 */
export const PRIYA_PROFILE: HouseholdProfile = {
  schemaVersion: 1,
  location: { label: 'Hyderabad, India', lat: 17.38, lon: 78.48, country: 'IN' },
  members: [
    { id: 'm1', roleLabel: 'Adult, 34', ageGroup: '18-64', flags: [] },
    { id: 'm2', roleLabel: 'Child, 7', ageGroup: '5-12', flags: ['asthma_copd'] },
    { id: 'm3', roleLabel: 'Adult, 68', ageGroup: '65+', flags: [] },
  ],
  housing: { tenure: 'rent', type: 'apartment' },
  cooking: { fuel: 'lpg', hasExhaust: false },
  homeHeating: 'none',
  equipment: { purifier: false, windowAC: true, hvac: false },
  budget: 'low',
  travel: {
    modes: ['two_wheeler', 'car'],
    oneWayKm: 12,
    tripsPerWeek: 5,
    canShiftTime: true,
    canWorkRemotely: true,
    transitAvailable: true,
    outdoorWorker: false,
  },
  routine: {
    wake: '06:00',
    leave: '07:30',
    returnHome: '17:30',
    cooking: ['07:00', '19:30'],
    bed: '22:00',
  },
};

/**
 * Healthy young adult profile (single, flexible budget, metro commuter)
 */
export const HEALTHY_ADULT_PROFILE: HouseholdProfile = {
  schemaVersion: 1,
  location: { label: 'Delhi, India', lat: 28.61, lon: 77.21, country: 'IN' },
  members: [{ id: 'm1', roleLabel: 'Adult, 28', ageGroup: '18-64', flags: [] }],
  housing: { tenure: 'rent', type: 'apartment' },
  cooking: { fuel: 'electric', hasExhaust: true },
  homeHeating: 'electric',
  equipment: { purifier: true, windowAC: false, hvac: false },
  budget: 'flexible',
  travel: {
    modes: ['metro_rail', 'walk'],
    oneWayKm: 8,
    tripsPerWeek: 5,
    canShiftTime: false,
    canWorkRemotely: false,
    transitAvailable: true,
    outdoorWorker: false,
  },
  routine: {
    wake: '07:00',
    leave: '08:30',
    returnHome: '18:30',
    cooking: ['20:00'],
    bed: '23:30',
  },
};

/**
 * Free-budget vulnerable family with combustion heating & biomass cooking (P-22 test)
 */
export const COMBUSTION_HEATING_PROFILE: HouseholdProfile = {
  schemaVersion: 1,
  location: { label: 'Rural North India', lat: 29.5, lon: 76.8, country: 'IN' },
  members: [
    { id: 'm1', roleLabel: 'Adult, 40', ageGroup: '18-64', flags: [] },
    { id: 'm2', roleLabel: 'Infant, 2', ageGroup: 'u5', flags: [] },
  ],
  housing: { tenure: 'own', type: 'house' },
  cooking: { fuel: 'biomass', hasExhaust: false },
  homeHeating: 'combustion', // angithi / unvented stove
  equipment: { purifier: false, windowAC: false, hvac: false },
  budget: 'free',
  travel: {
    modes: ['cycle', 'walk'],
    oneWayKm: 4,
    tripsPerWeek: 6,
    canShiftTime: false,
    canWorkRemotely: false,
    transitAvailable: false,
    outdoorWorker: true,
  },
  routine: {
    wake: '05:30',
    leave: '07:00',
    returnHome: '17:00',
    cooking: ['06:00', '18:00'],
    bed: '21:00',
  },
};

/**
 * Generates an hourly air quality forecast series around a baseline PM2.5 concentration
 */
export function generateHourlySeries(basePm25: number): Array<{ time: string; pm25: number; aqi?: number }> {
  const result = [];
  const baseTime = new Date('2026-11-20T00:00:00.000Z');

  for (let i = 0; i < 24; i++) {
    const t = new Date(baseTime.getTime() + i * 3600 * 1000);
    // Diurnal variation: higher early morning & evening, cleaner midday
    let factor = 1.0;
    if (i >= 6 && i <= 9) factor = 1.25; // morning rush + inversion
    else if (i >= 12 && i <= 16) factor = 0.75; // afternoon dispersion
    else if (i >= 19 && i <= 23) factor = 1.3; // evening peak

    const pm25 = Math.round(basePm25 * factor * 10) / 10;
    result.push({
      time: t.toISOString(),
      pm25,
      aqi: Math.min(500, Math.round(pm25 * 1.5)),
    });
  }

  return result;
}

export function createSnapshot(
  nowPm25: number | null,
  freshness: 'fresh' | 'aging' | 'stale' | 'none' = 'fresh',
  dataType: 'modelled' | 'observed' | 'sample' = 'modelled',
): AirSnapshot {
  const hourly = nowPm25 !== null ? generateHourlySeries(nowPm25) : [];
  const fetchedAt =
    freshness === 'fresh'
      ? new Date().toISOString()
      : freshness === 'aging'
        ? new Date(Date.now() - 6 * 3600 * 1000).toISOString()
        : freshness === 'stale'
          ? new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          : new Date(Date.now() - 72 * 3600 * 1000).toISOString();

  return {
    pm25: {
      now: nowPm25,
      hourly,
    },
    trend: 'steady',
    observedAt: fetchedAt,
    fetchedAt,
    source: {
      id: 'open-meteo',
      name: 'Open-Meteo Air Quality',
      dataType,
      resolutionNote: 'CAMS global atmospheric model ~25km grid',
    },
    freshness,
  };
}

