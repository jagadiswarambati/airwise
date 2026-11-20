import React, { useState } from 'react';
import { HouseholdProfile } from '../../domain/types';
import { exportProfileJson, importProfileJson } from '../../state/profileStore';
import { ScenarioType } from '../../data/fallback-chain';

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

  const confirmDelete = () => {
    if (window.confirm('Delete all stored household data? This action cannot be undone.')) {
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
                  Delete All Stored Data
                </button>
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

