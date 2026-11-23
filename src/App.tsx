import { useState } from 'react';
import { useProfile } from './state/profileStore';
import { OnboardingFlow } from './ui/onboarding/OnboardingFlow';
import { TodayScreen } from './ui/screens/TodayScreen';
import { HouseholdProfile } from './domain/types';
import { Icon } from './ui/icons';

export function App() {
  const { profile, save, remove, loadPriya } = useProfile();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleOnboardingComplete = (newProfile: HouseholdProfile) => {
    save(newProfile);
    setIsEditing(false);
  };

  const handleLoadPriyaPreset = () => {
    loadPriya();
    setIsEditing(false);
  };

  if (!profile || isEditing) {
    return (
      <main className="app-container">
        <header className="app-header">
          <div className="brand-section">
            <Icon name="wind" size={24} aria-hidden="true" />
            <span className="brand-title">AirWise Onboarding</span>
          </div>
          {profile && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          )}
        </header>

        <OnboardingFlow
          initialProfile={profile}
          onComplete={handleOnboardingComplete}
          onLoadPriya={handleLoadPriyaPreset}
        />
      </main>
    );
  }

  return (
    <TodayScreen
      profile={profile}
      onEditProfile={() => setIsEditing(true)}
      onLoadPriya={handleLoadPriyaPreset}
      onDeleteProfile={remove}
    />
  );
}
