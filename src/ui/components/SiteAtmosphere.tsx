import React from 'react';
import { useSettings } from '../../state/settingsStore';

interface SiteAtmosphereProps {
  className?: string;
}

/**
 * Decorative CSS-only sky illustration strip.
 * Respects user settings (animatedSky) and system prefers-reduced-motion.
 */
export const SiteAtmosphere: React.FC<SiteAtmosphereProps> = ({ className = '' }) => {
  const [settings] = useSettings();

  return (
    <aside
      className={`aw-atmosphere-strip ${settings.animatedSky ? 'aw-atmosphere-animated' : ''} ${className}`.trim()}
      aria-label="Decorative atmospheric background"
    >
      <div className="aw-atmosphere-sky">
        <div className="aw-atmosphere-haze" />
        <div className="aw-atmosphere-breeze" />
      </div>
      <span className="aw-atmosphere-caption">Illustration</span>
    </aside>
  );
};
