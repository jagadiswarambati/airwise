import React from 'react';
import { SkipLink } from './SkipLink';
import { Icon } from '../icons';

export interface OnboardingShellProps {
  onCancel?: () => void;
  children: React.ReactNode;
}

export function OnboardingShell({ onCancel, children }: OnboardingShellProps) {
  return (
    <div className="aw-shell">
      <SkipLink />
      <header className="aw-header">
        <div className="aw-container aw-header-inner">
          <div className="aw-brand">
            <div className="aw-brand-icon">
              <Icon name="wind" size={24} aria-hidden="true" />
            </div>
            <span className="aw-brand-title">AirWise Onboarding</span>
          </div>
          {onCancel && (
            <button
              type="button"
              className="aw-btn aw-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      <main id="main" className="aw-main" tabIndex={-1}>
        <div className="aw-container aw-main-container">{children}</div>
      </main>
    </div>
  );
}
