import { describe, it, expect } from 'vitest';
import * as siteConfig from '../../src/config/site';

describe('site configuration (src/config/site.ts)', () => {
  it('exports required application and author metadata', () => {
    expect(siteConfig.SITE_NAME).toBe('AirWise');
    expect(typeof siteConfig.SITE_TAGLINE).toBe('string');
    expect(siteConfig.SITE_TAGLINE.length).toBeGreaterThan(0);
    expect(siteConfig.SITE_URL).toMatch(/^https?:\/\//);
    expect(siteConfig.REPO_URL).toMatch(/^https?:\/\//);
    expect(typeof siteConfig.OWNER_NAME).toBe('string');
    expect(siteConfig.CONTACT_EMAIL).toContain('@');
    expect(siteConfig.TERMS_JURISDICTION).toBe('India');
    expect(siteConfig.LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('exports mandatory attribution and medical disclaimers', () => {
    expect(siteConfig.OPEN_METEO_ATTRIBUTION).toContain('Open-Meteo');
    expect(siteConfig.OPEN_METEO_ATTRIBUTION).toContain('Copernicus');
    expect(siteConfig.DISCLAIMER_TEXT).toContain('informational only');
    expect(siteConfig.DISCLAIMER_TEXT).toContain('does not provide medical advice');
    expect(siteConfig.EMERGENCY_NOTICE).toContain('emergency services');
  });
});
