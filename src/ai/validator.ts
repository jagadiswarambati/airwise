import { AIPlanInput, AIPlanOutput, AIPlanOutputSchema } from './schema';
import { Confidence } from '../domain/types';

export interface ValidationSuccess {
  valid: true;
  output: AIPlanOutput;
}

export interface ValidationFailure {
  valid: false;
  error: {
    code:
      | 'SCHEMA_ERROR'
      | 'EXTRA_KEYS'
      | 'UNKNOWN_ACTION_ID'
      | 'FORBIDDEN_ACTION_ID'
      | 'MUST_INCLUDE_MISSING'
      | 'INVENTED_NUMBERS'
      | 'BANNED_PHRASE'
      | 'BANNED_CONTENT'
      | 'OVERSIZED_STRING'
      | 'READING_LEVEL_EXCEEDED'
      | 'CONFIDENCE_INFLATED';
    message: string;
    details?: unknown;
  };
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

const BANNED_PATTERNS = [
  /\bdiagnos[a-z]*/i,
  /\btreat(?:ment|s|ing)?\b/i,
  /\bcures?\b/i,
  /\bmedicat(?:ion|ions|ed)?\b/i,
  /\bmedicines?\b/i,
  /\bdos(?:e|age|ages|ing)?\b/i,
  /\bprescrib[a-z]*/i,
  /\binhaler dose\b/i,
  /\bdoctor ordered\b/i,
  /sav(?:e|ed|ing) the planet/i,
  /\bguarantee(?:d|s)?\b/i,
];

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Standard durations present in catalog action descriptions and advice.
 */
const CATALOG_DURATION_MINUTES = new Set([5, 10, 15, 20, 30, 45, 60]);

/**
 * Derives the comprehensive set of allowed numeric values from engine facts.
 */
export function deriveAllowedNumericValues(
  input: AIPlanInput,
  extraNumbers?: string[],
): {
  allowedValues: Set<number>;
  routineTimePairs: Set<string>;
} {
  const allowedValues = new Set<number>();
  const routineTimePairs = new Set<string>();

  // 1. Standard engine constants (levels, PM2.5, N95, FFP2)
  [0, 1, 2, 3, 4, 2.5, 95, 2].forEach((n) => allowedValues.add(n));

  // 2. Age group boundary constants
  [5, 12, 13, 17, 18, 64, 65].forEach((n) => allowedValues.add(n));

  // 3. Catalog durations
  CATALOG_DURATION_MINUTES.forEach((n) => allowedValues.add(n));

  // 4. Effective level
  allowedValues.add(input.effectiveLevel);

  // 5. Snapshot PM2.5 facts
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

  // 6. Routine times
  for (const timeStr of input.numericFacts.routineTimes) {
    routineTimePairs.add(timeStr);
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h)) {
      allowedValues.add(h);
      if (h > 12) allowedValues.add(h - 12);
      if (h === 0) allowedValues.add(12);
      routineTimePairs.add(`${h}:${mStr}`);
    }
    if (!isNaN(m)) {
      allowedValues.add(m);
    }
  }

  // 7. General clock hours (0..23) are permitted for time references
  for (let h = 0; h <= 23; h++) {
    allowedValues.add(h);
  }

  // 8. Extra numbers (for testing or explicit allowlists)
  if (extraNumbers) {
    for (const numStr of extraNumbers) {
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed)) {
        allowedValues.add(parsed);
      }
    }
  }

  return { allowedValues, routineTimePairs };
}

/**
 * Validates candidate LLM plan output deterministically against safety rules and invariants.
 */
export function validateAIPlanOutput(
  rawJson: unknown,
  input: AIPlanInput,
  extraNumbers?: string[],
): ValidationResult {
  // Check 1: Strict Zod schema
  const parsed = AIPlanOutputSchema.safeParse(rawJson);
  if (!parsed.success) {
    return {
      valid: false,
      error: {
        code: 'SCHEMA_ERROR',
        message: 'Plan output did not match expected schema',
        details: parsed.error.issues,
      },
    };
  }

  const output = parsed.data;

  // Check 2: Action IDs in candidate allowlist & not in forbidden set
  const approvedSet = new Set(input.approvedCandidateIds);
  const forbiddenSet = new Set(input.forbiddenActionIds);

  const allSelectedActionIds = new Set<string>();
  for (const id of output.topActionIds) {
    allSelectedActionIds.add(id);
  }
  for (const item of output.timeline) {
    for (const id of item.actionIds) {
      allSelectedActionIds.add(id);
    }
  }
  for (const id of Object.keys(output.explanations)) {
    allSelectedActionIds.add(id);
  }

  for (const id of allSelectedActionIds) {
    if (forbiddenSet.has(id)) {
      return {
        valid: false,
        error: {
          code: 'FORBIDDEN_ACTION_ID',
          message: `Action ID '${id}' is forbidden for this household profile/scenario`,
        },
      };
    }
    if (!approvedSet.has(id)) {
      return {
        valid: false,
        error: {
          code: 'UNKNOWN_ACTION_ID',
          message: `Action ID '${id}' is not in the approved candidate set`,
        },
      };
    }
  }

  // Check 3: Mandatory safety actions (mustInclude) preserved
  for (const reqId of input.mustIncludeIds) {
    if (!allSelectedActionIds.has(reqId)) {
      return {
        valid: false,
        error: {
          code: 'MUST_INCLUDE_MISSING',
          message: `Mandatory safety action '${reqId}' was omitted from the plan`,
        },
      };
    }
    // Urgent mandatory actions (e.g. IN-01, PE-03) must be in topActionIds if effectiveLevel >= 3
    if (input.effectiveLevel >= 3 && (reqId === 'IN-01' || reqId === 'PE-03')) {
      if (!output.topActionIds.includes(reqId)) {
        return {
          valid: false,
          error: {
            code: 'MUST_INCLUDE_MISSING',
            message: `Urgent safety action '${reqId}' must be ranked in top actions`,
          },
        };
      }
    }
  }

  // Prepare text corpus with NFKC normalization
  const textCorpus: string[] = [
    output.headline,
    output.confidenceReason,
    ...output.timeline.map((t) => t.note),
    ...Object.values(output.explanations),
    ...output.assumptions,
  ].map((t) => t.normalize('NFKC'));

  const fullCorpusString = textCorpus.join(' ');

  // Check 4: Reject Markdown links, HTML tags, and URLs
  const hasMarkdownLink = /\[[^\]]+\]\([^)]+\)/.test(fullCorpusString);
  const hasHtmlTag = /<[a-z/][\s\S]*?>/i.test(fullCorpusString);
  const hasUrl = /\b(?:https?:\/\/|www\.)\S+/i.test(fullCorpusString);

  if (hasMarkdownLink || hasHtmlTag || hasUrl) {
    return {
      valid: false,
      error: {
        code: 'BANNED_CONTENT',
        message: 'Markdown links, HTML tags, and URLs are not permitted in plan output',
      },
    };
  }

  // Check 5: Banned phrase scan (medical, cures, false promises)
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(fullCorpusString)) {
      return {
        valid: false,
        error: {
          code: 'BANNED_PHRASE',
          message: `Prohibited medical or unsupported phrase matched: ${pattern.toString()}`,
        },
      };
    }
  }

  // Check 6: Sentence reading-level heuristic (max 30 words per sentence)
  const sentences = fullCorpusString.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  for (const sentence of sentences) {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount > 30) {
      return {
        valid: false,
        error: {
          code: 'READING_LEVEL_EXCEEDED',
          message: `Sentence exceeds readability word budget (${wordCount} words): '${sentence.trim().slice(0, 50)}...'`,
        },
      };
    }
  }

  // Check 7: Confidence ceiling
  const modelRank = CONFIDENCE_RANK[output.planConfidence];
  const ceilingRank = CONFIDENCE_RANK[input.confidenceCeiling];
  if (modelRank > ceilingRank) {
    return {
      valid: false,
      error: {
        code: 'CONFIDENCE_INFLATED',
        message: `Plan confidence '${output.planConfidence}' exceeds the engine's ceiling '${input.confidenceCeiling}'`,
      },
    };
  }

  // Check 8: Number allowlist verification by VALUE
  // Reject any invented percentages (no percentage is an engine fact)
  const percentMatch = fullCorpusString.match(/\b\d+(?:\.\d+)?\s*%/);
  if (percentMatch) {
    return {
      valid: false,
      error: {
        code: 'INVENTED_NUMBERS',
        message: `Invented percentage '${percentMatch[0]}' found in output text`,
      },
    };
  }

  const { allowedValues } = deriveAllowedNumericValues(input, extraNumbers);

  for (const rawText of textCorpus) {
    // 1. Mask approved special tokens to avoid false number extraction (use digit-free placeholders)
    let sanitized = rawText
      .replace(/\bPM\s*2\.5\b/gi, ' __PM_TOKEN__ ')
      .replace(/\bPM2\.5\b/gi, ' __PM_TOKEN__ ')
      .replace(/\bN\s*95\b/gi, ' __RESPIRATOR_TOKEN__ ')
      .replace(/\bN95\b/gi, ' __RESPIRATOR_TOKEN__ ')
      .replace(/\bFFP\s*2\b/gi, ' __RESPIRATOR_TOKEN__ ')
      .replace(/\bFFP2\b/gi, ' __RESPIRATOR_TOKEN__ ')
      .replace(/\b(u5|5-12|13-17|18-64|65\+|under\s+5)\b/gi, ' __AGE_TOKEN__ ');

    // 2. Mask valid clock times (e.g. "07:30", "7:30", "6 pm", "6:00 pm", "6am")
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
      }
    );

    sanitized = sanitized.replace(/\b(\d{1,2})\s*(am|pm)\b/gi, (match, hStr) => {
      const h = parseInt(hStr, 10);
      if (h >= 1 && h <= 12) {
        return ' __TIME_TOKEN__ ';
      }
      return match;
    });

    // 3. Mask valid durations (e.g. "10 minutes", "15 min", "1 hour")
    sanitized = sanitized.replace(/\b(\d+)\s*(?:minutes?|mins?|hours?|hrs?)\b/gi, (match, dStr) => {
      const d = parseInt(dStr, 10);
      if (CATALOG_DURATION_MINUTES.has(d) || allowedValues.has(d)) {
        return ' __DURATION_TOKEN__ ';
      }
      return match;
    });

    // 4. Check all remaining digit sequences by numeric value
    const remainingNumbers = sanitized.match(/\d+(?:\.\d+)?/g);
    if (remainingNumbers) {
      for (const numStr of remainingNumbers) {
        const val = parseFloat(numStr);
        if (!allowedValues.has(val)) {
          return {
            valid: false,
            error: {
              code: 'INVENTED_NUMBERS',
              message: `Invented or unsupported number '${numStr}' found in output text`,
            },
          };
        }
      }
    }
  }

  return {
    valid: true,
    output,
  };
}
