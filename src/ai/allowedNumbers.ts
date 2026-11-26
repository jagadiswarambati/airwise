import { type AIPlanInput } from './schema';

/**
 * Standard durations present in catalog action descriptions and advice.
 */
export const CATALOG_DURATION_MINUTES = new Set([5, 10, 15, 20, 30, 45, 60]);

function addConstantNumbers(allowedValues: Set<number>): void {
  [0, 1, 2, 3, 4, 2.5, 95, 2].forEach((n) => allowedValues.add(n));
  [5, 12, 13, 17, 18, 64, 65].forEach((n) => allowedValues.add(n));
  CATALOG_DURATION_MINUTES.forEach((n) => allowedValues.add(n));
  for (let h = 0; h <= 23; h++) {
    allowedValues.add(h);
  }
}

function addPm25Facts(input: AIPlanInput, allowedValues: Set<number>): void {
  if (input.numericFacts.pm25Now !== null) {
    const val = input.numericFacts.pm25Now;
    allowedValues.add(val);
    allowedValues.add(Math.round(val));
    allowedValues.add(Math.floor(val));
  }
  for (const s of input.numericFacts.slotMeanPm25Values) {
    if (s.pm25 !== null) {
      allowedValues.add(s.pm25);
      allowedValues.add(Math.round(s.pm25));
      allowedValues.add(Math.floor(s.pm25));
    }
  }
}

function addRoutineTimeFacts(
  routineTimes: string[],
  allowedValues: Set<number>,
): void {
  for (const timeStr of routineTimes) {
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h)) {
      allowedValues.add(h);
      if (h > 12) allowedValues.add(h - 12);
      if (h === 0) allowedValues.add(12);
    }
    if (!isNaN(m)) {
      allowedValues.add(m);
    }
  }
}

function addExtraNumbers(extraNumbers: string[] | undefined, allowedValues: Set<number>): void {
  if (!extraNumbers) return;
  for (const numStr of extraNumbers) {
    const parsed = parseFloat(numStr);
    if (!isNaN(parsed)) {
      allowedValues.add(parsed);
    }
  }
}

/**
 * Derives the comprehensive set of allowed numeric values from engine facts.
 */
export function deriveAllowedNumericValues(
  input: AIPlanInput,
  extraNumbers?: string[],
): {
  allowedValues: Set<number>;
} {
  const allowedValues = new Set<number>();

  addConstantNumbers(allowedValues);
  allowedValues.add(input.effectiveLevel);
  addPm25Facts(input, allowedValues);
  addRoutineTimeFacts(input.numericFacts.routineTimes, allowedValues);
  addExtraNumbers(extraNumbers, allowedValues);

  return { allowedValues };
}

export function sanitizeAuthorizedTokens(rawText: string, allowedValues: Set<number>): string {
  let sanitized = rawText
    .replace(/\bPM\s*2\.5\b/gi, ' __PM_TOKEN__ ')
    .replace(/\bPM2\.5\b/gi, ' __PM_TOKEN__ ')
    .replace(/\bN\s*95\b/gi, ' __RESPIRATOR_TOKEN__ ')
    .replace(/\bN95\b/gi, ' __RESPIRATOR_TOKEN__ ')
    .replace(/\bFFP\s*2\b/gi, ' __RESPIRATOR_TOKEN__ ')
    .replace(/\bFFP2\b/gi, ' __RESPIRATOR_TOKEN__ ')
    .replace(/\b(u5|5-12|13-17|18-64|65\+|under\s+5)\b/gi, ' __AGE_TOKEN__ ');

  sanitized = sanitized.replace(
    /\b(\d{1,2}):(\d{2})(?:\s*(am|pm))?\b/gi,
    (match, hStr, mStr, meridiem) => {
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const isMeridiem = Boolean(meridiem);
      const maxH = isMeridiem ? 12 : 23;
      if (h >= 0 && h <= maxH && m >= 0 && m <= 59) {
        return ' __TIME_TOKEN__ ';
      }
      return match;
    },
  );

  sanitized = sanitized.replace(/\b(\d{1,2})\s*(am|pm)\b/gi, (match, hStr) => {
    const h = parseInt(hStr, 10);
    return h >= 1 && h <= 12 ? ' __TIME_TOKEN__ ' : match;
  });

  return sanitized.replace(/\b(\d+)\s*(?:minutes?|mins?|hours?|hrs?)\b/gi, (match, dStr) => {
    const d = parseInt(dStr, 10);
    return CATALOG_DURATION_MINUTES.has(d) || allowedValues.has(d)
      ? ' __DURATION_TOKEN__ '
      : match;
  });
}
