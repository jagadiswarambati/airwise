import { useState, useEffect, useCallback, useMemo } from 'react';
import { type AirSnapshot, type HouseholdProfile } from '../../domain/types';
import { getAirSnapshot, type ScenarioType } from '../../data/fallback-chain';

export interface AirDataState {
  snapshot: AirSnapshot | null;
  sourceTier: 'live' | 'cached' | 'sample' | 'none';
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
  const [sourceTier, setSourceTier] = useState<'live' | 'cached' | 'sample' | 'none'>('sample');
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { lat, lon, label, country } = location;

  const fetchSnapshot = useCallback(
    async (isCancelled?: () => boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAirSnapshot({
          location: { lat, lon, label, country },
          scenario,
        });
        if (isCancelled?.()) return;
        setSnapshot(res.snapshot);
        setSourceTier(res.sourceTier);
        setIsFallback(res.isFallback);
        setFallbackReason(res.fallbackReason);
      } catch (err: unknown) {
        if (isCancelled?.()) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch air data');
      } finally {
        if (!isCancelled?.()) {
          setLoading(false);
        }
      }
    },
    [lat, lon, label, country, scenario],
  );

  useEffect(() => {
    let cancelled = false;
    fetchSnapshot(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchSnapshot]);

  const refresh = useCallback(async () => {
    await fetchSnapshot();
  }, [fetchSnapshot]);

  return useMemo(
    () => ({
      snapshot,
      sourceTier,
      isFallback,
      fallbackReason,
      loading,
      error,
      refresh,
    }),
    [snapshot, sourceTier, isFallback, fallbackReason, loading, error, refresh],
  );
}
