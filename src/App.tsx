import { useState, lazy, Suspense } from 'react';
import { useProfile } from './state/profileStore';
import { useScenario } from './state/scenarioStore';
import { useManualSevereMode } from './state/severeModeStore';
import { useRoute } from './state/route';
import { useAirData } from './ui/hooks/useAirData';
import { OnboardingFlow } from './ui/onboarding/OnboardingFlow';
import { TodayScreen } from './ui/screens/TodayScreen';
import { AppShell } from './ui/shell/AppShell';
import { SkipLink } from './ui/shell/SkipLink';
import { MenuModal } from './ui/components/MenuModal';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { Skeleton } from './ui/components/Skeleton';
import { HouseholdProfile } from './domain/types';
import { Icon } from './ui/icons';

// Lazy loaded secondary screens
const IndoorScreen = lazy(() => import('./ui/screens/IndoorScreen'));
const MoveScreen = lazy(() => import('./ui/screens/MoveScreen'));
const ImpactScreen = lazy(() => import('./ui/screens/ImpactScreen'));
const CommunityScreen = lazy(() => import('./ui/screens/CommunityScreen'));
const AboutScreen = lazy(() => import('./ui/screens/AboutScreen'));
const PrivacyScreen = lazy(() => import('./ui/screens/PrivacyScreen'));
const TermsScreen = lazy(() => import('./ui/screens/TermsScreen'));

export function App() {
  const { profile, save, remove, loadPriya } = useProfile();
  const { scenario, setScenario } = useScenario();
  const { isManualSevereMode, toggleSevereMode } = useManualSevereMode();
  const { route, navigate } = useRoute();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Shared air quality data layer
  const airData = useAirData(
    profile ? profile.location : { label: 'New Delhi', lat: 28.6139, lon: 77.209, country: 'IN' },
    scenario,
  );

  const handleOnboardingComplete = (newProfile: HouseholdProfile) => {
    save(newProfile);
    setIsEditing(false);
  };

  const handleLoadPriyaPreset = () => {
    loadPriya();
    setScenario('severe');
    setIsEditing(false);
  };

  const isPublicRoute = route === 'about' || route === 'privacy' || route === 'terms';

  // Public visitor view for first-time users without a profile
  if (!profile) {
    if (isPublicRoute) {
      return (
        <AppShell
          currentRoute={route}
          onNavigate={navigate}
          currentScenario={scenario}
          onSelectScenario={setScenario}
          onOpenMenu={() => setIsMenuOpen(true)}
        >
          {route === 'about' && (
            <ErrorBoundary fallbackMessage="Unable to load about page">
              <Suspense fallback={<Skeleton count={2} variant="card" />}>
                <AboutScreen
                  onStartOnboarding={() => {
                    setIsEditing(true);
                    navigate('today');
                  }}
                  onLoadPriya={() => {
                    handleLoadPriyaPreset();
                    navigate('today');
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {route === 'privacy' && (
            <ErrorBoundary fallbackMessage="Unable to load privacy policy">
              <Suspense fallback={<Skeleton count={2} variant="card" />}>
                <PrivacyScreen />
              </Suspense>
            </ErrorBoundary>
          )}

          {route === 'terms' && (
            <ErrorBoundary fallbackMessage="Unable to load terms of use">
              <Suspense fallback={<Skeleton count={2} variant="card" />}>
                <TermsScreen />
              </Suspense>
            </ErrorBoundary>
          )}

          <MenuModal
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            profile={null}
            onLoadPriya={handleLoadPriyaPreset}
            onEditProfile={() => setIsEditing(true)}
            onDeleteProfile={remove}
            isManualSevere={isManualSevereMode}
            onToggleSevere={toggleSevereMode}
          />
        </AppShell>
      );
    }

    return (
      <div className="aw-shell">
        <SkipLink />
        <header className="aw-header">
          <div className="aw-container aw-header-inner">
            <div className="aw-brand">
              <div className="aw-brand-icon">
                <Icon name="wind" size={24} aria-hidden="true" />
              </div>
              <span className="aw-brand-title">AirWise Onboarding</span>
            </div>
          </div>
        </header>

        <main id="main" className="aw-main" tabIndex={-1}>
          <div className="aw-container aw-main-container">
            <OnboardingFlow
              initialProfile={null}
              onComplete={handleOnboardingComplete}
              onLoadPriya={handleLoadPriyaPreset}
            />
          </div>
        </main>
      </div>
    );
  }

  // Editing existing profile
  if (isEditing) {
    return (
      <div className="aw-shell">
        <SkipLink />
        <header className="aw-header">
          <div className="aw-container aw-header-inner">
            <div className="aw-brand">
              <div className="aw-brand-icon">
                <Icon name="wind" size={24} aria-hidden="true" />
              </div>
              <span className="aw-brand-title">AirWise Onboarding</span>
            </div>
            <button
              type="button"
              className="aw-btn aw-btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </header>

        <main id="main" className="aw-main" tabIndex={-1}>
          <div className="aw-container aw-main-container">
            <OnboardingFlow
              initialProfile={profile}
              onComplete={handleOnboardingComplete}
              onLoadPriya={handleLoadPriyaPreset}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <AppShell
      currentRoute={route}
      onNavigate={navigate}
      currentScenario={scenario}
      onSelectScenario={setScenario}
      onOpenMenu={() => setIsMenuOpen(true)}
    >
      {route === 'today' && (
        <ErrorBoundary fallbackMessage="Unable to load today's clean-air plan">
          <TodayScreen
            profile={profile}
            snapshot={airData.snapshot}
            sourceTier={airData.sourceTier}
            isFallback={airData.isFallback}
            fallbackReason={airData.fallbackReason}
            loading={airData.loading}
            error={airData.error}
            onRetry={airData.refresh}
            onSelectScenario={setScenario}
            isManualSevere={isManualSevereMode}
            onToggleSevere={toggleSevereMode}
          />
        </ErrorBoundary>
      )}

      {route === 'indoor' && (
        <ErrorBoundary fallbackMessage="Unable to load indoor air guide">
          <Suspense fallback={<Skeleton count={3} variant="card" />}>
            {airData.snapshot ? (
              <IndoorScreen profile={profile} snapshot={airData.snapshot} />
            ) : (
              <Skeleton count={3} variant="card" />
            )}
          </Suspense>
        </ErrorBoundary>
      )}

      {route === 'move' && (
        <ErrorBoundary fallbackMessage="Unable to load travel planner">
          <Suspense fallback={<Skeleton count={3} variant="card" />}>
            {airData.snapshot ? (
              <MoveScreen profile={profile} snapshot={airData.snapshot} />
            ) : (
              <Skeleton count={3} variant="card" />
            )}
          </Suspense>
        </ErrorBoundary>
      )}

      {route === 'impact' && (
        <ErrorBoundary fallbackMessage="Unable to load impact overview">
          <Suspense fallback={<Skeleton count={3} variant="card" />}>
            {airData.snapshot ? (
              <ImpactScreen profile={profile} snapshot={airData.snapshot} />
            ) : (
              <Skeleton count={3} variant="card" />
            )}
          </Suspense>
        </ErrorBoundary>
      )}

      {route === 'community' && (
        <ErrorBoundary fallbackMessage="Unable to load community briefing">
          <Suspense fallback={<Skeleton count={3} variant="card" />}>
            {airData.snapshot ? (
              <CommunityScreen profile={profile} snapshot={airData.snapshot} />
            ) : (
              <Skeleton count={3} variant="card" />
            )}
          </Suspense>
        </ErrorBoundary>
      )}

      {route === 'about' && (
        <ErrorBoundary fallbackMessage="Unable to load about page">
          <Suspense fallback={<Skeleton count={2} variant="card" />}>
            <AboutScreen
              onStartOnboarding={() => {
                setIsEditing(true);
                navigate('today');
              }}
              onLoadPriya={() => {
                handleLoadPriyaPreset();
                navigate('today');
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {route === 'privacy' && (
        <ErrorBoundary fallbackMessage="Unable to load privacy policy">
          <Suspense fallback={<Skeleton count={2} variant="card" />}>
            <PrivacyScreen />
          </Suspense>
        </ErrorBoundary>
      )}

      {route === 'terms' && (
        <ErrorBoundary fallbackMessage="Unable to load terms of use">
          <Suspense fallback={<Skeleton count={2} variant="card" />}>
            <TermsScreen />
          </Suspense>
        </ErrorBoundary>
      )}

      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        profile={profile}
        onLoadPriya={handleLoadPriyaPreset}
        onEditProfile={() => setIsEditing(true)}
        onDeleteProfile={remove}
        isManualSevere={isManualSevereMode}
        onToggleSevere={toggleSevereMode}
      />
    </AppShell>
  );
}

export default App;
