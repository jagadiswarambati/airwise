import React, { useState, useEffect } from 'react';
import { type HouseholdProfile } from '../../domain/types';
import { useSettings } from '../../state/settingsStore';
import { Sheet } from './Sheet';
import { type Clock, systemClock } from '../../lib/clock';
import { MenuThemeSection } from './menu/MenuThemeSection';
import { MenuEmergencySection } from './menu/MenuEmergencySection';
import { MenuAiSection } from './menu/MenuAiSection';
import { MenuPresetsSection } from './menu/MenuPresetsSection';
import { MenuProfileSection } from './menu/MenuProfileSection';
import { MenuNavSection } from './menu/MenuNavSection';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile | null;
  onLoadPriya: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  isManualSevere?: boolean;
  onToggleSevere?: () => void;
  clock?: Clock;
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
  clock = systemClock,
}) => {
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

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Menu & Settings"
      subtitle="Preferences, evaluation presets, and stored household data"
    >
      <div className="aw-menu-content">
        <MenuThemeSection
          theme={settings.theme}
          animatedSky={settings.animatedSky}
          onUpdateTheme={(theme) => updateSettings({ theme })}
          onUpdateSky={(animatedSky) => updateSettings({ animatedSky })}
        />

        {onToggleSevere && (
          <MenuEmergencySection
            isManualSevere={isManualSevere}
            onToggleSevere={onToggleSevere}
          />
        )}

        <MenuAiSection
          aiEnabled={settings.aiEnabled}
          isLlmAvailable={isLlmAvailable}
          onUpdateAi={(aiEnabled) => updateSettings({ aiEnabled })}
        />

        <MenuPresetsSection onLoadPriya={onLoadPriya} onClose={onClose} />

        <MenuProfileSection
          profile={profile}
          onEditProfile={onEditProfile}
          onDeleteProfile={onDeleteProfile}
          onClose={onClose}
          clock={clock}
        />

        <MenuNavSection onClose={onClose} />
      </div>
    </Sheet>
  );
};

export default MenuModal;
