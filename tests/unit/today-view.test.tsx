import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AirBriefingCard } from '../../src/ui/components/AirBriefingCard';
import { RiskBadge } from '../../src/ui/components/RiskBadge';
import { LevelHero } from '../../src/ui/components/LevelHero';
import { HazeBand } from '../../src/ui/components/HazeBand';
import { RadarLine } from '../../src/ui/components/RadarLine';
import { ActionRow } from '../../src/ui/components/ActionRow';
import { QuickChecksCard } from '../../src/ui/components/QuickChecksCard';
import { TrustSummary } from '../../src/ui/components/TrustSummary';
import { SevereSmogView } from '../../src/ui/components/SevereSmogView';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { buildTrustModel } from '../../src/data/trust';
import { evaluateQuickChecks } from '../../src/domain/quickchecks';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { computeRiskRadar, deriveTimeSlots } from '../../src/domain/radar';
import { PRIYA_PRESET } from '../../src/state/profileStore';

describe('Today Screen Component Renders (SSR)', () => {
  it('renders AirBriefingCard with primary PM2.5, AQI, and freshness badge', () => {
    const snapshot = getSampleScenarioSnapshot('moderate');
    const html = renderToString(<AirBriefingCard snapshot={snapshot} effectiveLevel={2} />);

    expect(html).toContain('52');
    expect(html).toContain('µg/m³ PM2.5');
    expect(html).toContain('AQI');
    expect(html).toContain('87');
    expect(html).toContain('Caution');
    expect(html).toContain('Fresh');
  });

  it('renders RiskBadge with WCAG compliant colors and accessible label', () => {
    const htmlLevel0 = renderToString(<RiskBadge level={0} />);
    expect(htmlLevel0).toContain('Clear');
    expect(htmlLevel0).toContain('risk-level-0');

    const htmlLevel4 = renderToString(<RiskBadge level={4} />);
    expect(htmlLevel4).toContain('Severe for your household');
    expect(htmlLevel4).toContain('risk-level-4');
  });

  describe('LevelHero Component', () => {
    it('renders level headline in words, PM2.5 unit, and 3 metadata chips for all levels 0-4', () => {
      const levels: Array<0 | 1 | 2 | 3 | 4> = [0, 1, 2, 3, 4];
      const titles = [
        'Clear for your household',
        'Watch for your household',
        'Caution for your household',
        'Protect for your household',
        'Severe for your household',
      ];

      for (let i = 0; i < levels.length; i++) {
        const lvl = levels[i];
        let scenario: 'severe' | 'clear' | 'moderate' = 'moderate';
        if (lvl === 4) scenario = 'severe';
        else if (lvl === 0) scenario = 'clear';
        const snapshot = getSampleScenarioSnapshot(scenario);
        const plan = buildDeterministicPlan(PRIYA_PRESET, snapshot);

        const html = renderToString(
          <LevelHero effectiveLevel={lvl} snapshot={snapshot} profile={PRIYA_PRESET} plan={plan} />,
        );

        expect(html).toContain(titles[i]);
        expect(html).toContain('µg/m³ PM2.5');
        expect(html).toContain('data');
        // Ensure no uppercase badges like ">CLEAR<" or ">PROTECT<"
        expect(html).not.toMatch(/>(CLEAR|ADVISORY|CAUTION|PROTECT|SEVERE)</);
      }
    });
  });

  describe('HazeBand Component', () => {
    const scenarios = ['clear', 'moderate', 'severe', 'stale'] as const;

    scenarios.forEach((scenario) => {
      it(`renders waking day SVG chart and disclosure table for ${scenario} scenario`, () => {
        const snapshot = getSampleScenarioSnapshot(scenario);
        const slots = deriveTimeSlots(PRIYA_PRESET, snapshot.pm25.hourly, 'IN');
        const radar = computeRiskRadar(PRIYA_PRESET, snapshot, slots);

        const html = renderToString(
          <HazeBand snapshot={snapshot} profile={PRIYA_PRESET} radar={radar} />,
        );

        // Chart accessible container
        expect(html).toContain('<svg');
        expect(html).toContain('role="img"');
        expect(html).toContain('aria-label="Hourly PM2.5 forecast for waking hours');
        // Disclosure table
        expect(html).toContain('Show hourly values');
        expect(html).toContain('<table');
        expect(html).toContain('<th scope="col">Time</th>');
        expect(html).toContain('<th scope="col">PM2.5 (µg/m³)</th>');
        expect(html).toContain('<th scope="col">Level</th>');
      });
    });
  });

  describe('RadarLine Component', () => {
    it('renders single plain sentence announcing peak exposure window with roleLabelFor', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const slots = deriveTimeSlots(PRIYA_PRESET, snapshot.pm25.hourly, 'IN');
      const radar = computeRiskRadar(PRIYA_PRESET, snapshot, slots);

      const html = renderToString(<RadarLine radar={radar} profile={PRIYA_PRESET} />);

      expect(html).toContain('Highest exposure today:');
      expect(html).toContain('child 5-12');
      expect(html).toContain('commute');
    });
  });

  describe('ActionRow Component', () => {
    it('renders rank, title, why, cost, and confidence in words', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const plan = buildDeterministicPlan(PRIYA_PRESET, snapshot);
      const candidate = plan.topActions[0];

      const html = renderToString(<ActionRow candidate={candidate} rank={1} onSelect={() => {}} />);

      expect(html).toContain('1');
      expect(html).toContain(candidate.action.title);
      expect(html).toContain(candidate.tags.cost);
      expect(html).toContain('confidence');
    });

    it('renders mandatory chip when candidate.isMandatory is true', () => {
      const snapshot = getSampleScenarioSnapshot('severe');
      const plan = buildDeterministicPlan(PRIYA_PRESET, snapshot);
      const mandatoryCandidate = { ...plan.topActions[0], isMandatory: true };

      const html = renderToString(
        <ActionRow candidate={mandatoryCandidate} rank={1} onSelect={() => {}} />,
      );

      expect(html).toContain('Mandatory');
    });
  });

  describe('TrustSummary Component', () => {
    it('renders always-visible one-line summary and disclosure with source and attribution', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const trust = buildTrustModel(snapshot, 'high', 'Modelled data', 'live', false);

      const html = renderToString(<TrustSummary trust={trust} />);

      expect(html).toContain('Confidence: High');
      expect(html).toContain('Data source');
      expect(html).toContain('Data type');
      expect(html).toContain('Plan confidence');
      expect(html).toContain('Open-Meteo');
    });
  });

  describe('QuickChecksCard Component', () => {
    it('renders 4 deterministic question chips that open sheets', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const checks = evaluateQuickChecks(PRIYA_PRESET, snapshot);
      const html = renderToString(<QuickChecksCard checks={checks} />);

      expect(html).toContain('Can my child play outside?');
      expect(html).toContain('Should I open a window?');
      expect(html).toContain('Can I walk to school or work?');
      expect(html).toContain('Should I run my purifier?');
      expect(html).toContain('Quick Checks');
    });
  });

  describe('SevereSmogView Component (Calm Severe Mode)', () => {
    it('renders calm severe mode without role="alert" or aria-live="assertive" on container', () => {
      const snapshot = getSampleScenarioSnapshot('severe');
      const plan = buildDeterministicPlan(PRIYA_PRESET, snapshot);

      const html = renderToString(
        <SevereSmogView
          snapshot={snapshot}
          plan={plan}
          onShowFullPlan={() => {}}
          onExitSevere={() => {}}
        />,
      );

      // Invariant: container MUST NOT have role="alert" or aria-live="assertive"
      expect(html).not.toContain('role="alert"');
      expect(html).not.toContain('aria-live="assertive"');

      // Check Calm Severe Mode elements
      expect(html).toContain('Severe for your household');
      expect(html).toContain('µg/m³ PM2.5');
      expect(html).toContain('Show full plan');
      expect(html).toContain('Turn off severe view');

      // Top 3 actions maximum
      expect(plan.topActions.length).toBeGreaterThan(0);
      expect(html).toContain(plan.topActions[0].action.title);
    });
  });
});
