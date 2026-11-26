import { useState, useCallback, useMemo } from 'react';
import { useProfile } from '../../state/profileStore';
import { useScenario } from '../../state/scenarioStore';
import { useManualSevereMode } from '../../state/severeModeStore';
import { useRoute } from '../../state/route';
import { useAirData } from '../hooks/useAirData';
import { type HouseholdProfile } from '../../domain/types';

const DEFAULT_LOCATION: HouseholdProfile['location'] = {
  label: 'New Delhi',
  lat: 28.6139,
  lon: 77.209,
  country: 'IN',
};

export function useAppState() {
  const { profile, save, remove, loadPriya } = useProfile();
  const { scenario, setScenario } = useScenario();
  const { isManualSevereMode, toggleSevereMode } = useManualSevereMode();
  const { route, navigate } = useRoute();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const airData = useAirData(profile?.location ?? DEFAULT_LOCATION, scenario);

  const handleOnboardingComplete = useCallback(
    (newProfile: HouseholdProfile) => {
      save(newProfile);
      setIsEditing(false);
    },
    [save],
  );

  const handleLoadPriyaPreset = useCallback(() => {
    loadPriya();
    setScenario('severe');
    setIsEditing(false);
  }, [loadPriya, setScenario]);

  const isPublicRoute = route === 'about' || route === 'privacy' || route === 'terms';

  return useMemo(
    () => ({
      profile,
      remove,
      scenario,
      setScenario,
      isManualSevereMode,
      toggleSevereMode,
      route,
      navigate,
      isEditing,
      setIsEditing,
      isMenuOpen,
      setIsMenuOpen,
      airData,
      handleOnboardingComplete,
      handleLoadPriyaPreset,
      isPublicRoute,
    }),
    [
      profile,
      remove,
      scenario,
      setScenario,
      isManualSevereMode,
      toggleSevereMode,
      route,
      navigate,
      isEditing,
      isMenuOpen,
      airData,
      handleOnboardingComplete,
      handleLoadPriyaPreset,
      isPublicRoute,
    ],
  );
}
