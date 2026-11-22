import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security Headers Verification (vercel.json vs SECURITY_PRIVACY.md §9)', () => {
  const vercelPath = path.resolve(__dirname, '../../vercel.json');

  it('exists and has valid JSON structure', () => {
    expect(fs.existsSync(vercelPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    expect(content.headers).toBeDefined();
    expect(Array.isArray(content.headers)).toBe(true);
  });

  it('matches all mandatory security headers specified in SECURITY_PRIVACY.md §9', () => {
    const config = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    const allRoutesRule = config.headers.find(
      (h: { source: string; headers: Array<{ key: string; value: string }> }) =>
        h.source === '/(.*)' || h.source === '/(.*)?',
    );
    expect(allRoutesRule).toBeDefined();

    const headersMap: Record<string, string> = {};
    for (const h of allRoutesRule.headers) {
      headersMap[h.key] = h.value;
    }

    // 1. Content-Security-Policy
    expect(headersMap['Content-Security-Policy']).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    );

    // 2. X-Content-Type-Options
    expect(headersMap['X-Content-Type-Options']).toBe('nosniff');

    // 3. Referrer-Policy
    expect(headersMap['Referrer-Policy']).toBe('no-referrer');

    // 4. Permissions-Policy
    expect(headersMap['Permissions-Policy']).toBe(
      'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
    );

    // 5. Cross-Origin-Opener-Policy
    expect(headersMap['Cross-Origin-Opener-Policy']).toBe('same-origin');

    // 6. Strict-Transport-Security
    expect(headersMap['Strict-Transport-Security']).toBe('max-age=31536000');
  });
});
