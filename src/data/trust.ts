import { AirSnapshot, Confidence } from '../domain/types';

export interface TrustModel {
  sourceName: string;
  attribution: string;
  dataTypeBadge: 'Modelled' | 'Observed' | 'Sample' | 'Demo data';
  freshnessBadge: 'Fresh' | 'Aging' | 'Stale' | 'Unavailable';
  freshnessNote: string;
  resolutionNote: string;
  sourceTier: 'live' | 'cached' | 'sample';
  isFallback: boolean;
  fallbackReason?: string;
  planSource: string;
  planConfidence: Confidence;
  confidenceReason: string;
  uncertaintyDisclaimer: string;
}

export function buildTrustModel(
  snapshot: AirSnapshot,
  planConfidence: Confidence,
  confidenceReason: string,
  sourceTier: 'live' | 'cached' | 'sample',
  isFallback: boolean,
  fallbackReason?: string,
  planSource?: string,
): TrustModel {
  let dataTypeBadge: TrustModel['dataTypeBadge'] = 'Modelled';
  if (snapshot.source.dataType === 'sample' || sourceTier === 'sample') {
    dataTypeBadge = 'Demo data';
  } else if (snapshot.source.dataType === 'observed') {
    dataTypeBadge = 'Observed';
  }

  let freshnessBadge: TrustModel['freshnessBadge'] = 'Fresh';
  let freshnessNote = 'Updated recently (less than 3 hours ago).';

  if (snapshot.freshness === 'aging') {
    freshnessBadge = 'Aging';
    freshnessNote = 'Data is 3 to 12 hours old. Forecast model refreshes every 12–24h.';
  } else if (snapshot.freshness === 'stale') {
    freshnessBadge = 'Stale';
    freshnessNote = 'Data is over 12 hours old. Outdoor activity recommendations are cautiously suppressed.';
  } else if (snapshot.freshness === 'none') {
    freshnessBadge = 'Unavailable';
    freshnessNote = 'No verified current reading available; using conservative baseline defaults.';
  }

  const attribution =
    snapshot.source.attribution ||
    'Air quality and weather data by Open-Meteo, derived from Copernicus Atmosphere Monitoring Service (CAMS) information.';

  return {
    sourceName: snapshot.source.name,
    attribution,
    dataTypeBadge,
    freshnessBadge,
    freshnessNote,
    resolutionNote:
      snapshot.source.resolutionNote ||
      'Regional atmospheric model (~25 km spatial resolution). May miss hyper-local road and combustion peaks.',
    sourceTier,
    isFallback,
    fallbackReason,
    planSource: planSource || 'Standard deterministic plan (rule-based)',
    planConfidence,
    confidenceReason,
    uncertaintyDisclaimer:
      'AirWise provides environmental health risk guidance, not medical diagnosis or clinical treatment.',
  };
}
