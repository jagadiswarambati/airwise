import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MoveScreen } from '../../src/ui/screens/MoveScreen';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

describe('MoveScreen Component (SSR)', () => {
  it('renders Commute Exposure Planner and profile travel modes', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const html = renderToString(<MoveScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Commute Exposure Planner');
    expect(html).toContain('07:30');
    expect(html).toContain('17:30');
    expect(html).toContain('two_wheeler');
  });

  it('renders Walking & Cycling Suitability as Not suitable today during severe smog (P-08)', () => {
    const snapshot = getSampleScenarioSnapshot('severe');
    const html = renderToString(<MoveScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Walking &amp; Cycling Suitability');
    expect(html).toContain('Not suitable today');
    expect(html).toContain('Aerobic exertion increases inhaled particulate volume');
  });

  it('renders Walking & Cycling Suitability as Suitable for short trips during clear conditions', () => {
    const snapshot = getSampleScenarioSnapshot('clear');
    const html = renderToString(<MoveScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Suitable for short trips');
  });

  it('renders relevant mobility actions with full dual-axis impact', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const html = renderToString(<MoveScreen profile={PRIYA_PROFILE} snapshot={snapshot} />);

    expect(html).toContain('Travel &amp; Commute Recommendations');
    expect(html).toContain('Exposure');
    expect(html).toContain('Emissions');
  });
});
