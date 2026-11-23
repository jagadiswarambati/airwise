import { describe, it, expect, beforeEach } from 'vitest';
import { clearAllLocalData } from '../../src/state/lifecycle';
import {
  ALL_STORAGE_KEYS,
  STORAGE_KEY_PROFILE,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_COMMUNITY_PLEDGE,
  STORAGE_PREFIX_AIR_CACHE,
} from '../../src/state/keys';
import {
  exportProfileJson,
  importProfileJson,
  getProfile,
  saveProfile,
} from '../../src/state/profileStore';
import { getSettings } from '../../src/state/settingsStore';
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
  caches: {
    keys: async () => ['cache-v1'],
    delete: async (_name: string) => true,
  },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;

describe('Data Lifecycle & Deletion Engine (SECURITY_PRIVACY §11, §13)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('completely removes all airwise_* keys, caches, and states upon clearAllLocalData()', async () => {
    // 1. Populate all registered keys
    for (const key of ALL_STORAGE_KEYS) {
      localStorage.setItem(key, 'dummy-value');
    }

    // 2. Populate air cache entries
    localStorage.setItem(`${STORAGE_PREFIX_AIR_CACHE}17.38_78.48`, '{"snapshot":{}}');
    localStorage.setItem(`${STORAGE_PREFIX_AIR_CACHE}28.61_77.21`, '{"snapshot":{}}');

    // 3. Populate an unrelated key that should NOT be wiped
    localStorage.setItem('other_app_key', 'keep-me');

    expect(localStorage.getItem(STORAGE_KEY_PROFILE)).toBe('dummy-value');
    expect(localStorage.getItem(STORAGE_KEY_COMMUNITY_PLEDGE)).toBe('dummy-value');

    // 4. Execute full wipe
    await clearAllLocalData();

    // 5. Assert zero airwise_ keys remain
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        expect(key.startsWith('airwise_')).toBe(false);
      }
    }

    expect(localStorage.getItem(STORAGE_KEY_PROFILE)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_SETTINGS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_COMMUNITY_PLEDGE)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_PREFIX_AIR_CACHE}17.38_78.48`)).toBeNull();

    // 6. Unrelated key is preserved
    expect(localStorage.getItem('other_app_key')).toBe('keep-me');

    // 7. In-memory profile is cleared
    expect(getProfile()).toBeNull();
  });

  it('exports strictly schemaVersion + profile + settings only', () => {
    saveProfile(PRIYA_PROFILE);
    const exportedRaw = exportProfileJson();
    const parsed = JSON.parse(exportedRaw);

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.profile).toBeDefined();
    expect(parsed.profile.location.label).toBe(PRIYA_PROFILE.location.label);
    expect(parsed.settings).toBeDefined();
    expect(parsed.settings.aiEnabled).toBe(getSettings().aiEnabled);

    // No extra cache keys or temporary state
    const keys = Object.keys(parsed);
    expect(keys.sort()).toEqual(['profile', 'schemaVersion', 'settings'].sort());
  });

  it('imports profile JSON safely and rejects corrupted or malformed payloads', () => {
    // Valid import
    const validJson = exportProfileJson();
    const resValid = importProfileJson(validJson);
    expect(resValid.success).toBe(true);

    // Malformed JSON
    const resBadJson = importProfileJson('{ invalid');
    expect(resBadJson.success).toBe(false);
    expect(resBadJson.error).toBeDefined();

    // Missing required fields
    const resMissing = importProfileJson(JSON.stringify({ schemaVersion: 1, members: [] }));
    expect(resMissing.success).toBe(false);
  });
});
