import { useState, useEffect, useCallback } from 'react';

export const SETTINGS_STORAGE_KEY = 'airwise_settings_v1';

export interface AirWiseSettings {
  aiEnabled: boolean;
}

const DEFAULT_SETTINGS: AirWiseSettings = {
  aiEnabled: false,
};

const SETTINGS_CHANGE_EVENT = 'airwise_settings_changed';

/**
 * Retrieves current settings from localStorage, or defaults.
 */
export function getSettings(): AirWiseSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      aiEnabled: typeof parsed?.aiEnabled === 'boolean' ? parsed.aiEnabled : DEFAULT_SETTINGS.aiEnabled,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Updates settings in localStorage and dispatches change event.
 */
export function setSettings(updates: Partial<AirWiseSettings>): AirWiseSettings {
  const current = getSettings();
  const next: AirWiseSettings = {
    ...current,
    ...updates,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: next }));
    } catch {
      // Ignore write errors (e.g. storage full)
    }
  }

  return next;
}

/**
 * React hook to subscribe to and update AirWise settings.
 */
export function useSettings(): [AirWiseSettings, (updates: Partial<AirWiseSettings>) => void] {
  const [settings, setLocalState] = useState<AirWiseSettings>(getSettings);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalState(getSettings());
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const update = useCallback((updates: Partial<AirWiseSettings>) => {
    const next = setSettings(updates);
    setLocalState(next);
  }, []);

  return [settings, update];
}
