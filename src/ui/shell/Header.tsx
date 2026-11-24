import React from 'react';
import { type AppRoute } from '../../state/route';
import { type ScenarioType } from '../../data/fallback-chain';
import { Icon } from '../icons';
import { TopNav } from './TopNav';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate?: (route: AppRoute) => void;
  currentScenario: ScenarioType;
  onOpenDemoSheet: () => void;
  onExitDemo: () => void;
  onOpenMenu: () => void;
}

const SCENARIO_NAMES: Record<ScenarioType, string> = {
  live: 'Live Air',
  clear: 'Clear Day',
  moderate: 'Moderate Haze',
  severe: 'Severe Smog',
  stale: 'Stale / Unverified',
};

/**
 * Primary sticky application header (64px desktop / 56px mobile).
 * Features brand anchor, desktop top nav links, Demo switcher button,
 * and Menu button with visible text label at >=768px.
 */
export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  currentScenario,
  onOpenDemoSheet,
  onExitDemo,
  onOpenMenu,
}) => {
  const isDemoActive = currentScenario !== 'live';

  return (
    <div className="aw-header-wrapper">
      <header className="aw-header">
        <div className="aw-container aw-header-inner">
          {/* Brand */}
          <a
            href="#/today"
            className="aw-brand"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('today');
              }
            }}
            aria-label="AirWise Home"
          >
            <div className="aw-brand-icon">
              <Icon name="wind" size={24} aria-hidden="true" />
            </div>
            <span className="aw-brand-title">AirWise</span>
          </a>

          {/* Desktop Top Navigation (>=1024px) */}
          <div className="aw-header-nav-desktop">
            <TopNav currentRoute={currentRoute} onNavigate={onNavigate} />
          </div>

          {/* Controls */}
          <div className="aw-header-controls">
            {/* Demo Data Button */}
            <button
              type="button"
              className={`aw-btn ${isDemoActive ? 'aw-btn-primary' : 'aw-btn-secondary'} aw-header-btn-demo`}
              onClick={onOpenDemoSheet}
              aria-label={`Demo data settings. Current: ${SCENARIO_NAMES[currentScenario]}`}
            >
              <Icon name="caution" size={16} aria-hidden="true" />
              <span className="aw-header-btn-label">
                {isDemoActive ? SCENARIO_NAMES[currentScenario] : 'Demo data'}
              </span>
            </button>

            {/* Menu Button (visible label at >=768px) */}
            <button
              type="button"
              className="aw-btn aw-btn-quiet aw-header-btn-menu"
              onClick={onOpenMenu}
              aria-label="Open menu and settings"
            >
              <Icon name="menu" size={20} aria-hidden="true" />
              <span className="aw-header-menu-label">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slim Active Demo Notification Strip */}
      {isDemoActive && (
        <aside
          role="status"
          aria-label="Demo mode notice"
          className="aw-demo-strip"
        >
          <div className="aw-container aw-demo-strip-inner">
            <div className="aw-demo-strip-text">
              <Icon name="info" size={16} aria-hidden="true" />
              <span>
                You are viewing demo data (
                <strong>{SCENARIO_NAMES[currentScenario]}</strong>).
              </span>
            </div>
            <button
              type="button"
              className="aw-btn aw-btn-quiet aw-demo-strip-exit"
              onClick={onExitDemo}
            >
              Exit demo
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
