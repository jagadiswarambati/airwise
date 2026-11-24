import { describe, it, expect, beforeEach } from 'vitest';
import { roleLabelFor, type HouseholdProfile } from '../../src/domain/types';
import { getProfile } from '../../src/state/profileStore';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
};

(globalThis as unknown as { window: unknown }).window = {
  localStorage: mockLocalStorage,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;

describe('Member Role Label & Normalization (Decision A-36)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('roleLabelFor maps all AgeGroup values to standard privacy-preserving labels', () => {
    expect(roleLabelFor({ ageGroup: 'u5' })).toBe('Infant under 5');
    expect(roleLabelFor({ ageGroup: '5-12' })).toBe('Child 5-12');
    expect(roleLabelFor({ ageGroup: '13-17' })).toBe('Teen 13-17');
    expect(roleLabelFor({ ageGroup: '18-64' })).toBe('Adult 18-64');
    expect(roleLabelFor({ ageGroup: '65+' })).toBe('Adult 65+');
  });

  it('normalises stored member roleLabels upon reading from localStorage', () => {
    // Simulate legacy profile in localStorage with exact ages or custom names
    const legacyProfile: HouseholdProfile = {
      ...PRIYA_PROFILE,
      members: [
        { id: '1', roleLabel: 'Child, 8', ageGroup: '5-12', flags: [] },
        { id: '2', roleLabel: 'Elderly, 72', ageGroup: '65+', flags: [] },
        { id: '3', roleLabel: 'Priya', ageGroup: '18-64', flags: [] },
      ],
    };

    localStorage.setItem('airwise_household_profile_v1', JSON.stringify(legacyProfile));

    const loaded = getProfile();
    expect(loaded).not.toBeNull();
    expect(loaded!.members[0].roleLabel).toBe('Child 5-12');
    expect(loaded!.members[1].roleLabel).toBe('Adult 65+');
    expect(loaded!.members[2].roleLabel).toBe('Adult 18-64');
  });
});
