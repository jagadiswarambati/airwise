import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TabBar } from '../../src/ui/components/TabBar';
import { ActionCard } from '../../src/ui/components/ActionCard';
import { ActionDetailModal } from '../../src/ui/components/ActionDetailModal';
import { SevereSmogView } from '../../src/ui/components/SevereSmogView';
import { getSampleScenarioSnapshot } from '../../src/data/fallback-chain';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';

/**
 * Computes sRGB relative luminance per WCAG 2.2 specification.
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes WCAG contrast ratio between two hex colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Accessibility & WCAG 2.2 AA Contrast Compliance', () => {
  describe('WCAG 2.2 AA Color Contrast Audits', () => {
    it('verifies Level 0 (Clear) text meets WCAG AA >= 4.5:1', () => {
      const contrast = getContrastRatio('#065f46', '#ecfdf5');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies Level 1 (Watch) text meets WCAG AA >= 4.5:1', () => {
      const contrast = getContrastRatio('#854d0e', '#fefce8');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies Level 2 (Caution) text meets WCAG AA >= 4.5:1', () => {
      const contrast = getContrastRatio('#9a3412', '#fff7ed');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies Level 3 (Protect) text meets WCAG AA >= 4.5:1', () => {
      const contrast = getContrastRatio('#991b1b', '#fef2f2');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies Level 4 (Severe) text meets WCAG AA >= 4.5:1', () => {
      const contrast = getContrastRatio('#581c87', '#faf5ff');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies main text and muted text on white surface meet WCAG standards', () => {
      const mainTextContrast = getContrastRatio('#0f172a', '#ffffff');
      expect(mainTextContrast).toBeGreaterThanOrEqual(7.0); // WCAG AAA

      const mutedTextContrast = getContrastRatio('#475569', '#ffffff');
      expect(mutedTextContrast).toBeGreaterThanOrEqual(4.5); // WCAG AA
    });
  });

  describe('ARIA Landmarks and Semantic Attributes', () => {
    it('renders TabBar with tablist, tabs, and aria-selected', () => {
      const html = renderToString(<TabBar currentTab="today" onTabChange={() => {}} />);

      expect(html).toContain('aria-label="Main Navigation"');
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('aria-selected="false"');
    });

    it('ensures modal dialogs use role="dialog" and aria-modal="true"', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
      const cand = plan.topActions[0];

      const html = renderToString(<ActionDetailModal candidate={cand} onClose={() => {}} />);

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="modal-action-title"');
    });

    it('ensures Severe Smog Mode alert has role="alert"', () => {
      const snapshot = getSampleScenarioSnapshot('severe');
      const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
      const html = renderToString(<SevereSmogView snapshot={snapshot} plan={plan} />);

      expect(html).toContain('role="alert"');
      expect(html).toContain('SEVERE SMOG ALERT');
      expect(html).toContain('Outdoor exertion is hazardous');
    });

    it('ensures all interactive cards have accessible button types and labels', () => {
      const snapshot = getSampleScenarioSnapshot('moderate');
      const plan = buildDeterministicPlan(PRIYA_PROFILE, snapshot);
      const cand = plan.topActions[0];

      const html = renderToString(<ActionCard candidate={cand} onSelect={() => {}} />);

      expect(html).toContain('type="button"');
      expect(html).toContain(
        `aria-label="Action: ${cand.action.title}. Tap for full dual-axis impact details."`,
      );
    });
  });
});
