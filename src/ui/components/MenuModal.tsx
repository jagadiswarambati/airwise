import React, { useState, useEffect } from 'react';
import { HouseholdProfile } from '../../domain/types';
import { exportProfileJson, importProfileJson } from '../../state/profileStore';
import { clearAllLocalData } from '../../state/lifecycle';
import { useSettings, AppTheme } from '../../state/settingsStore';
import { AppRoute, navigate } from '../../state/route';
import { Sheet } from './Sheet';
import { Icon } from '../icons';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile | null;
  onLoadPriya: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  isManualSevere?: boolean;
  onToggleSevere?: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLoadPriya,
  onEditProfile,
  onDeleteProfile,
  isManualSevere,
  onToggleSevere,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [settings, updateSettings] = useSettings();
  const [isLlmAvailable, setIsLlmAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data && typeof data.llmEnabled === 'boolean') {
          setIsLlmAvailable(data.llmEnabled);
        }
      })
      .catch(() => {
        if (isMounted) setIsLlmAvailable(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleExport = () => {
    try {
      const json = exportProfileJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `airwise-profile-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Export failed');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const res = importProfileJson(text);
      if (res.success) {
        setImportError(null);
        onClose();
      } else {
        setImportError(res.error || 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  const confirmDelete = async () => {
    if (
      window.confirm(
        'Delete all stored data? This will remove all profiles, settings, cached air quality data, and local caches from this browser. No copy exists on any server.',
      )
    ) {
      await clearAllLocalData();
      onDeleteProfile();
      onClose();
    }
  };

  const handleLinkClick = (target: AppRoute) => (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    navigate(target);
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Menu & Settings"
      subtitle="Preferences, evaluation presets, and stored household data"
    >
      <div className="aw-menu-content">
        {/* Appearance & Theme Section */}
        <section className="aw-menu-section" aria-label="Theme & Appearance">
          <h3 className="aw-menu-section-title">Appearance</h3>
          <div className="aw-theme-options" role="radiogroup" aria-label="Select color theme">
            {(['system', 'light', 'dark'] as AppTheme[]).map((mode) => {
              const isSelected = settings.theme === mode;
              const label = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`aw-theme-btn ${isSelected ? 'aw-theme-btn-selected' : ''}`}
                  onClick={() => updateSettings({ theme: mode })}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="aw-toggle-row mt-3">
            <label htmlFor="sky-toggle" className="aw-toggle-label">
              Animated sky background
            </label>
            <input
              id="sky-toggle"
              type="checkbox"
              checked={settings.animatedSky}
              onChange={(e) => updateSettings({ animatedSky: e.target.checked })}
              className="checkbox-input"
            />
          </div>
        </section>

        {/* Severe Mode Manual Override */}
        {onToggleSevere && (
          <section className="aw-menu-section" aria-label="Severe Mode Override">
            <h3 className="aw-menu-section-title">Emergency Mode</h3>
            <div className="aw-toggle-row">
              <label htmlFor="severe-toggle" className="aw-toggle-label">
                Severe Smog Mode
              </label>
              <input
                id="severe-toggle"
                type="checkbox"
                checked={Boolean(isManualSevere)}
                onChange={onToggleSevere}
                className="checkbox-input"
              />
            </div>
            <p className="text-muted text-xs mt-1">
              {isManualSevere
                ? 'Severe mode active: full-screen emergency guidance.'
                : 'Preview or activate severe emergency guidance.'}
            </p>
          </section>
        )}

        {/* AI Personalization */}
        <section className="aw-menu-section" aria-label="AI Personalization">
          <h3 className="aw-menu-section-title">AI Assistance</h3>
          <div className="aw-toggle-row">
            <label
              htmlFor="ai-toggle"
              className={`aw-toggle-label ${isLlmAvailable ? 'cursor-pointer' : 'cursor-disabled'}`}
            >
              Personalise plan with AI
            </label>
            <input
              id="ai-toggle"
              type="checkbox"
              checked={settings.aiEnabled && isLlmAvailable}
              disabled={!isLlmAvailable}
              onChange={(e) => updateSettings({ aiEnabled: e.target.checked })}
              className="checkbox-input"
            />
          </div>
          <p className="text-muted text-xs mt-1">
            Reorders approved actions to match routine windows. No location coordinates or
            health specifics are ever shared.
          </p>
          {!isLlmAvailable && (
            <span className="text-muted text-xs italic block mt-1">
              (AI service is currently not connected on this deployment)
            </span>
          )}
        </section>

        {/* Testing Presets */}
        <section className="aw-menu-section" aria-label="Testing Presets">
          <h3 className="aw-menu-section-title">Evaluation Presets</h3>
          <p className="text-muted text-xs mb-2">
            Load standard testing household (3-member multi-generational family: asthmatic child, elder, low budget, no purifier).
          </p>
          <button
            type="button"
            className="aw-btn aw-btn-secondary w-full"
            onClick={() => {
              onLoadPriya();
              onClose();
            }}
            aria-label="Load demo household preset: 3-member family"
          >
            Load demo household preset
          </button>
        </section>

        {/* Profile Management */}
        <section className="aw-menu-section" aria-label="Profile Data">
          <h3 className="aw-menu-section-title">Household Profile</h3>
          <div className="aw-menu-btn-stack">
            <button
              type="button"
              className="aw-btn aw-btn-secondary"
              onClick={() => {
                onEditProfile();
                onClose();
              }}
            >
              {profile ? 'Edit Household Profile' : 'Complete Onboarding'}
            </button>

            {profile && (
              <>
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary"
                  onClick={handleExport}
                >
                  Export my data (JSON)
                </button>

                <label className="aw-btn aw-btn-secondary text-center cursor-pointer">
                  Import data (JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="sr-only"
                  />
                </label>

                {importError && (
                  <div className="text-warning text-xs">{importError}</div>
                )}

                <button
                  type="button"
                  className="aw-btn aw-btn-quiet text-danger"
                  onClick={confirmDelete}
                >
                  Delete all data
                </button>
                <p className="text-muted text-xs italic">
                  Stored strictly in your local browser storage. No server-side copy exists.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Documentation Links */}
        <section className="aw-menu-section" aria-label="Information & Legal">
          <h3 className="aw-menu-section-title">Information</h3>
          <ul className="aw-menu-nav-list">
            <li>
              <a
                href="#/about"
                className="aw-menu-nav-link"
                onClick={handleLinkClick('about')}
              >
                <span>About AirWise</span>
                <Icon name="chevron" size={16} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="#/privacy"
                className="aw-menu-nav-link"
                onClick={handleLinkClick('privacy')}
              >
                <span>Privacy Policy</span>
                <Icon name="chevron" size={16} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="#/terms"
                className="aw-menu-nav-link"
                onClick={handleLinkClick('terms')}
              >
                <span>Terms of Use</span>
                <Icon name="chevron" size={16} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </section>
      </div>
    </Sheet>
  );
};
