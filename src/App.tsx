import { useAppState } from './ui/shell/useAppState';
import { OnboardingFlow } from './ui/onboarding/OnboardingFlow';
import { AppShell } from './ui/shell/AppShell';
import { OnboardingShell } from './ui/shell/OnboardingShell';
import { AppRouteContent } from './ui/shell/AppRouteContent';
import { MenuModal } from './ui/components/MenuModal';

export function App() {
  const state = useAppState();

  // Public visitor view for first-time users without a profile
  if (!state.profile && !state.isPublicRoute) {
    return (
      <OnboardingShell>
        <OnboardingFlow
          initialProfile={null}
          onComplete={state.handleOnboardingComplete}
          onLoadPriya={state.handleLoadPriyaPreset}
        />
      </OnboardingShell>
    );
  }

  // Editing existing profile
  if (state.isEditing) {
    return (
      <OnboardingShell onCancel={() => state.setIsEditing(false)}>
        <OnboardingFlow
          initialProfile={state.profile}
          onComplete={state.handleOnboardingComplete}
          onLoadPriya={state.handleLoadPriyaPreset}
          onCancel={() => state.setIsEditing(false)}
        />
      </OnboardingShell>
    );
  }

  return (
    <AppShell
      currentRoute={state.route}
      onNavigate={state.navigate}
      currentScenario={state.scenario}
      onSelectScenario={state.setScenario}
      onOpenMenu={() => state.setIsMenuOpen(true)}
    >
      <AppRouteContent
        route={state.route}
        profile={state.profile}
        airData={state.airData}
        scenario={state.scenario}
        setScenario={state.setScenario}
        isManualSevereMode={state.isManualSevereMode}
        toggleSevereMode={state.toggleSevereMode}
        onStartOnboarding={() => {
          state.setIsEditing(true);
          state.navigate('today');
        }}
        onLoadPriyaPreset={() => {
          state.handleLoadPriyaPreset();
          state.navigate('today');
        }}
      />

      <MenuModal
        isOpen={state.isMenuOpen}
        onClose={() => state.setIsMenuOpen(false)}
        profile={state.profile}
        onLoadPriya={state.handleLoadPriyaPreset}
        onEditProfile={() => state.setIsEditing(true)}
        onDeleteProfile={state.remove}
        isManualSevere={state.isManualSevereMode}
        onToggleSevere={state.toggleSevereMode}
      />
    </AppShell>
  );
}

export default App;
