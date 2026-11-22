import { AirSnapshot } from '../domain/types';
import { determineFreshness } from '../domain/freshness';

export interface CacheEntry {
  snapshot: AirSnapshot;
  cachedAt: number;
  expiresAt: number;
  utcOffsetSeconds?: number;
}

export const AIR_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

class ClientAirCache {
  private memoryCache = new Map<string, CacheEntry>();

  private getKey(lat: number, lon: number): string {
    return `airwise_air_cache_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  }

  private loadEntry(lat: number, lon: number): CacheEntry | null {
    const key = this.getKey(lat, lon);
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      return memEntry;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const entry: CacheEntry = JSON.parse(raw);
          this.memoryCache.set(key, entry);
          return entry;
        }
      }
    } catch (_e) {
      // LocalStorage access error fallback
    }

    return null;
  }

  /**
   * Checks whether the cache entry is expired or missing.
   * TTL is only used to determine whether a refetch is needed.
   */
  isExpired(lat: number, lon: number, now: number = Date.now()): boolean {
    const entry = this.loadEntry(lat, lon);
    if (!entry) {
      return true;
    }
    return entry.expiresAt <= now;
  }

  /**
   * Retrieves the cached snapshot.
   * Per Decision A-06 & A-32, returns the last real reading even after TTL expiration,
   * with data freshness recomputed against the current clock from fetchedAt.
   */
  get(lat: number, lon: number, now: number = Date.now()): AirSnapshot | null {
    const entry = this.loadEntry(lat, lon);
    if (!entry) {
      return null;
    }

    const effectiveOffset = entry.snapshot.utcOffsetSeconds ?? entry.utcOffsetSeconds;
    const recomputedFreshness = determineFreshness(
      entry.snapshot.fetchedAt,
      entry.snapshot.pm25.hourly,
      new Date(now),
      effectiveOffset,
    );

    return {
      ...entry.snapshot,
      freshness: recomputedFreshness,
      utcOffsetSeconds: effectiveOffset,
    };
  }

  set(lat: number, lon: number, snapshot: AirSnapshot): void {
    const key = this.getKey(lat, lon);
    const now = Date.now();
    const entry: CacheEntry = {
      snapshot,
      cachedAt: now,
      expiresAt: now + AIR_CACHE_TTL_MS,
      utcOffsetSeconds: snapshot.utcOffsetSeconds,
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
