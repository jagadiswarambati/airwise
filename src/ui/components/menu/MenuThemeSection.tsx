import { type AppTheme } from '../../../state/settingsStore';

interface MenuThemeSectionProps {
  theme: AppTheme;
  animatedSky: boolean;
  onUpdateTheme: (theme: AppTheme) => void;
  onUpdateSky: (sky: boolean) => void;
}

export function MenuThemeSection({
  theme,
  animatedSky,
  onUpdateTheme,
  onUpdateSky,
}: MenuThemeSectionProps) {
  const modes: { mode: AppTheme; label: string }[] = [
    { mode: 'system', label: 'System' },
    { mode: 'light', label: 'Light' },
    { mode: 'dark', label: 'Dark' },
  ];

  return (
    <section className="aw-menu-section" aria-label="Theme & Appearance">
      <h3 className="aw-menu-section-title">Appearance</h3>
      <div className="aw-theme-options" role="radiogroup" aria-label="Select color theme">
        {modes.map(({ mode, label }) => {
          const isSelected = theme === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`aw-theme-btn ${isSelected ? 'aw-theme-btn-selected' : ''}`}
              onClick={() => onUpdateTheme(mode)}
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
          checked={animatedSky}
          onChange={(e) => onUpdateSky(e.target.checked)}
          className="checkbox-input"
        />
      </div>
    </section>
  );
}
