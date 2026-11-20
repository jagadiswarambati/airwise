import { useState } from 'react';
import { useProfile } from './state/profileStore';
import { OnboardingFlow } from './ui/onboarding/OnboardingFlow';
import { TodayScreen } from './ui/screens/TodayScreen';
import { HouseholdProfile } from './domain/types';

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
            <span style={{ fontSize: '1.35rem' }} aria-hidden="true">🍃</span>
            <span className="brand-title">AirWise Onboarding</span>
          </div>
          {profile && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing(false)}
              style={{ fontSize: '0.8rem', minHeight: '36px', padding: '0 12px' }}
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

