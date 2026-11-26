import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfile,
  deleteProfile,
  exportProfileJson,
  importProfileJson,
  loadPriyaPreset,
  PROFILE_STORAGE_KEY,
} from '../../src/state/profileStore';

describe('Profile Store & Storage', () => {
  beforeEach(() => {
    deleteProfile();
  });

  it('loads Priya preset with all required household fields and valid schema', () => {
    const priya = loadPriyaPreset();
    expect(priya.schemaVersion).toBe(1);
    expect(priya.budget).toBe('low');
    expect(priya.equipment.purifier).toBe(false);
    expect(priya.equipment.windowAC).toBe(true);
    expect(priya.cooking.fuel).toBe('lpg');
    expect(priya.cooking.hasExhaust).toBe(false);
    expect(priya.members).toHaveLength(3);

    // Verify persistence
    const loaded = getProfile();
    expect(loaded).toEqual(priya);
  });

  it('exports and imports profile as JSON', () => {
    loadPriyaPreset();
    const jsonStr = exportProfileJson();
    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('Hyderabad, India');

    deleteProfile();
    expect(getProfile()).toBeNull();

    const importRes = importProfileJson(jsonStr);
    expect(importRes.success).toBe(true);
    expect(getProfile()).not.toBeNull();
    expect(getProfile()?.location.label).toBe('Hyderabad, India');
  });

  it('rejects invalid or corrupted JSON import gracefully', () => {
    const res = importProfileJson('{"invalid": true}');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('safely recovers from corrupted localStorage data', () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, 'invalid-json-data');
      expect(getProfile()).toBeNull();
    }
  });

  it('deletes profile completely leaving no orphaned state', () => {
    loadPriyaPreset();
    expect(getProfile()).not.toBeNull();
    deleteProfile();
    expect(getProfile()).toBeNull();
  });

  it('caches the parsed profile object reference when localStorage raw string has not changed', () => {
    loadPriyaPreset();
    const firstCall = getProfile();
    const secondCall = getProfile();
    expect(firstCall).toBe(secondCall); // Referential equality via raw localStorage cache
  });
});
