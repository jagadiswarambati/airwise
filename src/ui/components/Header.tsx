import React from 'react';
import { ScenarioType } from '../../data/fallback-chain';

interface HeaderProps {
  currentScenario: ScenarioType;
  onSelectScenario: (s: ScenarioType) => void;
  isManualSevere: boolean;
  onToggleSevere: () => void;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  onSelectScenario,
  isManualSevere,
  onToggleSevere,
  onOpenMenu,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <span style={{ fontSize: '1.35rem' }} aria-hidden="true">🍃</span>
        <span className="brand-title">AirWise</span>
      </div>

      <div className="header-controls">
        {/* Scenario Switcher */}
        <select
          value={currentScenario}
          onChange={(e) => onSelectScenario(e.target.value as ScenarioType)}
          className="select-scenario"
          aria-label="Select evaluation air scenario"
        >
          <option value="live">Live Air</option>
          <option value="clear">Demo: Clear</option>
          <option value="moderate">Demo: Moderate</option>
          <option value="severe">Demo: Severe</option>
          <option value="stale">Demo: Stale</option>
        </select>

        {/* Severe Mode Manual Toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={onToggleSevere}
          aria-label={isManualSevere ? 'Disable Severe Smog Mode' : 'Enable Severe Smog Mode'}
          title={isManualSevere ? 'Severe Mode Active' : 'Toggle Severe Mode'}
          style={{
            backgroundColor: isManualSevere ? 'var(--level-4-bg)' : undefined,
            color: isManualSevere ? 'var(--level-4-text)' : undefined,
          }}
        >
          <span aria-hidden="true">🚨</span>
        </button>

        {/* Menu & Settings */}
        <button
          type="button"
          className="btn-icon"
          onClick={onOpenMenu}
          aria-label="Open household menu and settings"
        >
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>☰</span>
        </button>
      </div>
    </header>
  );
};

