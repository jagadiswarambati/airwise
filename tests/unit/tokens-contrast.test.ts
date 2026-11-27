import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Calculates WCAG 2.1 relative luminance for a given hex color.
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '').trim();
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design Token Contrast Verification (WCAG 2.2 AA)', () => {
  const tokensCssPath = path.resolve(__dirname, '../../src/styles/tokens.css');
  const tokensContent = fs.readFileSync(tokensCssPath, 'utf-8');

  it('reads tokens.css successfully and verifies token declarations', () => {
    expect(tokensContent).toContain('--ink: #0f172a');
    expect(tokensContent).toContain('--surface: #ffffff');
    expect(tokensContent).toContain('--accent: #0369a1');
  });

  describe('Light Theme Contrast Tokens', () => {
    const light = {
      paper: '#f8fafc',
      surface: '#ffffff',
      ink: '#0f172a',
      ink2: '#334155',
      line: '#64748b',
      lineStrong: '#334155',
      accent: '#0369a1',
      onAccent: '#ffffff',
      haze0Bg: '#ecfdf5',
      haze0Ink: '#065f46',
      haze1Bg: '#fefce8',
      haze1Ink: '#713f12',
      haze2Bg: '#fff7ed',
      haze2Ink: '#7c2d12',
      haze3Bg: '#fef2f2',
      haze3Ink: '#991b1b',
      haze4Bg: '#faf5ff',
      haze4Ink: '#581c87',
      exposureBg: '#eff6ff',
      exposureInk: '#1e40af',
      exposureBorder: '#2563eb',
      emissionsBg: '#f0fdf4',
      emissionsInk: '#166534',
      emissionsBorder: '#16a34a',
    };

    it('meets WCAG AA body text contrast (>= 4.5:1) for primary and secondary ink', () => {
      expect(getContrastRatio(light.ink, light.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.ink, light.paper)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.ink2, light.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.ink2, light.paper)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA text contrast (>= 4.5:1) on primary buttons (accent / on-accent)', () => {
      expect(getContrastRatio(light.onAccent, light.accent)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA non-text UI component contrast (>= 3.0:1) for focus indicator & borders', () => {
      // Focus indicator uses var(--accent)
      expect(getContrastRatio(light.accent, light.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(light.accent, light.paper)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(light.line, light.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(light.exposureBorder, light.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(light.emissionsBorder, light.surface)).toBeGreaterThanOrEqual(3.0);
    });

    it('meets WCAG AA contrast (>= 4.5:1) for all 5 haze ramp levels (0-4)', () => {
      expect(getContrastRatio(light.haze0Ink, light.haze0Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.haze1Ink, light.haze1Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.haze2Ink, light.haze2Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.haze3Ink, light.haze3Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.haze4Ink, light.haze4Bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA contrast (>= 4.5:1) for dual-axis tokens (exposure & emissions)', () => {
      expect(getContrastRatio(light.exposureInk, light.exposureBg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(light.emissionsInk, light.emissionsBg)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Dark Theme Contrast Tokens', () => {
    const dark = {
      paper: '#090d16',
      surface: '#131b2e',
      ink: '#f8fafc',
      ink2: '#94a3b8',
      line: '#64748b',
      lineStrong: '#94a3b8',
      accent: '#38bdf8',
      onAccent: '#082f49',
      haze0Bg: '#064e3b',
      haze0Ink: '#a7f3d0',
      haze1Bg: '#713f12',
      haze1Ink: '#fef08a',
      haze2Bg: '#7c2d12',
      haze2Ink: '#fed7aa',
      haze3Bg: '#7f1d1d',
      haze3Ink: '#fecaca',
      haze4Bg: '#4c1d95',
      haze4Ink: '#e9d5ff',
      exposureBg: '#172554',
      exposureInk: '#bfdbfe',
      exposureBorder: '#60a5fa',
      emissionsBg: '#052e16',
      emissionsInk: '#bbf7d0',
      emissionsBorder: '#4ade80',
    };

    it('meets WCAG AA body text contrast (>= 4.5:1) in dark mode', () => {
      expect(getContrastRatio(dark.ink, dark.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.ink, dark.paper)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.ink2, dark.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.ink2, dark.paper)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA contrast (>= 4.5:1) on dark mode button text (on-accent on accent)', () => {
      expect(getContrastRatio(dark.onAccent, dark.accent)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA non-text UI contrast (>= 3.0:1) for focus indicator and lines in dark mode', () => {
      expect(getContrastRatio(dark.accent, dark.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(dark.accent, dark.paper)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(dark.line, dark.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(dark.exposureBorder, dark.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(dark.emissionsBorder, dark.surface)).toBeGreaterThanOrEqual(3.0);
    });

    it('meets WCAG AA contrast (>= 4.5:1) for all dark mode haze levels (0-4)', () => {
      expect(getContrastRatio(dark.haze0Ink, dark.haze0Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.haze1Ink, dark.haze1Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.haze2Ink, dark.haze2Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.haze3Ink, dark.haze3Bg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.haze4Ink, dark.haze4Bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA contrast (>= 4.5:1) for dark mode dual-axis tokens', () => {
      expect(getContrastRatio(dark.exposureInk, dark.exposureBg)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.emissionsInk, dark.emissionsBg)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Severe Theme Contrast Tokens', () => {
    const severe = {
      paper: '#1a0526',
      surface: '#2b093f',
      ink: '#ffffff',
      ink2: '#f3e8ff',
      accent: '#c084fc',
      onAccent: '#1a0526',
      line: '#a855f7',
    };

    it('meets WCAG AA body text contrast (>= 4.5:1) in severe mode', () => {
      expect(getContrastRatio(severe.ink, severe.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(severe.ink, severe.paper)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(severe.ink2, severe.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(severe.ink2, severe.paper)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA contrast (>= 4.5:1) for severe button action tokens', () => {
      expect(getContrastRatio(severe.onAccent, severe.accent)).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA UI contrast (>= 3.0:1) for severe focus and border lines', () => {
      expect(getContrastRatio(severe.accent, severe.surface)).toBeGreaterThanOrEqual(3.0);
      expect(getContrastRatio(severe.line, severe.surface)).toBeGreaterThanOrEqual(3.0);
    });
  });
});
