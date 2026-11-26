import { useState, useEffect, useMemo } from 'react';
import { type HouseholdProfile, HouseholdProfileSchema, roleLabelFor } from '../domain/types';
import { STORAGE_KEY_PROFILE } from './keys';
import { getSettings, setSettings, type AirWiseSettings } from './settingsStore';
import { warn as logWarn } from '../lib/logger';

export const PROFILE_STORAGE_KEY = STORAGE_KEY_PROFILE;

/**
 * Priya's household preset:
 * Working parent, child with asthma, elder, rented 2BHK, window AC,
 * no purifier, LPG with no exhaust, low budget tier (Decision A-36 standard role labels).
 */
export const PRIYA_PRESET: HouseholdProfile = {
  schemaVersion: 1,
  location: { label: 'Hyderabad, India', lat: 17.38, lon: 78.48, country: 'IN' },
  members: [
    { id: 'm1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
    { id: 'm2', roleLabel: 'Child 5-12', ageGroup: '5-12', flags: ['asthma_copd'] },
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
let cachedRawJson: string | null = null;
let cachedProfile: HouseholdProfile | null = null;
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
    if (!raw) {
      cachedRawJson = null;
      cachedProfile = null;
      return inMemoryProfile;
    }

    if (raw === cachedRawJson && cachedProfile !== null) {
      return cachedProfile;
    }

    const parsed = JSON.parse(raw);
    const validated = HouseholdProfileSchema.safeParse(parsed);
    if (validated.success) {
      // Normalise member roleLabels on read (Decision A-36)
      const normalised: HouseholdProfile = {
        ...validated.data,
        members: validated.data.members.map((m) => ({
          ...m,
          roleLabel: roleLabelFor(m),
        })),
      };
      cachedRawJson = raw;
      cachedProfile = normalised;
      inMemoryProfile = normalised;
      return normalised;
    } else {
      cachedRawJson = null;
      cachedProfile = null;
      logWarn('Stored profile corrupted, resetting storage', validated.error.name);
      deleteProfile();
      return null;
    }
  } catch (_e) {
    return inMemoryProfile;
  }
}

export function saveProfile(profile: HouseholdProfile): void {
  const normalised: HouseholdProfile = {
    ...profile,
    members: profile.members.map((m) => ({
      ...m,
      roleLabel: roleLabelFor(m),
    })),
  };
  const validated = HouseholdProfileSchema.parse(normalised);
  inMemoryProfile = validated;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const jsonStr = JSON.stringify(validated);
      window.localStorage.setItem(PROFILE_STORAGE_KEY, jsonStr);
      cachedRawJson = jsonStr;
      cachedProfile = validated;
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'StorageError';
    logWarn('Failed to save profile to localStorage', errorName);
  }

  notifyListeners();
}

export function deleteProfile(): void {
  inMemoryProfile = null;
  cachedRawJson = null;
  cachedProfile = null;
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

export interface ProfileExportPayload {
  schemaVersion: 1;
  profile: HouseholdProfile;
  settings?: AirWiseSettings;
}

export function exportProfileJson(): string {
  const profile = getProfile();
  if (!profile) throw new Error('No profile available to export');
  const settings = getSettings();
  const payload: ProfileExportPayload = {
    schemaVersion: 1,
    profile,
    settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function importProfileJson(jsonStr: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    // Allow either export envelope ({ schemaVersion: 1, profile, settings }) or raw profile
    const rawProfile = parsed && typeof parsed === 'object' && 'profile' in parsed ? parsed.profile : parsed;
    const result = HouseholdProfileSchema.safeParse(rawProfile);
    if (!result.success) {
      return { success: false, error: 'Invalid profile format or missing required fields' };
    }
    saveProfile(result.data);

    if (parsed && typeof parsed === 'object' && 'settings' in parsed && parsed.settings) {
      if (typeof parsed.settings.aiEnabled === 'boolean') {
        setSettings({ aiEnabled: parsed.settings.aiEnabled });
      }
    }

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

  return useMemo(
    () => ({
      profile,
      save: saveProfile,
      remove: deleteProfile,
      loadPriya: loadPriyaPreset,
    }),
    [profile],
  );
}

