import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
 * If the hash matches an allowed route, returns that route.
 * When hashchange fires from stray anchor clicks (e.g. #main or in-page anchors),
 * parseRouteFromHash must ignore them without navigating away from the active screen
 * by returning the active currentRoute if provided.
 * Defaults to 'today' if invalid or missing on initial load.
 */
export function parseRouteFromHash(hash?: string, currentRoute?: AppRoute): AppRoute {
  let currentHash = hash;
  if (currentHash === undefined) {
    currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  }
  const clean = currentHash.replace(/^#\/?/, '').trim().toLowerCase();
  if ((ALLOWED_ROUTES as readonly string[]).includes(clean)) {
    return clean as AppRoute;
  }
  // Ignore stray in-page anchor clicks (e.g. #main) without navigating away from active screen
  if (currentRoute) {
    return currentRoute;
  }
  return 'today';
}

/**
 * Updates document title and optionally moves focus to the main screen h1 element with tabIndex=-1.
 * Focus is only moved on route transitions, never on initial page load.
 */
export function applyRouteEffects(route: AppRoute, moveFocus: boolean = true): void {
  if (typeof document === 'undefined') return;

  const title = ROUTE_TITLES[route] || 'AirWise';
  document.title = title;

  if (!moveFocus) return;

  // Move focus to main h1 for screen reader and keyboard accessibility
  // Use requestAnimationFrame or setTimeout to let React render the DOM first
  setTimeout(() => {
    const heading = document.querySelector('main h1');
    if (heading instanceof HTMLElement) {
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
    applyRouteEffects(route, true);
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
  const routeRef = useRef<AppRoute>(route);
  routeRef.current = route;
  const isInitialMount = useRef<boolean>(true);

  // Sync title on initial mount without moving focus
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      applyRouteEffects(route, false);
    }
  }, [route]);

  // Subscribe to hashchange events; only move focus on user-driven route transitions
  useEffect(() => {
    const handleHashChange = () => {
      const next = parseRouteFromHash(window.location.hash, routeRef.current);
      if (next !== routeRef.current) {
        setRoute(next);
        applyRouteEffects(next, true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const goTo = useCallback((target: AppRoute) => {
    navigate(target);
  }, []);

  return useMemo(() => ({ route, navigate: goTo }), [route, goTo]);
}
