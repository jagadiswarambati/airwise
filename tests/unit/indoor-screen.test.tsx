import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { IndoorScreen } from '../../src/ui/screens/IndoorScreen';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE, COMBUSTION_HEATING_PROFILE } from '../fixtures/sample-profiles';

describe('IndoorScreen Component (SSR)', () => {
  it('renders Smart Ventilation Advisor with closed verdict for severe scenario', () => {
    const snapshot = getSampleScenarioSnapshot('severe');
    const html = renderToString(<IndoorScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Smart Ventilation Advisor');
    expect(html).toContain('Keep windows closed');
    expect(html).toContain('Cleaner-Room Sanctuary');
  });

  it('renders Smart Ventilation Advisor with open verdict for clear scenario', () => {
    const snapshot = getSampleScenarioSnapshot('clear');
    const html = renderToString(<IndoorScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Ventilate freely');
  });

  it('renders Carbon Monoxide Safety Warning (Rule P-22) for combustion heating', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const html = renderToString(
      <IndoorScreen profile={COMBUSTION_HEATING_PROFILE} snapshot={snapshot} />,
    );

    expect(html).toContain('Carbon Monoxide Safety (Rule P-22)');
    expect(html).toContain('unvented combustion heating');
  });

  it('adapts cleaner room guidance when purifier is absent', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const html = renderToString(<IndoorScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Damp-wipe surfaces');
  });
});
