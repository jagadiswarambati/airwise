import React from 'react';
import { Sheet } from './Sheet';
import { ScenarioType } from '../../data/fallback-chain';
import { Icon, IconName } from '../icons';

interface DemoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
}

interface ScenarioOption {
  id: ScenarioType;
  label: string;
  tagline: string;
  description: string;
  icon: IconName;
}

const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: 'clear',
    label: 'Clear Day',
    tagline: 'Ideal air quality conditions',
    description: 'PM2.5 ~ 12 µg/m³. Full outdoor freedom, low risk across all routine windows.',
    icon: 'clear',
  },
  {
    id: 'moderate',
    label: 'Moderate Haze',
    tagline: 'Typical urban air with morning spikes',
    description: 'PM2.5 ~ 52 µg/m³. Ventilation window around midday, caution on early school walks.',
    icon: 'caution',
  },
  {
    id: 'severe',
    label: 'Severe Smog',
    tagline: 'Emergency episode (P-01 active)',
    description: 'PM2.5 ~ 240 µg/m³. Outdoor exertion prohibited, indoor filtration mandatory.',
    icon: 'severe',
  },
  {
    id: 'stale',
    label: 'Stale / Unverified',
    tagline: 'Outdated readings (>12h old)',
    description: 'Capped confidence, outdoor walk/ventilation recommendations suppressed.',
    icon: 'warning',
  },
];

export const DemoSheet: React.FC<DemoSheetProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario,
}) => {
  const handleSelect = (scenario: ScenarioType) => {
    onSelectScenario(scenario);
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Demo Scenarios"
      subtitle="Explore how AirWise adapts recommendations across different air conditions"
      footer={
        <div className="aw-demo-sheet-footer">
          {currentScenario !== 'live' && (
            <button
              type="button"
              className="aw-btn aw-btn-secondary w-full"
              onClick={() => handleSelect('live')}
            >
              Back to live data
            </button>
          )}
          <button
            type="button"
            className="aw-btn aw-btn-quiet w-full"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      }
    >
      <div className="aw-demo-scenarios-list" role="radiogroup" aria-label="Demo scenarios">
        {SCENARIO_OPTIONS.map((option) => {
          const isSelected = currentScenario === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`aw-scenario-card ${isSelected ? 'aw-scenario-card-selected' : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              <div className="aw-scenario-icon-wrapper">
                <Icon name={option.icon} size={22} aria-hidden="true" />
              </div>
              <div className="aw-scenario-details">
                <div className="aw-scenario-title-row">
                  <span className="aw-scenario-title">{option.label}</span>
                  {isSelected && (
                    <span className="aw-scenario-badge">Active</span>
                  )}
                </div>
                <div className="aw-scenario-tagline">{option.tagline}</div>
                <div className="aw-scenario-desc">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
};
