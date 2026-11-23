import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Dialog } from '../../src/ui/components/Dialog';
import { Sheet } from '../../src/ui/components/Sheet';
import { DemoSheet } from '../../src/ui/components/DemoSheet';

describe('Accessible Dialog & Sheet Primitives', () => {
  it('renders Dialog with role="dialog" and aria-modal="true" when open', () => {
    const html = renderToString(
      <Dialog isOpen={true} onClose={() => {}} titleId="test-dialog-title">
        <h2 id="test-dialog-title">Dialog Title</h2>
        <p>Dialog body text</p>
      </Dialog>,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="test-dialog-title"');
    expect(html).toContain('Dialog Title');
  });

  it('renders nothing when Dialog is not open', () => {
    const html = renderToString(
      <Dialog isOpen={false} onClose={() => {}}>
        <p>Hidden</p>
      </Dialog>,
    );

    expect(html).toBe('');
  });

  it('renders Sheet with header title, close button, and body', () => {
    const html = renderToString(
      <Sheet
        isOpen={true}
        onClose={() => {}}
        title="Settings & Menu"
        subtitle="Customise your experience"
      >
        <div>Sheet Content</div>
      </Sheet>,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Settings &amp; Menu');
    expect(html).toContain('Customise your experience');
    expect(html).toContain('aria-label="Close Settings &amp; Menu"');
    expect(html).toContain('Sheet Content');
  });

  it('renders DemoSheet with scenario options and radio group semantics', () => {
    const html = renderToString(
      <DemoSheet
        isOpen={true}
        onClose={() => {}}
        currentScenario="moderate"
        onSelectScenario={() => {}}
      />,
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('Demo Scenarios');
    expect(html).toContain('Clear Day');
    expect(html).toContain('Moderate Haze');
    expect(html).toContain('Severe Smog');
    expect(html).toContain('Stale / Unverified');
    expect(html).toContain('Back to live data');
  });
});
