import { useState, useEffect } from 'react';
import { HouseholdProfile, HouseholdProfileSchema } from '../domain/types';

export const PROFILE_STORAGE_KEY = 'airwise_household_profile_v1';

/**
 * Priya's household preset:
 * Working parent, child (7) with asthma, elder (68), rented 2BHK, window AC,
 * no purifier, LPG with no exhaust, low budget tier.
 */
export const PRIYA_PRESET: HouseholdProfile = {
  schemaVersion: 1,
  location: { label: 'Hyderabad, India', lat: 17.38, lon: 78.48, country: 'IN' },
  members: [
    { id: 'm1', roleLabel: 'Adult, 34', ageGroup: '18-64', flags: [] },
    { id: 'm2', roleLabel: 'Child, 7', ageGroup: '5-12', flags: ['asthma_copd'] },
    { id: 'm3', roleLabel: 'Adult 65+', ageGroup: '65+', flags: [] },
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

let inMemoryProfile: HouseholdProfile | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getProfile(): HouseholdProfile | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryProfile;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return inMemoryProfile;

    const parsed = JSON.parse(raw);
    const validated = HouseholdProfileSchema.safeParse(parsed);
    if (validated.success) {
      inMemoryProfile = validated.data;
      return validated.data;
    } else {
      console.warn('Stored profile corrupted, resetting storage:', validated.error);
      deleteProfile();
      return null;
    }
  } catch (_e) {
    return inMemoryProfile;
  }
}

export function saveProfile(profile: HouseholdProfile): void {
  const validated = HouseholdProfileSchema.parse(profile);
  inMemoryProfile = validated;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(validated));
    }
  } catch (error) {
    console.warn('Failed to save profile to localStorage:', error);
  }

  notifyListeners();
}

export function deleteProfile(): void {
  inMemoryProfile = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  } catch (_e) {
    // Ignore cleanup errors
  }
  notifyListeners();
}

export function hasProfile(): boolean {
  return getProfile() !== null;
}

export function exportProfileJson(): string {
  const profile = getProfile();
  if (!profile) throw new Error('No profile available to export');
  return JSON.stringify(profile, null, 2);
}

export function importProfileJson(jsonStr: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = HouseholdProfileSchema.safeParse(parsed);
    if (!result.success) {
      return { success: false, error: 'Invalid profile format or missing required fields' };
    }
    saveProfile(result.data);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}

export function loadPriyaPreset(): HouseholdProfile {
  saveProfile(PRIYA_PRESET);
  return PRIYA_PRESET;
}

export function useProfile(): {
  profile: HouseholdProfile | null;
  save: (p: HouseholdProfile) => void;
  remove: () => void;
  loadPriya: () => void;
} {
  const [profile, setProfileState] = useState<HouseholdProfile | null>(() => getProfile());

  useEffect(() => {
    const update = () => setProfileState(getProfile());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    profile,
    save: saveProfile,
    remove: deleteProfile,
    loadPriya: loadPriyaPreset,
  };
}

