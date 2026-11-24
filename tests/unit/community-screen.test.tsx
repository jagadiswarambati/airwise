import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CommunityScreen } from '../../src/ui/screens/CommunityScreen';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

describe('CommunityScreen Component (SSR)', () => {
  const snapshot = getSampleScenarioSnapshot('moderate');

  it('renders Demo data banner with Green Meadows Apartments identity', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('For your building');
    expect(html).toContain('Demo data');
    expect(html).toContain('Green Meadows Apartments');
    expect(html).toContain('120');
    expect(html).toContain('homes');
  });

  it('renders Society Daily Air Briefing with PM2.5 reading', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Society Briefing');
    expect(html).toContain('52 µg/m³');
    expect(html).toContain('Caution level');
  });

  it('renders shareable plain-text briefing box with copy button', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Message you can paste');
    expect(html).toContain('Copy briefing');
    expect(html).toContain('Green Meadows Apartments — Daily Clean-Air Briefing');
    expect(html).toContain('Pledge not to burn leaves, garden waste or rubbish');
    expect(html).toContain('[Shared via AirWise — Demo data: Green Meadows Apartments]');
  });

  it('renders Zero Open Burning Pledge (CM-01) with pledge counter', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Action CM-01 · Clean Air Pledge');
    expect(html).toContain('No-Burning Pledge');
    expect(html).toContain('84');
    expect(html).toContain('120');
    expect(html).toContain('Pledged');
    expect(html).toContain('Pledge not to burn leaves, garden waste or rubbish');
  });

  it('renders Carpool Coordination concept (CM-02) with commuter stats', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Action CM-02 · Collective Mobility');
    expect(html).toContain('Building Carpool Coordination');
    expect(html).toContain('18');
    expect(html).toContain('Commuters');
    expect(html).toContain('~432');
  });

  it('renders Vulnerable Resident Buddy-Check census (CM-03) with aggregate counts', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Action CM-03 · Vulnerability Care');
    expect(html).toContain('Vulnerable Resident Buddy Check');
    expect(html).toContain('24');
    expect(html).toContain('Seniors (65+)');
    expect(html).toContain('19');
    expect(html).toContain('&lt;12');
    expect(html).toContain('9');
    expect(html).toContain('Respiratory');
    expect(html).toContain(
      'displays aggregated, non-identifying counts only to preserve neighbor privacy',
    );
  });

  it('renders aggregate community vehicle-km avoided (Formula C1)', () => {
    const html = renderToString(<CommunityScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Aggregate Community Vehicle-KM Avoided');
    expect(html).toContain('vkm avoided this week (Formula C1)');
    expect(html).toContain('432');
  });
});
