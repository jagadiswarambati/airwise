import { ActionEvidence, Confidence, DataFreshness, DataType } from './types';

const CONFIDENCE_VALUES: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const VALUES_TO_CONFIDENCE: Record<number, Confidence> = {
  1: 'low',
  2: 'medium',
  3: 'high',
};

/**
 * Confidence rule:
 * confidence = min(evidenceTier, dataFreshnessTier, dataTypeTier)
 *
 * Freshness: fresh = high, aging = medium, stale/none = low
 * Data type: observed = high, modelled = medium, sample = medium (labelled demo data)
 * Evidence: high = high, medium = medium, low = low
 *
 * If data is stale or none, exposure-dependent confidence is capped at 'low' (Rule P-03).
 */
export function calculateConfidence(
  evidence: ActionEvidence,
  freshness: DataFreshness,
  dataType: DataType,
  isExposureDependent: boolean = true,
): Confidence {
  const evidenceScore = CONFIDENCE_VALUES[evidence];

  let freshnessScore = 3;
  if (freshness === 'aging') {
    freshnessScore = 2;
  } else if (freshness === 'stale' || freshness === 'none') {
    freshnessScore = 1;
  }

  let dataTypeScore = 2; // modelled = medium, sample = medium
  if (dataType === 'observed') {
    dataTypeScore = 3;
  }

  let minScore = Math.min(evidenceScore, freshnessScore, dataTypeScore);

  // Rule P-03 / P-04: Stale or missing data caps exposure-dependent actions to low confidence
  if (isExposureDependent && (freshness === 'stale' || freshness === 'none')) {
    minScore = Math.min(minScore, 1);
  }

  return VALUES_TO_CONFIDENCE[minScore] || 'low';
}

export function getConfidenceExplanation(
  confidence: Confidence,
  freshness: DataFreshness,
  dataType: DataType,
): string {
  if (freshness === 'stale') {
    return 'Confidence is low because air quality data is stale (> 12 hours old).';
  }
  if (freshness === 'none') {
    return 'Confidence is low because live air quality data is unavailable; using conservative defaults.';
  }
  if (dataType === 'modelled') {
    return `Confidence is ${confidence} based on atmospheric model forecasts (CAMS/Open-Meteo).`;
  }
  if (dataType === 'sample') {
    return `Confidence is ${confidence} for demonstration scenario data.`;
  }
  return `Confidence is ${confidence} based on observed station data.`;
}

