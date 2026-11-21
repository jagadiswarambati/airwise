import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ImpactScreen } from '../../src/ui/screens/ImpactScreen';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { HouseholdProfile } from '../../src/domain/types';

describe('ImpactScreen Component (SSR)', () => {
  const snapshot = getSampleScenarioSnapshot('moderate');

  it('renders dual-axis impact overview with distinct Exposure and Emissions pillars', () => {
    const html = renderToString(<ImpactScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Honest Dual-Axis Impact');
    expect(html).toContain('Exposure Axis');
    expect(html).toContain('Emissions Axis');
    expect(html).toContain('Protecting yourself from dirty air does not clean the outdoors');
  });

  it('renders weekly defensible household tally based on profile travel parameters', () => {
    const html = renderToString(<ImpactScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Weekly Household Defensible Tally');
    expect(html).toContain('vehicle-km avoided / week (Estimated)');
    // Priya has 12 km one-way, canWorkRemotely: true (MO-05: 24 vkm), carpool (MO-03: 24 vkm), errands (MO-04: 10 vkm)
    expect(html).toContain('Remote work 1 day/week');
    expect(html).toContain('Carpooling 2 days/week');
    expect(html).toContain('Combining errands');
    expect(html).toContain('Documented Assumptions:');
  });

  it('handles zero-commute profile defensibly with zero vkm rationale', () => {
    const zeroCommuteProfile: HouseholdProfile = {
      ...PRIYA_PROFILE,
      travel: {
        ...PRIYA_PROFILE.travel,
        oneWayKm: 0,
        tripsPerWeek: 0,
        modes: ['walk'],
      },
    };

    const html = renderToString(<ImpactScreen profile={zeroCommuteProfile} snapshot={snapshot} />);

    expect(html).toContain('0 vehicle-km recorded');
    expect(html).toContain('Profile commute distance is 0 km or no motorized vehicle commute indicated');
  });

  it('renders community aggregate estimate with Formula C1 and Demo data badge', () => {
    const html = renderToString(<ImpactScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Community Aggregate Impact');
    expect(html).toContain('Demo data');
    expect(html).toContain('Green Meadows Apartments');
    expect(html).toContain('community vehicle-km avoided / week (Estimated)');
    expect(html).toContain('Formula C1:');
  });

  it('renders transparent formulas and methodology section', () => {
    const html = renderToString(<ImpactScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Transparent Formulas &amp; Methodology');
    expect(html).toContain('Formula E1 — Avoided Vehicle-Kilometers (vkm):');
    expect(html).toContain('Formula X1 — Commute Exposure Delta:');
    expect(html).toContain('Formula C1 — Community Aggregate Vehicle-Kilometers:');
  });

  it('renders per-action dual-axis cards with boundary disclosures and assumptions', () => {
    const html = renderToString(<ImpactScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Per-Action Dual-Axis Verification');
    expect(html).toContain('Exposure');
    expect(html).toContain('Emissions');
    expect(html).toContain('Boundary:');
    expect(html).toContain('Assumptions:');
    expect(html).toContain('Recommended');
  });
});
