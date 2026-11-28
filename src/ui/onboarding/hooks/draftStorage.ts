import { type HouseholdProfile } from '../../../domain/types';

const ONBOARDING_SESSION_CACHE_KEY = 'airwise_onboarding_session_draft_v1';

/**
 * Retrieves temporary session-cached draft to preserve inputs across browser session refreshes.
 */
export function getSessionDraft(): HouseholdProfile | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(ONBOARDING_SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists active draft to sessionStorage.
 */
export function saveSessionDraft(draft: HouseholdProfile): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(ONBOARDING_SESSION_CACHE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage write errors (e.g. quota limits)
  }
}

/**
 * Clears temporary session draft upon onboarding completion or reset.
 */
export function clearSessionDraft(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(ONBOARDING_SESSION_CACHE_KEY);
  } catch {
    // Ignore cleanup errors
  }
}
