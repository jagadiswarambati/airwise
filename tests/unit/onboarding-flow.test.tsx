import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OnboardingFlow } from '../../src/ui/onboarding/OnboardingFlow';
import { PRIYA_PRESET } from '../../src/state/profileStore';

describe('OnboardingFlow Accessible Form (F6)', () => {
  it('renders Step 1 with single H1, Stepper, demo household button, and privacy consent', () => {
    const onLoadPriya = vi.fn();
    const onComplete = vi.fn();
    const onCancel = vi.fn();

    const html = renderToString(
      <OnboardingFlow
        onLoadPriya={onLoadPriya}
        onComplete={onComplete}
        onCancel={onCancel}
      />,
    );

    // 1. Layout & Stepper
    expect(html).toContain('aw-onboarding-wrapper');
    expect(html).toContain('aw-onboarding-container');
    expect(html).toContain('Step 1 of 5: Where you live');

    // 2. Exactly one H1
    const h1Matches = html.match(/<h1\b[^>]*>(.*?)<\/h1>/gi) || [];
    expect(h1Matches.length).toBe(1);
    expect(h1Matches[0]).toContain('Where you live');

    // 3. Demo household button with plain explanation (no child name)
    expect(html).toContain('Try a demo household');
    expect(html).toContain('Explore AirWise immediately using a pre-configured multi-generational household');

    // 4. Geocode search input with proper Field label
    expect(html).toContain('Search city or town');
    expect(html).toContain('for="city-search-input"');
    expect(html).toContain('id="city-search-input"');

    // 5. Use my location one-shot button
    expect(html).toContain('Use my location');
    expect(html).toContain('~1.1 km');

    // 6. Manual location coordinates within Fieldset
    expect(html).toContain('Selected location details');
    expect(html).toContain('for="location-label"');
    expect(html).toContain('id="location-label"');
    expect(html).toContain('for="location-lat"');
    expect(html).toContain('id="location-lat"');
    expect(html).toContain('for="location-lon"');
    expect(html).toContain('id="location-lon"');

    // 7. Privacy Disclosure and Consent Notice
    expect(html).toContain('Privacy &amp; data protection');
    expect(html).toContain('Stays on this device');
    expect(html).toContain('href="#/privacy"');
    expect(html).toContain('href="#/terms"');
    expect(html).toContain('href="#/about"');
    expect(html).toContain('By continuing, you agree to our');

    // 8. Buttons
    expect(html).toContain('Cancel');
    expect(html).toContain('Continue');
  });

  it('renders with initialProfile pre-populated', () => {
    const html = renderToString(
      <OnboardingFlow
        initialProfile={PRIYA_PRESET}
        onLoadPriya={() => {}}
        onComplete={() => {}}
      />,
    );

    expect(html).toContain('value="Hyderabad, India"');
    expect(html).toContain('value="17.38"');
    expect(html).toContain('value="78.48"');
  });

  it('ensures all interactive inputs in Step 1 have associated labels', () => {
    const html = renderToString(
      <OnboardingFlow
        onLoadPriya={() => {}}
        onComplete={() => {}}
      />,
    );

    // Verify all input elements have IDs that match a label's htmlFor
    const inputMatches = html.matchAll(/<input[^>]+id="([^"]+)"/g);
    for (const match of inputMatches) {
      const id = match[1];
      expect(html).toContain(`for="${id}"`);
    }
  });
});
