import {
  type AirSnapshot,
  type RiskLevel,
  type TimeSlot,
  type VentilationDecision,
} from './types';
import { getLevel1Threshold } from './config/bands';
import { isMinuteInSlot, parseLocalHour, parseTimeToMinutes } from './time';

/**
 * VentilationEngineInputs.
 */
export interface VentilationEngineInputs {
  snapshot: AirSnapshot;
  effectiveLevel: RiskLevel;
  slots: TimeSlot[];
  targetRegion?: 'IN' | 'US';
}

function evaluateCautionVentilation(
  snapshot: AirSnapshot,
  slots: TimeSlot[],
  targetRegion: 'IN' | 'US',
): VentilationDecision {
  let minHourPm25 = Infinity;
  let bestHour: number | undefined = undefined;

  for (const point of snapshot.pm25.hourly) {
    if (point.pm25 !== null && !isNaN(point.pm25) && point.pm25 < minHourPm25) {
      minHourPm25 = point.pm25;
      bestHour = parseLocalHour(point.time, snapshot.utcOffsetSeconds);
    }
  }

  const threshold = getLevel1Threshold(targetRegion);

  if (bestHour !== undefined && minHourPm25 <= threshold) {
    const bestMinute = bestHour * 60;
    const containingSlot = slots.find((s) => {
      const startM = parseTimeToMinutes(s.startTime);
      const endM = parseTimeToMinutes(s.endTime);
      return isMinuteInSlot(bestMinute, startM, endM);
    });

    if (containingSlot && containingSlot.forecastLevel <= 1) {
      return {
        verdict: 'brief',
        atHour: bestHour,
        reasonCode: 'BRIEF_WINDOW_QUALIFIED',
        explanation: `Air is in Caution range, but a cleaner window is forecasted around ${bestHour}:00 (${containingSlot.label}). A brief 15–20 minute ventilation window is recommended to refresh indoor air.`,
        uncertainty:
          'Brief ventilation window relies on atmospheric dispersion forecast; close windows immediately if outdoor haze or burning odors increase.',
      };
    }
  }

  return {
    verdict: 'closed',
    reasonCode: 'CAUTION_NO_CLEAN_WINDOW',
    explanation:
      'Air quality is in Caution range without a sufficiently clean forecast window today. Keep windows closed and rely on indoor source control.',
    uncertainty:
      'Indoor CO2 and humidity may rise over extended closed periods; use kitchen exhaust or mechanical recirculation if available.',
  };
}

/**
 * Ventilation decision engine:
 * Inputs: outdoor PM2.5/AQI, trend, time, equipment, and household vulnerability.
 * Outputs: Keep closed, Brief ventilation window, or Ventilate.
 */
export function decideVentilation(inputs: VentilationEngineInputs): VentilationDecision {
  const { snapshot, effectiveLevel, slots, targetRegion = 'IN' } = inputs;
  const { freshness } = snapshot;

  if (freshness === 'stale' || freshness === 'none') {
    return {
      verdict: 'closed',
      reasonCode: 'STALE_OR_MISSING_DATA',
      explanation:
        'Air quality data is stale or unavailable. Keep windows closed as a cautious default until fresh data is received.',
      uncertainty:
        'Without verified current air measurements, outdoor pollution concentration cannot be guaranteed safe for room air exchange.',
    };
  }

  if (effectiveLevel >= 3) {
    return {
      verdict: 'closed',
      reasonCode: 'HIGH_OUTDOOR_POLLUTION',
      explanation:
        'Outdoor pollution is high (Protect/Severe). Keep windows and exterior doors closed to prevent heavy particulate infiltration.',
      uncertainty:
        'Sealing indoor air reduces outdoor infiltration, but source control (minimizing cooking smoke and indoor burning) is required to maintain indoor quality.',
    };
  }

  if (effectiveLevel <= 1) {
    return {
      verdict: 'open',
      reasonCode: 'SAFE_OUTDOOR_CONDITIONS',
      explanation:
        'Outdoor air quality is currently assessed as Clear or Watch. Windows can be opened for fresh air exchange and room ventilation.',
      uncertainty:
        'Local near-source emissions (such as street traffic or local cooking fires) can temporarily elevate immediate neighborhood air.',
    };
  }

  return evaluateCautionVentilation(snapshot, slots, targetRegion);
}
