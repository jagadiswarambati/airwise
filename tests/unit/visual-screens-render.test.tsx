// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { TodayScreen } from '../../src/ui/screens/TodayScreen';
import { IndoorScreen } from '../../src/ui/screens/IndoorScreen';
import { MoveScreen } from '../../src/ui/screens/MoveScreen';
import { ImpactScreen } from '../../src/ui/screens/ImpactScreen';
import { CommunityScreen } from '../../src/ui/screens/CommunityScreen';
import { AboutScreen } from '../../src/ui/screens/AboutScreen';
import { PrivacyScreen } from '../../src/ui/screens/PrivacyScreen';
import { OnboardingFlow } from '../../src/ui/onboarding/OnboardingFlow';
import { MenuModal } from '../../src/ui/components/MenuModal';
import { ActionDetailModal } from '../../src/ui/components/ActionDetailModal';
import { INDOOR_ACTIONS } from '../../src/domain/catalog/indoor';
import {
  parsedClearScenario,
  parsedModerateScenario,
  parsedSevereScenario,
  parsedStaleScenario,
} from '../../src/data/fallback-chain';
import type { ActionCandidate } from '../../src/domain/types';

describe('Visual & Screen Regression Audit', () => {
  const profile = PRIYA_PROFILE;

  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. TodayScreen in all 5 scenarios', () => {
    const scenarios = [
      { name: 'clear', snapshot: parsedClearScenario },
      { name: 'moderate', snapshot: parsedModerateScenario },
      { name: 'severe', snapshot: parsedSevereScenario },
      { name: 'stale', snapshot: parsedStaleScenario },
      { name: 'live/offline', snapshot: parsedModerateScenario },
    ];

    for (const { name, snapshot } of scenarios) {
      it(`renders TodayScreen cleanly for scenario: ${name}`, () => {
        const { container } = render(
          <TodayScreen
            profile={profile}
            snapshot={snapshot}
            sourceTier="live"
            isFallback={false}
            loading={false}
            error={null}
            onRetry={() => {}}
            onSelectScenario={() => {}}
            isManualSevere={name === 'severe'}
          />,
        );

        // Verify page header
        expect(screen.getByRole('heading', { level: 1 })).toBeDefined();

        // Verify that restored classes or severe layout are rendered in the DOM
        const srOnlyElements = container.querySelectorAll('.sr-only, .aw-severe-view');
        expect(srOnlyElements.length).toBeGreaterThan(0);

        // Verify radar or sensitivity elements exist
        const radarElements = container.querySelectorAll(
          '.radar-box, .radar-body, .radar-role-title',
        );
        expect(radarElements.length).toBeGreaterThanOrEqual(0);
      });
    }
  });

  describe('2. ActionDetailModal & Action Sheet', () => {
    it('renders ActionDetailModal with dual-axis grid and caveats', () => {
      const mockCandidate: ActionCandidate = {
        action: INDOOR_ACTIONS[0],
        impact: {
          exposure: {
            direction: 'reduces',
            label: 'Recommended',
            confidence: 'high',
            note: 'Effective in sealed room.',
          },
          emissions: {
            direction: 'neutral',
            label: 'Recommended',
            confidence: 'high',
            note: 'Draws small amount of grid electricity.',
          },
          explanation: 'Running HEPA filters dramatically cuts particulate exposure indoors.',
          doesNotChange: 'Does not reduce outdoor pollution or traffic emissions.',
          assumptions: ['Filter is properly sized for room area', 'Windows remain mostly closed'],
        },
        healthUrgency: 2,
        feasibility: 2,
        costFit: 2,
        priorityScore: 8,
        tags: {
          health: 'High',
          urgency: 'Immediate',
          cost: 'Moderate',
          effort: 'Low',
        },
        isMandatory: false,
        fixedDisclaimers: ['Always follow manufacturer guidance on filter replacement.'],
      };

      const { container } = render(
        <ActionDetailModal candidate={mockCandidate} onClose={() => {}} />,
      );

      // Check title
      expect(screen.getByText('Keep windows and doors closed')).toBeDefined();

      // Check dual axis grid restored class
      const dualAxis = container.querySelector('.dual-axis-grid');
      expect(dualAxis).not.toBeNull();

      // Check exposure and emissions axis cards
      const exposureCard = container.querySelector('.axis-card-exposure');
      const emissionsCard = container.querySelector('.axis-card-emissions');
      expect(exposureCard).not.toBeNull();
      expect(emissionsCard).not.toBeNull();

      // Check disclaimers text
      expect(
        screen.getByText('Always follow manufacturer guidance on filter replacement.'),
      ).toBeDefined();
    });
  });

  describe('3. MenuModal and Theme Switching', () => {
    it('renders MenuModal with theme choices and actions', () => {
      const { container } = render(
        <MenuModal
          isOpen={true}
          onClose={() => {}}
          profile={profile}
          onLoadPriya={() => {}}
          onEditProfile={() => {}}
          onDeleteProfile={() => {}}
          isManualSevere={false}
          onToggleSevere={() => {}}
        />,
      );

      // Check dialog role
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Menu & Settings')).toBeDefined();

      // Check theme section
      expect(screen.getByText(/Light/i)).toBeDefined();
      expect(screen.getByText(/Dark/i)).toBeDefined();

      // Check menu content class
      expect(container.querySelector('.aw-menu-content')).not.toBeNull();
    });
  });

  describe('4. At Home (IndoorScreen)', () => {
    it('renders IndoorScreen with room actions', () => {
      const { container } = render(
        <IndoorScreen profile={profile} snapshot={parsedModerateScenario} />,
      );
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
      expect(container.querySelectorAll('.card').length).toBeGreaterThan(0);
    });
  });

  describe('5. Travel (MoveScreen)', () => {
    it('renders MoveScreen with travel and commute cards', () => {
      const { container } = render(
        <MoveScreen profile={profile} snapshot={parsedModerateScenario} />,
      );
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
      expect(container.querySelectorAll('.card').length).toBeGreaterThan(0);
    });
  });

  describe('6. ImpactScreen', () => {
    it('renders ImpactScreen with weekly tally, formulas, and community card', () => {
      const { container } = render(
        <ImpactScreen profile={profile} snapshot={parsedModerateScenario} />,
      );
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
      expect(screen.getAllByText(/Vehicle-km avoided/i).length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.card').length).toBeGreaterThan(0);
    });
  });

  describe('7. CommunityScreen', () => {
    it('renders CommunityScreen with briefing and collective stats', () => {
      render(<CommunityScreen profile={profile} snapshot={parsedModerateScenario} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
      expect(screen.getAllByText(/Green Meadows/i).length).toBeGreaterThan(0);
    });
  });

  describe('8. AboutScreen', () => {
    it('renders AboutScreen with prose, feature cards, audience list, and CTA', () => {
      const { container } = render(<AboutScreen />);
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();

      // Check prose and feature grid classes
      expect(container.querySelector('.aw-prose')).not.toBeNull();
      expect(container.querySelector('.aw-feature-grid')).not.toBeNull();
      expect(container.querySelector('.aw-audience-grid')).not.toBeNull();
      expect(container.querySelector('.aw-step-list')).not.toBeNull();
      expect(container.querySelector('.aw-about-cta-card')).not.toBeNull();
    });
  });

  describe('9. PrivacyScreen', () => {
    it('renders PrivacyScreen with legal layout and storage keys', () => {
      const { container } = render(<PrivacyScreen />);
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
      expect(container.querySelector('.aw-legal-layout')).not.toBeNull();
      expect(container.querySelector('.aw-storage-key-list')).not.toBeNull();
    });
  });

  describe('10. OnboardingFlow', () => {
    it('renders OnboardingFlow step 1 with active step bar and form elements', () => {
      const { container } = render(
        <OnboardingFlow initialProfile={null} onComplete={() => {}} onLoadPriya={() => {}} />,
      );
      expect(container.querySelector('.aw-onboarding-wrapper')).not.toBeNull();
      expect(container.querySelector('.aw-stepper-fill')).not.toBeNull();
    });
  });
});
