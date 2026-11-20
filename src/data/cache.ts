import { AirSnapshot } from '../domain/types';

export interface CacheEntry {
  snapshot: AirSnapshot;
  cachedAt: number;
  expiresAt: number;
}

export const AIR_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

class ClientAirCache {
  private memoryCache = new Map<string, CacheEntry>();

  private getKey(lat: number, lon: number): string {
    return `airwise_air_cache_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  }

  get(lat: number, lon: number): AirSnapshot | null {
    const key = this.getKey(lat, lon);
    const now = Date.now();

    // Check memory first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > now) {
      return memEntry.snapshot;
    }

    // Check localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const entry: CacheEntry = JSON.parse(raw);
          if (entry.expiresAt > now) {
            this.memoryCache.set(key, entry);
            return entry.snapshot;
          } else {
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch (_e) {
      // LocalStorage error fallback
    }

    return null;
  }

  set(lat: number, lon: number, snapshot: AirSnapshot): void {
    const key = this.getKey(lat, lon);
    const now = Date.now();
    const entry: CacheEntry = {
      snapshot,
      cachedAt: now,
      expiresAt: now + AIR_CACHE_TTL_MS,
    };

    this.memoryCache.set(key, entry);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(entry));
      }
    } catch (_e) {
      // LocalStorage quota or access error
    }
  }

  clear(): void {
    this.memoryCache.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('airwise_air_cache_')) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          window.localStorage.removeItem(k);
        }
      }
    } catch (_e) {
      // Ignore storage errors
    }
  }
}

export const airCache = new ClientAirCache();

