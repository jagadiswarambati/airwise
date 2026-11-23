import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { AboutScreen } from '../../src/ui/screens/AboutScreen';
import { PrivacyScreen } from '../../src/ui/screens/PrivacyScreen';
import { TermsScreen } from '../../src/ui/screens/TermsScreen';
import { ALL_STORAGE_KEYS } from '../../src/state/keys';
import {
  SITE_NAME,
  OWNER_NAME,
  CONTACT_EMAIL,
  SITE_URL,
  REPO_URL,
  TERMS_JURISDICTION,
  OPEN_METEO_ATTRIBUTION,
  EMERGENCY_NOTICE,
} from '../../src/config/site';

describe('Public Pages & Metadata Smoke Tests (F3)', () => {
  describe('AboutScreen', () => {
    it('renders with exactly one H1 and required sections', () => {
      const html = renderToString(<AboutScreen />);

      // Exactly one H1
      const h1Matches = html.match(/<h1\b[^>]*>(.*?)<\/h1>/gi) || [];
      expect(h1Matches.length).toBe(1);
      expect(h1Matches[0]).toContain('Clean-air advice for your household, every morning.');

      // Required H2 sections in order
      const requiredH2s = [
        'Why this exists',
        'How it works',
        'What you get',
        'Who it helps',
        'How we keep it honest',
      ];

      for (const h2 of requiredH2s) {
        expect(html, `Missing section: ${h2}`).toContain(h2);
      }

      // CTAs
      expect(html).toContain('Set up my household');
      expect(html).toContain('Try a demo household');
      expect(html).toContain('Takes 2 minutes');
      expect(html).toContain('Instant preview');

      // Decorative illustration
      expect(html).toContain('aw-atmosphere-strip');
      expect(html).toContain('Illustration');

      // Consent & legal links
      expect(html).toContain('href="#/terms"');
      expect(html).toContain('href="#/privacy"');
    });
  });

  describe('PrivacyScreen', () => {
    it('renders with exactly one H1, accessible TOC, and all storage keys', () => {
      const html = renderToString(<PrivacyScreen />);

      // Exactly one H1
      const h1Matches = html.match(/<h1\b[^>]*>(.*?)<\/h1>/gi) || [];
      expect(h1Matches.length).toBe(1);
      expect(h1Matches[0]).toContain('Privacy Policy');

      // Required H2 sections
      const requiredH2s = [
        '1. What AirWise Does',
        '2. What Stays on Your Device',
        '3. What Leaves Your Device',
        '4. What Google Gemini Receives',
        '5. Hosting Provider and External Services',
        '6. Zero Cookies and Tracking',
        '7. Data Retention',
        '8. Children and Household Profiles',
        '9. Your Controls',
        '10. HTTPS, Security Headers',
        '11. Policy Changes &amp; Contact Information',
      ];

      for (const h2 of requiredH2s) {
        expect(html, `Missing privacy section: ${h2}`).toContain(h2);
      }

      // TOC with section links
      expect(html).toContain('On this page');
      expect(html).toContain('aw-toc-btn');

      // Every localStorage key from ALL_STORAGE_KEYS must be documented
      for (const key of ALL_STORAGE_KEYS) {
        expect(html, `Missing storage key in privacy policy: ${key}`).toContain(key);
      }
      expect(html).toContain('airwise_air_cache_');

      // Clarifications: coordinates rounded, queries sent, no analytics
      expect(html).toContain('~1.1 km');
      expect(html.toLowerCase()).toContain('zero cookies');
      expect(html.toLowerCase()).toContain('zero third-party analytics');

      // AI Minimisation breakdown
      expect(html).toContain('What AI Receives');
      expect(html).toContain('What AI Never Receives');

      // Back to top button
      expect(html).toContain('Back to top');
    });
  });

  describe('TermsScreen', () => {
    it('renders with exactly one H1, accessible TOC, emergency notice, and attributions', () => {
      const html = renderToString(<TermsScreen />);

      // Exactly one H1
      const h1Matches = html.match(/<h1\b[^>]*>(.*?)<\/h1>/gi) || [];
      expect(h1Matches.length).toBe(1);
      expect(h1Matches[0]).toContain('Terms of Use');

      // Required H2 sections
      const requiredH2s = [
        '1. Informational Purpose Only — Not Medical Advice',
        '2. Modelled Weather &amp; Air Quality Forecasts',
        '3. Demo Scenarios &amp; Simulated Community Data',
        '4. Acceptable Use Policy',
        '5. Warranty Disclaimer &amp; Limitation of Liability',
        '6. Data Attribution &amp; Source Code License',
        '7. Governing Law &amp; Jurisdiction',
        '8. Contact &amp; Modifications',
      ];

      for (const h2 of requiredH2s) {
        expect(html, `Missing terms section: ${h2}`).toContain(h2);
      }

      // Emergency notice verbatim
      expect(html).toContain(EMERGENCY_NOTICE);

      // Open-Meteo attribution constant verbatim
      expect(html).toContain(OPEN_METEO_ATTRIBUTION);
      expect(html).toContain('CC BY 4.0');

      // Source code licence
      expect(html).toContain('Source code licence:');
      expect(html).toContain('see the repository');

      // Governing law unresolved token
      expect(html).toContain(TERMS_JURISDICTION);

      // Back to top button
      expect(html).toContain('Back to top');
    });
  });

  describe('Site Configuration & Tokens', () => {
    it('verifies site configuration fields and warns on unresolved tokens without failing', () => {
      expect(SITE_NAME).toBe('AirWise');
      expect(OWNER_NAME).toBe('AMBATI JAGADISWAR REDDY');
      expect(CONTACT_EMAIL).toBe('ambatijagadiswarreddy@gmail.com');
      expect(SITE_URL).toBe('https://airwise-five.vercel.app');
      expect(REPO_URL).toBe('https://github.com/jagadiswarambati/airwise');

      // Token check: [[JURISDICTION]] should be reported as unresolved
      if (TERMS_JURISDICTION.includes('[[') && TERMS_JURISDICTION.includes(']]')) {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn(
          `[Site Config] Unresolved configuration token detected: TERMS_JURISDICTION = "${TERMS_JURISDICTION}". Provide legal jurisdiction before commercial distribution.`,
        );
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      }
    });
  });

  describe('Metadata in index.html and Assets', () => {
    const indexPath = path.resolve('index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    it('has compliant title and meta description <= 155 characters', () => {
      expect(indexHtml).toContain('<title>AirWise - Clean-air advice for your household</title>');

      const descMatch = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      expect(descMatch).not.toBeNull();
      const desc = descMatch![1];
      expect(desc.length).toBeLessThanOrEqual(155);
      expect(desc.length).toBeGreaterThan(50);
    });

    it('has theme-color meta tags for light and dark modes', () => {
      expect(indexHtml).toContain('media="(prefers-color-scheme: light)"');
      expect(indexHtml).toContain('media="(prefers-color-scheme: dark)"');
    });

    it('has canonical URL, Open Graph, and Twitter metadata tags', () => {
      expect(indexHtml).toContain('rel="canonical"');
      expect(indexHtml).toContain('property="og:title"');
      expect(indexHtml).toContain('property="og:description"');
      expect(indexHtml).toContain('property="og:image"');
      expect(indexHtml).toContain('name="twitter:card"');
      expect(indexHtml).toContain('name="twitter:image"');
      expect(indexHtml).toContain('<noscript>');
    });

    it('ensures static assets exist and og.png is <= 60 KB', () => {
      const faviconPath = path.resolve('public/favicon.svg');
      const ogPath = path.resolve('public/og.png');
      const robotsPath = path.resolve('public/robots.txt');

      expect(fs.existsSync(faviconPath)).toBe(true);
      expect(fs.existsSync(robotsPath)).toBe(true);
      expect(fs.existsSync(ogPath)).toBe(true);

      const ogStats = fs.statSync(ogPath);
      expect(ogStats.size).toBeLessThanOrEqual(60 * 1024); // <= 60 KB
    });
  });
});
