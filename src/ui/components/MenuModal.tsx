import React, { useState, useEffect } from 'react';
import { HouseholdProfile } from '../../domain/types';
import { exportProfileJson, importProfileJson } from '../../state/profileStore';
import { clearAllLocalData } from '../../state/lifecycle';
import { ScenarioType } from '../../data/fallback-chain';
import { useSettings } from '../../state/settingsStore';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile | null;
  onLoadPriya: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  currentScenario: ScenarioType;
  onSelectScenario: (s: ScenarioType) => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLoadPriya,
  onEditProfile,
  onDeleteProfile,
  currentScenario,
  onSelectScenario,
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

  if (!isOpen) return null;

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

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Menu &amp; Settings</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Preset Action */}
          <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Evaluation Presets</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 8px 0' }}>
              Load standard testing household (Priya: asthmatic child, elder, low budget, no purifier).
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.85rem' }}
              onClick={() => {
                onLoadPriya();
                onClose();
              }}
            >
              Load Priya's Household Preset
            </button>
          </div>

          {/* AI Personalization Settings Toggle */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-subtle)',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                htmlFor="ai-toggle"
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: isLlmAvailable ? 'pointer' : 'not-allowed',
                  opacity: isLlmAvailable ? 1 : 0.6,
                }}
              >
                Personalise plan with AI
              </label>
              <input
                id="ai-toggle"
                type="checkbox"
                checked={settings.aiEnabled && isLlmAvailable}
                disabled={!isLlmAvailable}
                onChange={(e) => updateSettings({ aiEnabled: e.target.checked })}
                style={{ width: '1.2rem', height: '1.2rem', cursor: isLlmAvailable ? 'pointer' : 'not-allowed' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.35 }}>
              Age bands, equipment, routine times; no location, names, or health records are sent.
            </p>
            {!isLlmAvailable && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                (AI service disabled on this deployment)
              </span>
            )}
          </div>

          {/* Scenario Switching */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label">Active Air Scenario</label>
            <select
              value={currentScenario}
              onChange={(e) => {
                onSelectScenario(e.target.value as ScenarioType);
                onClose();
              }}
              className="form-select"
            >
              <option value="live">Live Air Data (Open-Meteo)</option>
              <option value="clear">Demo: Clear Air (Level 0)</option>
              <option value="moderate">Demo: Moderate Air (Level 1)</option>
              <option value="severe">Demo: Severe Winter Smog (Level 4)</option>
              <option value="stale">Demo: Stale Feed Degradation</option>
            </select>
          </div>

          {/* Profile Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onEditProfile();
                onClose();
              }}
            >
              {profile ? 'Edit Household Profile' : 'Complete Onboarding'}
            </button>

            {profile && (
              <>
                <button type="button" className="btn-secondary" onClick={handleExport}>
                  Export Profile (JSON)
                </button>

                <label className="btn-secondary" style={{ textAlign: 'center', cursor: 'pointer' }}>
                  Import Profile (JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                  />
                </label>

                {importError && (
                  <div style={{ color: 'var(--level-3-text)', fontSize: '0.8rem' }}>
                    {importError}
                  </div>
                )}

                <button
                  type="button"
                  style={{
                    color: 'var(--level-3-text)',
                    backgroundColor: 'var(--level-3-bg)',
                    border: '1px solid var(--level-3-border)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: 'var(--target-min)',
                    fontWeight: 600,
                  }}
                  onClick={confirmDelete}
                >
                  Delete all data
                </button>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Stored in this browser only. No server-side copy exists.
                </div>
              </>
            )}
          </div>

          {/* About */}
          <div
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              paddingTop: '12px',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
            }}
          >
            <p>
              <strong>AirWise</strong> is an AI-powered household clean-air decision assistant.
            </p>
            <p style={{ marginTop: '4px' }}>
              Phase B build: Pure TypeScript deterministic core with live &amp; demo data layers.
              No health claims or medical advice provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
