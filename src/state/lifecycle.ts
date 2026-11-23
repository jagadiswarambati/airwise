import { ALL_STORAGE_KEYS } from './keys';
import { airCache } from '../data/cache';
import { clearPlanCache } from '../ai/plan-cache';
import { deleteProfile } from './profileStore';

/**
 * Completely clears all local storage data, in-memory caches, and service worker caches (SECURITY_PRIVACY §13).
 * Leaves zero airwise_ keys in localStorage.
 */
export async function clearAllLocalData(): Promise<void> {
  // 1. Remove all airwise_ keys from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (
          k &&
          (k.startsWith('airwise_') ||
            (ALL_STORAGE_KEYS as readonly string[]).includes(k))
        ) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
    } catch (_e) {
      // Ignore storage access errors
    }
  }

  // 2. Clear air cache (both memory and any remaining storage entries)
  airCache.clear();

  // 3. Clear LLM plan cache
  clearPlanCache();

  // 4. Delete profile state
  deleteProfile();

  // 5. Delete service worker caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    } catch (_e) {
      // Ignore SW cache deletion errors
    }
  }
}
