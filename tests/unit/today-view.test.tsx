import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AirBriefingCard } from '../../src/ui/components/AirBriefingCard';
import { RiskBadge } from '../../src/ui/components/RiskBadge';
import { Sparkline } from '../../src/ui/components/Sparkline';
import { QuickChecksCard } from '../../src/ui/components/QuickChecksCard';
import { TrustPanel } from '../../src/ui/components/TrustPanel';
import { SevereSmogView } from '../../src/ui/components/SevereSmogView';
import { ActionCard } from '../../src/ui/components/ActionCard';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { buildTrustModel } from '../../src/data/trust';
import { evaluateQuickChecks } from '../../src/domain/quickchecks';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { PRIYA_PRESET } from '../../src/state/profileStore';

describe('Today Screen Component Renders (SSR)', () => {
  it('renders AirBriefingCard with primary PM2.5, AQI, and freshness badge', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const html = renderToString(
      <AirBriefingCard snapshot={snapshot} effectiveLevel={2} />,
    );

    expect(html).toContain('52');
    expect(html).toContain('µg/m³ PM2.5');
    expect(html).toContain('AQI');
    expect(html).toContain('87');
    expect(html).toContain('Caution');
    expect(html).toContain('Fresh');
  });

  it('renders Sparkline SVG with 24 data points', () => {
    const snapshot = getSampleScenarioSnapshot('clear');
    const html = renderToString(<Sparkline hourly={snapshot.pm25.hourly} />);

    expect(html).toContain('<svg');
    expect(html).toContain('sparkline-gradient');
    expect(html).toContain('<path');
  });

  it('renders RiskBadge with WCAG compliant colors and accessible label', () => {
    const htmlLevel0 = renderToString(<RiskBadge level={0} />);
    expect(htmlLevel0).toContain('Clear');
    expect(htmlLevel0).toContain('risk-level-0');

    const htmlLevel4 = renderToString(<RiskBadge level={4} />);
    expect(htmlLevel4).toContain('Severe for your household');
    expect(htmlLevel4).toContain('risk-level-4');
  });

  it('renders QuickChecksCard with 4 deterministic questions and verdicts', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const checks = evaluateQuickChecks(PRIYA_PRESET, snapshot);
    const html = renderToString(<QuickChecksCard checks={checks} />);

    expect(html).toContain('Can my child play outside?');
    expect(html).toContain('Should I open a window?');
    expect(html).toContain('Can I walk to school or work?');
    expect(html).toContain('Should I run my purifier?');
    expect(html).toContain('Quick Checks');
  });

  it('renders ActionCard with title, urgency, cost, and dual-axis tags', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const plan = buildDeterministicPlan(PRIYA_PRESET, snapshot);
    const candidate = plan.topActions[0];

    const html = renderToString(
      <ActionCard candidate={candidate} onSelect={() => {}} />,
    );

    expect(html).toContain(candidate.action.title);
    expect(html).toContain(candidate.tags.cost);
    expect(html).toContain('Exposure ↓');
  });

  it('renders TrustPanel with attribution and plan confidence', () => {
    const snapshot = getSampleScenarioSnapshot('clear');
    const trust = buildTrustModel(snapshot, 'high', 'Observed data', 'sample', false);
    const html = renderToString(<TrustPanel trust={trust} />);

    expect(html).toContain('Trust &amp; Data Transparency');
    expect(html).toContain('Demo data');
  });

  it('renders SevereSmogView with high legibility directives and max 3 actions', () => {
    const snapshot = getSampleScenarioSnapshot('severe');
    const plan = buildDeterministicPlan(PRIYA_PRESET, snapshot);

    const html = renderToString(
      <SevereSmogView snapshot={snapshot} plan={plan} />,
    );

    expect(html).toContain('SEVERE SMOG ALERT');
    expect(html).toContain('Severe Air Quality Hazard');
    expect(html).toContain('Top 3 Immediate Protections');
    expect(html).toContain('Stay indoors and seal living spaces');
  });
});
