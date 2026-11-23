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
 * Exposure confidence calculation (IMPACT_METHODOLOGY.md §4):
 * confidence = min(evidenceTier, freshnessTier, dataTypeTier)
 * If data is stale or none, capped at 'low' (Rule P-03, P-04).
 */
export function calculateExposureConfidence(
  evidence: ActionEvidence,
  freshness: DataFreshness,
  dataType: DataType,
): Confidence {
  const evidenceScore = CONFIDENCE_VALUES[evidence];

  let freshnessScore = 3;
  if (freshness === 'aging') {
    freshnessScore = 2;
  } else if (freshness === 'stale' || freshness === 'none') {
    freshnessScore = 1;
  }

  let dataTypeScore = 2; // modelled = medium, sample = medium (A-05)
  if (dataType === 'observed') {
    dataTypeScore = 3;
  }

  let minScore = Math.min(evidenceScore, freshnessScore, dataTypeScore);
  if (freshness === 'stale' || freshness === 'none') {
    minScore = Math.min(minScore, 1);
  }

  return VALUES_TO_CONFIDENCE[minScore] || 'low';
}

/**
 * Emissions confidence calculation (Decision A-31, IMPACT_METHODOLOGY.md §4):
 * confidence = min(evidenceTier, inputTier)
 * Air-data freshness does not apply because no air data is used for emissions.
 * Self-reported profile distances cap this at medium (score 2).
 */
export function calculateEmissionsConfidence(
  evidence: ActionEvidence,
  inputTier: 'self-reported' | 'missing' = 'self-reported',
): Confidence {
  const evidenceScore = CONFIDENCE_VALUES[evidence];
  const inputScore = inputTier === 'self-reported' ? 2 : 1;
  const minScore = Math.min(evidenceScore, inputScore);

  return VALUES_TO_CONFIDENCE[minScore] || 'low';
}

/**
 * Dual-axis confidence dispatcher.
 */
export function calculateConfidence(
  evidence: ActionEvidence,
  freshness: DataFreshness,
  dataType: DataType,
  isExposureDependent: boolean = true,
  inputTier: 'self-reported' | 'missing' = 'self-reported',
): Confidence {
  if (isExposureDependent) {
    return calculateExposureConfidence(evidence, freshness, dataType);
  }
  return calculateEmissionsConfidence(evidence, inputTier);
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
