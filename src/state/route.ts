import { useState, useEffect, useCallback } from 'react';

export type AppRoute =
  | 'today'
  | 'indoor'
  | 'move'
  | 'impact'
  | 'community'
  | 'about'
  | 'privacy'
  | 'terms';

export const ALLOWED_ROUTES: readonly AppRoute[] = [
  'today',
  'indoor',
  'move',
  'impact',
  'community',
  'about',
  'privacy',
  'terms',
] as const;

export const ROUTE_TITLES: Record<AppRoute, string> = {
  today: 'Today - AirWise',
  indoor: 'At home - AirWise',
  move: 'Travel - AirWise',
  impact: 'Impact - AirWise',
  community: 'Community - AirWise',
  about: 'About - AirWise',
  privacy: 'Privacy - AirWise',
  terms: 'Terms - AirWise',
};

export const ROUTE_LABELS: Record<AppRoute, string> = {
  today: 'Today',
  indoor: 'At home',
  move: 'Travel',
  impact: 'Impact',
  community: 'Community',
  about: 'About',
  privacy: 'Privacy',
  terms: 'Terms',
};

export const ROUTE_DESCRIPTIONS: Record<AppRoute, string> = {
  today: 'What to do for clean air today, and how far to trust it.',
  indoor: 'Simple steps to keep the air in your home cleaner.',
  move: 'Safer times and ways to get around today.',
  impact: "What each action changes for your breathing and for the city's pollution.",
  community: 'A shareable daily briefing for your building or neighbourhood.',
  about: 'About AirWise, our mission and methodology.',
  privacy: 'How your data is protected and kept private.',
  terms: 'Terms of use and service information.',
};

/**
 * Parses the current URL hash into a valid AppRoute.
 * Defaults to 'today' if invalid or missing.
 */
export function parseRouteFromHash(hash?: string): AppRoute {
  let currentHash = hash;
  if (currentHash === undefined) {
    currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  }
  const clean = currentHash.replace(/^#\/?/, '').trim().toLowerCase();
  if ((ALLOWED_ROUTES as readonly string[]).includes(clean)) {
    return clean as AppRoute;
  }
  return 'today';
}

/**
 * Updates document title and moves focus to the main screen h1 element with tabIndex=-1.
 */
export function applyRouteEffects(route: AppRoute): void {
  if (typeof document === 'undefined') return;

  const title = ROUTE_TITLES[route] || 'AirWise';
  document.title = title;

  // Move focus to main h1 for screen reader and keyboard accessibility
  // Use requestAnimationFrame or setTimeout to let React render the DOM first
  setTimeout(() => {
    const heading = document.querySelector('main h1') as HTMLElement | null;
    if (heading) {
      if (heading.tabIndex < 0) {
        heading.tabIndex = -1;
      }
      heading.focus({ preventScroll: false });
    }
  }, 50);
}

/**
 * Programmatically navigate to a route using URL hash.
 */
export function navigate(route: AppRoute): void {
  if (typeof window === 'undefined') return;
  const targetHash = `#/${route}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  } else {
    // If hash was already the same, re-trigger effects
    applyRouteEffects(route);
  }
}

/**
 * React hook subscribing to hash route changes.
 */
export function useRoute(): {
  route: AppRoute;
  navigate: (r: AppRoute) => void;
} {
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      const next = parseRouteFromHash();
      setRoute(next);
      applyRouteEffects(next);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial run to ensure title and focus are synced
    applyRouteEffects(route);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [route]);

  const goTo = useCallback((target: AppRoute) => {
    navigate(target);
  }, []);

  return { route, navigate: goTo };
}
