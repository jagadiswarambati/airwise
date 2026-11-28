import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEY_COMMUNITY_PLEDGE } from './keys';

const PLEDGE_CHANGE_EVENT = 'airwise_community_pledge_changed';

let inMemoryPledge = false;

/**
 * getCommunityPledge.
 * @returns
 */
export function getCommunityPledge(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryPledge;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_COMMUNITY_PLEDGE);
    return raw === 'true';
  } catch {
    return inMemoryPledge;
  }
}

/**
 * setCommunityPledge.
 * @param pledged
 * @returns
 */
export function setCommunityPledge(pledged: boolean): void {
  inMemoryPledge = pledged;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_COMMUNITY_PLEDGE, String(pledged));
      window.dispatchEvent(new CustomEvent(PLEDGE_CHANGE_EVENT, { detail: pledged }));
    } catch {
      // Ignore write errors
    }
  }
}

/**
 * useCommunityPledge.
 * @returns
 */
export function useCommunityPledge(): [boolean, (pledged: boolean) => void] {
  const [pledged, setPledged] = useState<boolean>(() => getCommunityPledge());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_COMMUNITY_PLEDGE) {
        setPledged(e.newValue === 'true');
      }
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setPledged(customEvent.detail);
    };

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PLEDGE_CHANGE_EVENT, handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PLEDGE_CHANGE_EVENT, handleCustom);
    };
  }, []);

  const update = useCallback((next: boolean) => {
    setCommunityPledge(next);
    setPledged(next);
  }, []);

  return useMemo(() => [pledged, update], [pledged, update]);
}
