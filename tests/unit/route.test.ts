import { describe, it, expect } from 'vitest';
import {
  ALLOWED_ROUTES,
  ROUTE_TITLES,
  ROUTE_LABELS,
  ROUTE_DESCRIPTIONS,
  parseRouteFromHash,
} from '../../src/state/route';

describe('Route System & Allowlisting', () => {
  it('allowlists exactly the 8 core application and information routes', () => {
    expect(ALLOWED_ROUTES).toEqual([
      'today',
      'indoor',
      'move',
      'impact',
      'community',
      'about',
      'privacy',
      'terms',
    ]);
  });

  it('correctly parses hash paths into AppRoute', () => {
    expect(parseRouteFromHash('#/today')).toBe('today');
    expect(parseRouteFromHash('#/indoor')).toBe('indoor');
    expect(parseRouteFromHash('#/move')).toBe('move');
    expect(parseRouteFromHash('#/impact')).toBe('impact');
    expect(parseRouteFromHash('#/community')).toBe('community');
    expect(parseRouteFromHash('#/about')).toBe('about');
    expect(parseRouteFromHash('#/privacy')).toBe('privacy');
    expect(parseRouteFromHash('#/terms')).toBe('terms');
  });

  it('falls back safely to today for empty or unrecognized routes', () => {
    expect(parseRouteFromHash('')).toBe('today');
    expect(parseRouteFromHash('#/')).toBe('today');
    expect(parseRouteFromHash('#/unknown-screen')).toBe('today');
    expect(parseRouteFromHash('#/settings')).toBe('today');
    expect(parseRouteFromHash(undefined)).toBe('today');
  });

  it('provides accessible titles ending with "- AirWise" for every route', () => {
    for (const r of ALLOWED_ROUTES) {
      expect(ROUTE_TITLES[r]).toBeDefined();
      expect(ROUTE_TITLES[r]).toMatch(/- AirWise$/);
    }
    expect(ROUTE_TITLES.today).toBe('Today - AirWise');
    expect(ROUTE_TITLES.indoor).toBe('At home - AirWise');
    expect(ROUTE_TITLES.move).toBe('Travel - AirWise');
  });

  it('provides accessible labels and clear descriptions for every route', () => {
    for (const r of ALLOWED_ROUTES) {
      expect(ROUTE_LABELS[r]).toBeDefined();
      expect(ROUTE_LABELS[r].length).toBeGreaterThan(2);
      expect(ROUTE_DESCRIPTIONS[r]).toBeDefined();
      expect(ROUTE_DESCRIPTIONS[r].length).toBeGreaterThan(10);
    }
  });
});
