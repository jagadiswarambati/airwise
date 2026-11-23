import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Header } from '../../src/ui/shell/Header';
import { TopNav } from '../../src/ui/shell/TopNav';
import { BottomNav } from '../../src/ui/shell/BottomNav';
import { PageHeader } from '../../src/ui/shell/PageHeader';
import { Footer } from '../../src/ui/shell/Footer';
import { SkipLink } from '../../src/ui/shell/SkipLink';
import { REPO_URL } from '../../src/config/site';

describe('Shell Layout & Semantic Accessibility', () => {
  describe('SkipLink', () => {
    it('renders a skip link targeting #main', () => {
      const html = renderToString(<SkipLink />);
      expect(html).toContain('href="#main"');
      expect(html).toContain('Skip to main content');
    });
  });

  describe('Header', () => {
    it('renders sticky header with brand, controls, and demo button', () => {
      const html = renderToString(
        <Header
          currentRoute="today"
          currentScenario="live"
          onOpenDemoSheet={() => {}}
          onExitDemo={() => {}}
          onOpenMenu={() => {}}
        />,
      );

      expect(html).toContain('AirWise');
      expect(html).toContain('href="#/today"');
      expect(html).toContain('Demo data');
      expect(html).toContain('Menu');
    });

    it('renders active demo data banner when currentScenario is not live', () => {
      const html = renderToString(
        <Header
          currentRoute="today"
          currentScenario="severe"
          onOpenDemoSheet={() => {}}
          onExitDemo={() => {}}
          onOpenMenu={() => {}}
        />,
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('You are viewing demo data');
      expect(html).toContain('Severe Smog');
      expect(html).toContain('Exit demo');
    });
  });

  describe('Navigation: TopNav and BottomNav', () => {
    it('renders TopNav with semantic nav, ul, and aria-current="page"', () => {
      const html = renderToString(<TopNav currentRoute="indoor" />);
      expect(html).toContain('aria-label="Main"');
      expect(html).toContain('<ul');
      expect(html).toContain('href="#/indoor" aria-current="page"');
      expect(html).toContain('At home');
      expect(html).toContain('href="#/move"');
    });

    it('renders BottomNav with 5 equal tabs and aria-current="page"', () => {
      const html = renderToString(<BottomNav currentRoute="impact" />);
      expect(html).toContain('aria-label="Main"');
      expect(html).toContain('<ul');
      expect(html).toContain('href="#/impact" aria-current="page"');
      expect(html).toContain('Today');
      expect(html).toContain('At home');
      expect(html).toContain('Travel');
      expect(html).toContain('Impact');
      expect(html).toContain('Community');
    });
  });

  describe('PageHeader', () => {
    it('renders h1 with tabIndex=-1 for accessible programmatic focus', () => {
      const html = renderToString(
        <PageHeader title="Today's Clean-Air Plan" description="What to do for clean air today." />,
      );

      expect(html).toContain('<h1 tabindex="-1"');
      expect(html).toContain('Today&#x27;s Clean-Air Plan');
      expect(html).toContain('What to do for clean air today.');
    });

    it('renders low-cost mode chip when active', () => {
      const html = renderToString(
        <PageHeader
          title="Today's Clean-Air Plan"
          description="Description text"
          isLowCostMode={true}
        />,
      );

      expect(html).toContain('Low-cost mode on');
      expect(html).toContain('role="status"');
    });
  });

  describe('Footer', () => {
    it('renders informational disclaimer and required navigation links', () => {
      const html = renderToString(<Footer />);

      expect(html).toContain('<footer');
      expect(html).toContain('AirWise is informational only and does not provide medical advice.');
      expect(html).toContain('href="#/about"');
      expect(html).toContain('href="#/privacy"');
      expect(html).toContain('href="#/terms"');
      expect(html).toContain('href="#/today"');
      expect(html).toContain(`href="${REPO_URL}"`);
    });
  });
});
