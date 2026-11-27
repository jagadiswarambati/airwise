// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers.js';
import 'vitest-axe/extend-expect';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Assertion<R extends void | Promise<void> = void, T = unknown> {
    toHaveNoViolations(): R;
  }
  export interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

import { AboutScreen } from '../../src/ui/screens/AboutScreen';
import { TodayScreen } from '../../src/ui/screens/TodayScreen';
import { IndoorScreen } from '../../src/ui/screens/IndoorScreen';
import { MoveScreen } from '../../src/ui/screens/MoveScreen';
import { ImpactScreen } from '../../src/ui/screens/ImpactScreen';
import { CommunityScreen } from '../../src/ui/screens/CommunityScreen';
import { PrivacyScreen } from '../../src/ui/screens/PrivacyScreen';
import { TermsScreen } from '../../src/ui/screens/TermsScreen';
import { OnboardingFlow } from '../../src/ui/onboarding/OnboardingFlow';
import { ActionDetailModal } from '../../src/ui/components/ActionDetailModal';
import { MenuModal } from '../../src/ui/components/MenuModal';

import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import { parsedModerateScenario, parsedSevereScenario } from '../../src/data/fallback-chain';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';

expect.extend(matchers);

describe('Automated Axe Accessibility Audits (WCAG 2.2 AA)', { timeout: 30000 }, () => {
  const profile = PRIYA_PROFILE;

  beforeEach(() => {
    localStorage.clear();
  });

  it('reports zero violations on About screen', async () => {
    const { container } = render(<AboutScreen />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Today screen (moderate scenario)', async () => {
    const { container } = render(
      <TodayScreen
        profile={profile}
        snapshot={parsedModerateScenario}
        sourceTier="live"
        isFallback={false}
        loading={false}
        error={null}
        onRetry={() => {}}
        onSelectScenario={() => {}}
        isManualSevere={false}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Today screen (severe scenario)', async () => {
    const { container } = render(
      <TodayScreen
        profile={profile}
        snapshot={parsedSevereScenario}
        sourceTier="live"
        isFallback={false}
        loading={false}
        error={null}
        onRetry={() => {}}
        onSelectScenario={() => {}}
        isManualSevere={true}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Indoor screen', async () => {
    const { container } = render(
      <IndoorScreen profile={profile} snapshot={parsedModerateScenario} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Move screen', async () => {
    const { container } = render(
      <MoveScreen profile={profile} snapshot={parsedModerateScenario} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Impact screen', async () => {
    const { container } = render(
      <ImpactScreen profile={profile} snapshot={parsedModerateScenario} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Community screen', async () => {
    const { container } = render(
      <CommunityScreen profile={profile} snapshot={parsedModerateScenario} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Privacy screen', async () => {
    const { container } = render(<PrivacyScreen />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on Terms screen', async () => {
    const { container } = render(<TermsScreen />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on an open ActionDetailModal dialog', async () => {
    const plan = buildDeterministicPlan(profile, parsedModerateScenario);
    const candidate = plan.topActions[0];
    const { container } = render(<ActionDetailModal candidate={candidate} onClose={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero violations on an open MenuModal dialog', async () => {
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
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Onboarding Steps 1 to 5 axe audits', () => {
    it('reports zero violations on Onboarding Step 1 (Where)', async () => {
      const { container } = render(
        <OnboardingFlow initialProfile={profile} onComplete={() => {}} onLoadPriya={() => {}} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('reports zero violations on Onboarding Step 2 (Household)', async () => {
      const user = userEvent.setup();
      const { container, findByRole, getByRole } = render(
        <OnboardingFlow initialProfile={profile} onComplete={() => {}} onLoadPriya={() => {}} />,
      );
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /who lives here/i });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('reports zero violations on Onboarding Step 3 (Home)', async () => {
      const user = userEvent.setup();
      const { container, findByRole, getByRole } = render(
        <OnboardingFlow initialProfile={profile} onComplete={() => {}} onLoadPriya={() => {}} />,
      );
      // Step 1 -> 2
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /who lives here/i });
      // Step 2 -> 3
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /your home/i });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('reports zero violations on Onboarding Step 4 (Commute)', async () => {
      const user = userEvent.setup();
      const { container, findByRole, getByRole } = render(
        <OnboardingFlow initialProfile={profile} onComplete={() => {}} onLoadPriya={() => {}} />,
      );
      // Step 1 -> 2
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /who lives here/i });
      // Step 2 -> 3
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /your home/i });
      // Step 3 -> 4
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /commute & travel/i });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('reports zero violations on Onboarding Step 5 (Routine)', async () => {
      const user = userEvent.setup();
      const { container, findByRole, getByRole } = render(
        <OnboardingFlow initialProfile={profile} onComplete={() => {}} onLoadPriya={() => {}} />,
      );
      // Step 1 -> 2
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /who lives here/i });
      // Step 2 -> 3
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /your home/i });
      // Step 3 -> 4
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /commute & travel/i });
      // Step 4 -> 5
      await user.click(getByRole('button', { name: /^continue$/i }));
      await findByRole('heading', { level: 1, name: /daily routine/i });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
