/**
 * GeocodeResult.
 */
export interface GeocodeResult {
  name: string;
  adminRegion: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone?: string;
}

/**
 * Browser-side geocoding client fetching from same-origin /api/geocode.
 * Guarantees connect-src 'self' CSP compliance with zero direct third-party calls.
 */
export async function searchCities(
  query: string,
  count: number = 5,
  options?: { timeoutMs?: number },
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const timeoutMs = options?.timeoutMs || 6000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `/api/geocode?q=${encodeURIComponent(q)}&count=${count}`;

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Geocode API returned HTTP status ${res.status}`);
    }

    const data: GeocodeResult[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : 'Unknown network error';
    throw new Error(`Failed to search cities via /api/geocode: ${msg}`);
  }
}
