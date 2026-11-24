import { lazy, Suspense } from 'react';
import { type HouseholdProfile, type AirSnapshot } from '../../domain/types';
import { type AppRoute } from '../../state/route';
import { type ScenarioType } from '../../data/fallback-chain';
import { TodayScreen } from '../screens/TodayScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Skeleton } from '../components/Skeleton';

const IndoorScreen = lazy(() => import('../screens/IndoorScreen'));
const MoveScreen = lazy(() => import('../screens/MoveScreen'));
const ImpactScreen = lazy(() => import('../screens/ImpactScreen'));
const CommunityScreen = lazy(() => import('../screens/CommunityScreen'));
const AboutScreen = lazy(() => import('../screens/AboutScreen'));
const PrivacyScreen = lazy(() => import('../screens/PrivacyScreen'));
const TermsScreen = lazy(() => import('../screens/TermsScreen'));

export interface AppRouteContentProps {
  route: AppRoute;
  profile: HouseholdProfile | null;
  airData: {
    snapshot: AirSnapshot | null;
    sourceTier: 'live' | 'cached' | 'sample';
    isFallback: boolean;
    fallbackReason?: string;
    loading: boolean;
    error: string | null;
    refresh: () => void;
  };
  scenario: ScenarioType;
  setScenario: (s: ScenarioType) => void;
  isManualSevereMode: boolean;
  toggleSevereMode: () => void;
  onStartOnboarding: () => void;
  onLoadPriyaPreset: () => void;
}

interface PublicScreenProps {
  route: AppRoute;
  onStartOnboarding: () => void;
  onLoadPriyaPreset: () => void;
}

function PublicScreen({ route, onStartOnboarding, onLoadPriyaPreset }: PublicScreenProps) {
  if (route === 'about') {
    return (
      <ErrorBoundary fallbackMessage="Unable to load about page">
        <Suspense fallback={<Skeleton count={2} variant="card" />}>
          <AboutScreen
            onStartOnboarding={onStartOnboarding}
            onLoadPriya={onLoadPriyaPreset}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (route === 'privacy') {
    return (
      <ErrorBoundary fallbackMessage="Unable to load privacy policy">
        <Suspense fallback={<Skeleton count={2} variant="card" />}>
          <PrivacyScreen />
        </Suspense>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary fallbackMessage="Unable to load terms of use">
      <Suspense fallback={<Skeleton count={2} variant="card" />}>
        <TermsScreen />
      </Suspense>
    </ErrorBoundary>
  );
}

const ROUTE_ERROR_NAMES: Record<string, string> = {
  indoor: 'indoor air guide',
  move: 'travel planner',
  impact: 'impact overview',
  community: 'community briefing',
};

function HouseholdScreen({
  route,
  profile,
  airData,
  setScenario,
  isManualSevereMode,
  toggleSevereMode,
}: AppRouteContentProps) {
  if (!profile) return null;

  if (route === 'today') {
    return (
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
    );
  }

  const screenNode = (() => {
    if (!airData.snapshot) return <Skeleton count={3} variant="card" />;
    switch (route) {
      case 'indoor':
        return <IndoorScreen profile={profile} snapshot={airData.snapshot} />;
      case 'move':
        return <MoveScreen profile={profile} snapshot={airData.snapshot} />;
      case 'impact':
        return <ImpactScreen profile={profile} snapshot={airData.snapshot} />;
      case 'community':
        return <CommunityScreen profile={profile} snapshot={airData.snapshot} />;
      default:
        return null;
    }
  })();

  const title = ROUTE_ERROR_NAMES[route] || 'page';

  return (
    <ErrorBoundary fallbackMessage={`Unable to load ${title}`}>
      <Suspense fallback={<Skeleton count={3} variant="card" />}>{screenNode}</Suspense>
    </ErrorBoundary>
  );
}

export function AppRouteContent(props: AppRouteContentProps) {
  if (props.route === 'about' || props.route === 'privacy' || props.route === 'terms') {
    return (
      <PublicScreen
        route={props.route}
        onStartOnboarding={props.onStartOnboarding}
        onLoadPriyaPreset={props.onLoadPriyaPreset}
      />
    );
  }

  return <HouseholdScreen {...props} />;
}

export default AppRouteContent;
