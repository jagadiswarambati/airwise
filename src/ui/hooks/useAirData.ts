import { useState, useEffect, useCallback } from 'react';
import { type AirSnapshot, type HouseholdProfile } from '../../domain/types';
import { getAirSnapshot, type ScenarioType } from '../../data/fallback-chain';

export interface AirDataState {
  snapshot: AirSnapshot | null;
  sourceTier: 'live' | 'cached' | 'sample';
  isFallback: boolean;
  fallbackReason?: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAirData(
  location: HouseholdProfile['location'],
  scenario: ScenarioType,
): AirDataState {
  const [snapshot, setSnapshot] = useState<AirSnapshot | null>(null);
  const [sourceTier, setSourceTier] = useState<'live' | 'cached' | 'sample'>('sample');
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAir = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAirSnapshot({ location, scenario });
      setSnapshot(res.snapshot);
      setSourceTier(res.sourceTier);
      setIsFallback(res.isFallback);
      setFallbackReason(res.fallbackReason);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch air data');
    } finally {
      setLoading(false);
    }
  }, [location, scenario]);

  useEffect(() => {
    loadAir();
  }, [loadAir]);

  return {
    snapshot,
    sourceTier,
    isFallback,
    fallbackReason,
    loading,
    error,
    refresh: loadAir,
  };
}
