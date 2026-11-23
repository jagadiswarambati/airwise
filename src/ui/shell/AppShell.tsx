import React, { useState } from 'react';
import { AppRoute } from '../../state/route';
import { ScenarioType } from '../../data/fallback-chain';
import { SkipLink } from './SkipLink';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { LiveRegion } from '../components/LiveRegion';
import { DemoSheet } from '../components/DemoSheet';

interface AppShellProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
  onOpenMenu: () => void;
  children: React.ReactNode;
}

/**
 * Responsive AppShell orchestrating SkipLink, Header, main content,
 * Footer, BottomNav (<1024px), LiveRegion, and DemoSheet modal.
 */
export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  currentScenario,
  onSelectScenario,
  onOpenMenu,
  children,
}) => {
  const [isDemoSheetOpen, setIsDemoSheetOpen] = useState<boolean>(false);

  return (
    <div className="aw-shell">
      <SkipLink />
      <LiveRegion />

      <Header
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        currentScenario={currentScenario}
        onOpenDemoSheet={() => setIsDemoSheetOpen(true)}
        onExitDemo={() => onSelectScenario('live')}
        onOpenMenu={onOpenMenu}
      />

      <main id="main" className="aw-main" tabIndex={-1}>
        <div className="aw-container aw-main-container">{children}</div>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* Fixed bottom navigation for screens <1024px */}
      <BottomNav currentRoute={currentRoute} onNavigate={onNavigate} />

      {/* Demo Scenario Switcher Sheet */}
      <DemoSheet
        isOpen={isDemoSheetOpen}
        onClose={() => setIsDemoSheetOpen(false)}
        currentScenario={currentScenario}
        onSelectScenario={onSelectScenario}
      />
    </div>
  );
};
