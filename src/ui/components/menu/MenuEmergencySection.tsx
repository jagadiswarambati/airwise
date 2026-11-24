interface MenuEmergencySectionProps {
  isManualSevere?: boolean;
  onToggleSevere: () => void;
}

export function MenuEmergencySection({
  isManualSevere,
  onToggleSevere,
}: MenuEmergencySectionProps) {
  return (
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
  );
}
