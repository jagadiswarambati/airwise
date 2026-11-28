import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * SETTINGS_STORAGE_KEY.
 */
export const SETTINGS_STORAGE_KEY = 'airwise_settings_v1';

/**
 * AppTheme.
 */
export type AppTheme = 'system' | 'light' | 'dark';

/**
 * AirWiseSettings.
 */
export interface AirWiseSettings {
  aiEnabled: boolean;
  theme: AppTheme;
  animatedSky: boolean;
}

const DEFAULT_SETTINGS: AirWiseSettings = {
  aiEnabled: false,
  theme: 'system',
  animatedSky: true,
};

const SETTINGS_CHANGE_EVENT = 'airwise_settings_changed';

/**
 * Applies theme attribute to document element for styling.
 */
export function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function parseTheme(rawTheme?: unknown): AppTheme {
  if (rawTheme === 'light' || rawTheme === 'dark' || rawTheme === 'system') {
    return rawTheme;
  }
  return DEFAULT_SETTINGS.theme;
}

/**
 * Retrieves current settings from localStorage, or defaults.
 */
export function getSettings(): AirWiseSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const theme = parseTheme(parsed?.theme);
    const aiEnabled = typeof parsed?.aiEnabled === 'boolean' ? parsed.aiEnabled : DEFAULT_SETTINGS.aiEnabled;
    const animatedSky = typeof parsed?.animatedSky === 'boolean' ? parsed.animatedSky : DEFAULT_SETTINGS.animatedSky;
    return {
      aiEnabled,
      theme,
      animatedSky,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Updates settings in localStorage, applies theme, and dispatches change event.
 */
export function setSettings(updates: Partial<AirWiseSettings>): AirWiseSettings {
  const current = getSettings();
  const next: AirWiseSettings = {
    ...current,
    ...updates,
  };

  if (updates.theme !== undefined) {
    applyTheme(next.theme);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
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
    // Sync theme on initial mount
    applyTheme(settings.theme);

    const handleUpdate = () => {
      const updated = getSettings();
      setLocalState(updated);
      applyTheme(updated.theme);
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [settings.theme]);

  const update = useCallback((updates: Partial<AirWiseSettings>) => {
    const next = setSettings(updates);
    setLocalState(next);
  }, []);

  return useMemo(() => [settings, update], [settings, update]);
}
