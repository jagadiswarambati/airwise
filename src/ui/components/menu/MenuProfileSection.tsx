import React, { useState } from 'react';
import { type HouseholdProfile } from '../../../domain/types';
import { exportProfileJson, importProfileJson } from '../../../state/profileStore';
import { clearAllLocalData } from '../../../state/lifecycle';
import { type Clock } from '../../../lib/clock';

interface MenuProfileSectionProps {
  profile: HouseholdProfile | null;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  onClose: () => void;
  clock: Clock;
}

function executeExport(clock: Clock) {
  try {
    const json = exportProfileJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airwise-profile-${clock().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : 'Export failed');
  }
}

async function executeDelete(onDeleteProfile: () => void, onClose: () => void) {
  const confirmed = window.confirm(
    'Delete all stored data? This will remove all profiles, settings, cached air quality data, and local caches from this browser. No copy exists on any server.',
  );
  if (confirmed) {
    await clearAllLocalData();
    onDeleteProfile();
    onClose();
  }
}

export function MenuProfileSection({
  profile,
  onEditProfile,
  onDeleteProfile,
  onClose,
  clock,
}: MenuProfileSectionProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text !== 'string') return;
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

  return (
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
              onClick={() => executeExport(clock)}
            >
              Export my data (JSON)
            </button>

            <label className="aw-btn aw-btn-secondary text-center cursor-pointer">
              Import data (JSON)
              <input type="file" accept=".json" onChange={handleImportFile} className="sr-only" />
            </label>

            {importError && <div className="text-warning text-xs">{importError}</div>}

            <button
              type="button"
              className="aw-btn aw-btn-quiet text-danger"
              onClick={() => executeDelete(onDeleteProfile, onClose)}
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
  );
}
