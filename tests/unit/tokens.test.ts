import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Computes sRGB relative luminance per WCAG 2.2 specification.
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '').trim();
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

function parseTokens(css: string, selectorPattern: RegExp): Record<string, string> {
  const match = css.match(selectorPattern);
  if (!match) return {};
  const block = match[1];
  const map: Record<string, string> = {};
  const re = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    map[m[1]] = m[2].trim();
  }
  return map;
}

describe('Design Tokens & Contrast Compliance (tokens.test.ts)', () => {
  const tokensPath = path.resolve('src/styles/tokens.css');
  const css = fs.readFileSync(tokensPath, 'utf8');

  // Parse token sets
  const lightTokens = parseTokens(css, /:root\s*\{([^}]+)\}/);
  const darkTokens = parseTokens(css, /\[data-theme=["']dark["']\]\s*\{([^}]+)\}/);
  const severeTokens = parseTokens(css, /\[data-theme=["']severe["']\]\s*\{([^}]+)\}/);

  describe('Token Parity Across Themes', () => {
    it('ensures dark theme defines every color token that light theme defines', () => {
      const colorTokens = [
        '--paper',
        '--surface',
        '--ink',
        '--ink-2',
        '--line',
        '--line-strong',
        '--accent',
        '--on-accent',
        '--haze-0-bg',
        '--haze-0-ink',
        '--haze-1-bg',
        '--haze-1-ink',
        '--haze-2-bg',
        '--haze-2-ink',
        '--haze-3-bg',
        '--haze-3-ink',
        '--haze-4-bg',
        '--haze-4-ink',
        '--exposure-bg',
        '--exposure-ink',
        '--exposure-border',
        '--emissions-bg',
        '--emissions-ink',
        '--emissions-border',
        '--sky-day',
        '--sky-dusk',
        '--sky-night',
      ];

      for (const token of colorTokens) {
        expect(lightTokens[token], `Light missing ${token}`).toBeDefined();
        expect(darkTokens[token], `Dark missing ${token}`).toBeDefined();
        expect(severeTokens[token], `Severe missing ${token}`).toBeDefined();
      }
    });
  });

  describe('Contrast Checks Across Light, Dark, Severe Themes', () => {
    const themes = [
      { name: 'Light', tokens: lightTokens },
      { name: 'Dark', tokens: darkTokens },
      { name: 'Severe', tokens: severeTokens },
    ];

    themes.forEach(({ name, tokens }) => {
      describe(`${name} Theme`, () => {
        it('verifies body text ink on surface meets WCAG AA text >= 4.5:1', () => {
          const ratio = getContrastRatio(tokens['--ink'], tokens['--surface']);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });

        it('verifies muted text ink-2 on surface meets WCAG AA text >= 4.5:1', () => {
          const ratio = getContrastRatio(tokens['--ink-2'], tokens['--surface']);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });

        it('verifies body text ink on paper meets WCAG AA text >= 4.5:1', () => {
          const ratio = getContrastRatio(tokens['--ink'], tokens['--paper']);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });

        it('verifies on-accent text on accent meets WCAG AA text >= 4.5:1', () => {
          const ratio = getContrastRatio(tokens['--on-accent'], tokens['--accent']);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });

        it('verifies UI borders meet >= 3.0:1 against surface', () => {
          const ratio = getContrastRatio(tokens['--line'], tokens['--surface']);
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        });

        it('verifies UI borders line-strong meet >= 3.0:1 against surface', () => {
          const ratio = getContrastRatio(tokens['--line-strong'], tokens['--surface']);
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        });

        for (let level = 0; level <= 4; level++) {
          it(`verifies Haze Level ${level} text on background meets WCAG AA text >= 4.5:1`, () => {
            const ink = tokens[`--haze-${level}-ink`];
            const bg = tokens[`--haze-${level}-bg`];
            const ratio = getContrastRatio(ink, bg);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          });
        }

        it('verifies exposure ink on background meets WCAG AA text >= 4.5:1', () => {
          const ratio = getContrastRatio(tokens['--exposure-ink'], tokens['--exposure-bg']);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });

        it('verifies exposure border on background meets UI border >= 3.0:1', () => {
          const ratio = getContrastRatio(tokens['--exposure-border'], tokens['--exposure-bg']);
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        });

        it('verifies emissions ink on background meets WCAG AA text >= 4.5:1', () => {
          const ratio = getContrastRatio(tokens['--emissions-ink'], tokens['--emissions-bg']);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        });

        it('verifies emissions border on background meets UI border >= 3.0:1', () => {
          const ratio = getContrastRatio(tokens['--emissions-border'], tokens['--emissions-bg']);
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        });
      });
    });
  });

  describe('Touch Targets and Typographic Scale', () => {
    it('verifies target-min is at least 44px', () => {
      expect(lightTokens['--target-min']).toBe('44px');
    });

    it('verifies severe theme scales base text to >= 20px (1.25rem)', () => {
      expect(severeTokens['--text-base']).toBe('1.25rem');
    });
  });
});
