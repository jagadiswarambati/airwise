// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkipLink } from '../../src/ui/shell/SkipLink';
import { Header } from '../../src/ui/shell/Header';
import { Dialog } from '../../src/ui/components/Dialog';
import { ActionDetailModal } from '../../src/ui/components/ActionDetailModal';
import { applyRouteEffects } from '../../src/state/route';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { parsedModerateScenario } from '../../src/data/fallback-chain';

describe('Keyboard Navigation & Focus Management (WCAG 2.2 AA)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tab Order Progression', () => {
    it('traverses Tab order starting at SkipLink, reaching Nav, then Primary Actions', async () => {
      const user = userEvent.setup();

      const TestHarness = () => {
        return (
          <div>
            <SkipLink />
            <Header
              currentRoute="today"
              onNavigate={() => {}}
              currentScenario="live"
              onOpenDemoSheet={() => {}}
              onExitDemo={() => {}}
              onOpenMenu={() => {}}
            />
            <main id="main">
              <h1>Today clean-air plan</h1>
              <button id="primary-action-1">Primary Action 1</button>
              <button id="primary-action-2">Primary Action 2</button>
            </main>
          </div>
        );
      };

      const { getByText } = render(<TestHarness />);

      // Initial focus on body
      document.body.focus();

      // Tab 1: Skip to main content link
      await user.tab();
      const skipLink = getByText('Skip to main content');
      expect(document.activeElement).toBe(skipLink);

      // Tab through Header links (Logo/Brand, Nav links, Menu button)
      let reachedNav = false;
      let reachedPrimaryAction = false;

      for (let i = 0; i < 15; i++) {
        await user.tab();
        const active = document.activeElement;
        if (active?.tagName.toLowerCase() === 'a' && active.textContent?.includes('Travel')) {
          reachedNav = true;
        }
        if (active?.id === 'primary-action-1') {
          reachedPrimaryAction = true;
          break;
        }
      }

      expect(reachedNav).toBe(true);
      expect(reachedPrimaryAction).toBe(true);
    });

    it('activates SkipLink to shift focus directly to main landmark', async () => {
      const user = userEvent.setup();

      const TestHarness = () => (
        <div>
          <SkipLink />
          <nav>
            <a href="#test1">Link 1</a>
            <a href="#test2">Link 2</a>
          </nav>
          <main id="main" tabIndex={-1}>
            <h1>Main Content</h1>
          </main>
        </div>
      );

      const { getByText } = render(<TestHarness />);
      const skipLink = getByText('Skip to main content');
      skipLink.focus();
      expect(document.activeElement).toBe(skipLink);

      await user.keyboard('{Enter}');
      const main = document.getElementById('main');
      expect(document.activeElement).toBe(main);
    });
  });

  describe('Dialog Escape & Focus Restoration', () => {
    it('closes Dialog on Escape and restores focus to the triggering element', async () => {
      const user = userEvent.setup();

      const DialogTriggerHarness = () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <div>
            <div id="app-background">
              <button id="open-dialog-btn" onClick={() => setIsOpen(true)}>
                Open Dialog Trigger
              </button>
            </div>
            <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} ariaLabel="Test Modal">
              <h2>Modal Heading</h2>
              <button id="dialog-confirm-btn" onClick={() => setIsOpen(false)}>
                Confirm
              </button>
            </Dialog>
          </div>
        );
      };

      const { getByRole } = render(<DialogTriggerHarness />);
      const openBtn = getByRole('button', { name: 'Open Dialog Trigger' });

      // Focus and click the trigger
      openBtn.focus();
      expect(document.activeElement).toBe(openBtn);
      await user.click(openBtn);

      // Dialog is open; focus moves inside dialog
      await waitFor(() => {
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        expect(document.activeElement).toBe(confirmBtn);
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Dialog is closed; focus returns to the opener trigger
      await waitFor(() => {
        expect(document.activeElement).toBe(openBtn);
      });
    });

    it('closes ActionDetailModal on Escape and restores focus to caller', async () => {
      const user = userEvent.setup();
      const plan = buildDeterministicPlan(PRIYA_PROFILE, parsedModerateScenario);
      const candidate = plan.topActions[0];

      const ActionModalHarness = () => {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button id="action-row-trigger" onClick={() => setOpen(true)}>
              View Action
            </button>
            {open && <ActionDetailModal candidate={candidate} onClose={() => setOpen(false)} />}
          </div>
        );
      };

      const { getByRole } = render(<ActionModalHarness />);
      const trigger = getByRole('button', { name: 'View Action' });
      trigger.focus();
      await user.click(trigger);

      // Modal is open
      await waitFor(() => {
        expect(document.querySelector('.aw-sheet')).not.toBeNull();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Modal closed and focus restored to trigger
      await waitFor(() => {
        expect(document.querySelector('.aw-sheet')).toBeNull();
        expect(document.activeElement).toBe(trigger);
      });
    });
  });

  describe('Route Change Focus to Page Heading', () => {
    it('moves focus to main h1 heading after route transition', async () => {
      document.body.innerHTML = `
        <main>
          <h1 tabindex="-1">At home</h1>
        </main>
      `;

      applyRouteEffects('indoor', true);

      await waitFor(() => {
        const h1 = document.querySelector('main h1');
        expect(document.activeElement).toBe(h1);
        expect(document.title).toBe('At home - AirWise');
      });
    });

    it('does not move focus when moveFocus is set to false (initial page load)', async () => {
      document.body.innerHTML = `
        <button id="initial-focused-elem">Start</button>
        <main>
          <h1 tabindex="-1">Today</h1>
        </main>
      `;
      const startBtn = document.getElementById('initial-focused-elem')!;
      startBtn.focus();
      expect(document.activeElement).toBe(startBtn);

      applyRouteEffects('today', false);

      // Wait 70ms (greater than timeout in applyRouteEffects)
      await new Promise((r) => setTimeout(r, 70));
      expect(document.activeElement).toBe(startBtn);
      expect(document.title).toBe('Today - AirWise');
    });
  });
});
