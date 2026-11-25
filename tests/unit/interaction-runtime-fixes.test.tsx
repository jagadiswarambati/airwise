// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePersonalizedPlan } from '../../src/ui/hooks/usePersonalizedPlan';
import { SkipLink } from '../../src/ui/shell/SkipLink';
import { Dialog } from '../../src/ui/components/Dialog';
import { useRoute, parseRouteFromHash } from '../../src/state/route';
import { type Plan } from '../../src/domain/types';

describe('Runtime Interaction Bug Fixes', () => {
  beforeEach(() => {
    window.location.hash = '';
    document.title = 'AirWise';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bug 1: Loading render loop in usePersonalizedPlan', () => {
    let renderCount = 0;

    function LoadingConsumer({ plan }: { plan: Plan | null }) {
      renderCount++;
      const result = usePersonalizedPlan(plan, null, null, [], null, true);
      return <div data-testid="plan-status">{result.plan ? 'ready' : 'loading'}</div>;
    }

    it('renders once while loading and never loops or sets state when basePlan is null', async () => {
      renderCount = 0;
      render(<LoadingConsumer plan={null} />);

      const statusEl = screen.getByTestId('plan-status');
      expect(statusEl.textContent).toBe('loading');

      // Wait 100ms to verify no scheduled effects or state loops trigger re-render
      await new Promise((r) => setTimeout(r, 100));

      expect(renderCount).toBe(1);
    });
  });

  describe('Bug 2: Skip link & stray anchor hash routing', () => {
    it('skip link focuses <main> and does not trigger hash routing', async () => {
      window.location.hash = '#/about';
      const user = userEvent.setup();

      render(
        <div>
          <SkipLink />
          <main id="main">
            <h1>About AirWise</h1>
          </main>
        </div>,
      );

      const link = screen.getByRole('link', { name: /skip to main content/i });
      const main = document.getElementById('main')!;

      await user.click(link);

      expect(document.activeElement).toBe(main);
      expect(window.location.hash).toBe('#/about');
    });

    it('parseRouteFromHash preserves current active route on in-page anchor hash', () => {
      expect(parseRouteFromHash('#main', 'impact')).toBe('impact');
      expect(parseRouteFromHash('#footnote-1', 'about')).toBe('about');
      expect(parseRouteFromHash('#/terms', 'about')).toBe('terms');
      expect(parseRouteFromHash('', 'today')).toBe('today');
    });

    it('stray in-page anchor hashchange is ignored without navigating away from active screen', async () => {
      window.location.hash = '#/impact';

      function RouteApp() {
        const { route } = useRoute();
        return (
          <div>
            <main id="main">
              <h1>Active screen: {route}</h1>
            </main>
          </div>
        );
      }

      render(<RouteApp />);

      await vi.waitFor(() => {
        expect(document.querySelector('main h1')?.textContent).toBe('Active screen: impact');
      });

      // Simulate stray in-page anchor change to #main
      act(() => {
        window.location.hash = '#main';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await new Promise((r) => setTimeout(r, 60));

      // Active screen remains 'impact'
      expect(document.querySelector('main h1')?.textContent).toBe('Active screen: impact');
    });
  });

  describe('Bug 3: Initial route focus and navigation focus', () => {
    it('route change moves focus to h1; initial load does not', async () => {
      window.location.hash = '#/today';
      const user = userEvent.setup();

      function RouteApp() {
        const { route, navigate } = useRoute();
        return (
          <div>
            <button id="nav-btn" onClick={() => navigate('impact')}>
              Go to Impact
            </button>
            <main id="main">
              <h1>{route === 'today' ? 'Today Header' : 'Impact Header'}</h1>
            </main>
          </div>
        );
      }

      // Initial element with focus before mount
      const externalButton = document.createElement('button');
      externalButton.id = 'external-btn';
      document.body.appendChild(externalButton);
      externalButton.focus();
      expect(document.activeElement).toBe(externalButton);

      render(<RouteApp />);

      // Wait 100ms past any initial route timers (50ms)
      await new Promise((r) => setTimeout(r, 100));

      // Initial load must NOT move focus to main h1
      const initialH1 = document.querySelector('main h1');
      expect(document.activeElement).not.toBe(initialH1);

      // Now click navigate button to trigger real route change
      const navBtn = document.getElementById('nav-btn')!;
      await user.click(navBtn);

      // Transition to new screen must move focus to main h1
      await vi.waitFor(
        () => {
          const impactH1 = document.querySelector('main h1');
          expect(impactH1?.textContent).toBe('Impact Header');
          expect(document.activeElement).toBe(impactH1);
        },
        { timeout: 500 },
      );

      document.body.removeChild(externalButton);
    });
  });

  describe('Bug 4: Dialog focus trap, inline onClose, and inert attribute', () => {
    function ParentComponent() {
      const [isOpen, setIsOpen] = useState(false);
      const [tick, setTick] = useState(0);

      return (
        <div id="app-root">
          <button id="opener-btn" onClick={() => setIsOpen(true)}>
            Open Dialog
          </button>
          <button id="rerender-btn" onClick={() => setTick((t) => t + 1)}>
            Re-render {tick}
          </button>
          <main id="background-main">
            <p>Background Content</p>
          </main>
          <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <button id="dialog-btn-1">Dialog First</button>
            <input id="dialog-input-2" placeholder="Second item" />
            <button id="dialog-close-btn" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </Dialog>
        </div>
      );
    }

    it('keeps focus on whatever element was focused inside dialog when parent re-renders, and restores focus on close', async () => {
      const user = userEvent.setup();
      render(<ParentComponent />);

      const opener = document.getElementById('opener-btn')!;
      opener.focus();
      expect(document.activeElement).toBe(opener);

      // 1. Open dialog
      await user.click(opener);

      // Dialog auto-focuses first focusable item after 30ms
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(document.getElementById('dialog-btn-1'));
      });

      // Background elements must be marked inert
      const backgroundMain = document.getElementById('background-main')!;
      expect(backgroundMain.hasAttribute('inert')).toBe(true);
      expect(opener.hasAttribute('inert')).toBe(true);

      // 2. User moves focus to the second control
      const input2 = document.getElementById('dialog-input-2')!;
      input2.focus();
      expect(document.activeElement).toBe(input2);

      // 3. Parent re-renders (simulating state change with fresh inline onClose arrow function)
      const rerenderBtn = document.getElementById('rerender-btn')!;
      act(() => {
        rerenderBtn.click();
      });

      // Wait 60ms to confirm the focus trap did NOT reset focus back to dialog-btn-1
      await new Promise((r) => setTimeout(r, 60));
      expect(document.activeElement).toBe(input2);

      // 4. Press Escape to close dialog
      await user.keyboard('{Escape}');

      // Background elements must have inert removed
      expect(backgroundMain.hasAttribute('inert')).toBe(false);
      expect(opener.hasAttribute('inert')).toBe(false);

      // Focus must be restored back to opener
      expect(document.activeElement).toBe(opener);
    });
  });
});
