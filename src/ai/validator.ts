import { type AIPlanInput, type AIPlanOutput, AIPlanOutputSchema } from './schema';
import { type Confidence } from '../domain/types';
import { deriveAllowedNumericValues, sanitizeAuthorizedTokens } from './allowedNumbers';
import { BANNED_PATTERNS, normalizeUnicodeDigitsToAscii } from './validatorHelpers';
export { normalizeUnicodeDigitsToAscii } from './validatorHelpers';

export { deriveAllowedNumericValues } from './allowedNumbers';

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

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function checkSchema(
  rawJson: unknown,
): { valid: true; output: AIPlanOutput } | ValidationFailure {
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
  return { valid: true, output: parsed.data };
}

function collectAllSelectedActionIds(output: AIPlanOutput): Set<string> {
  const ids = new Set<string>();
  for (const id of output.topActionIds) {
    ids.add(id);
  }
  for (const item of output.timeline) {
    for (const id of item.actionIds) {
      ids.add(id);
    }
  }
  for (const id of Object.keys(output.explanations)) {
    ids.add(id);
  }
  return ids;
}

export function checkIds(output: AIPlanOutput, input: AIPlanInput): ValidationFailure | null {
  const approvedSet = new Set(input.approvedCandidateIds);
  const forbiddenSet = new Set(input.forbiddenActionIds);
  const allSelectedActionIds = collectAllSelectedActionIds(output);

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
  return null;
}

export function checkMustInclude(output: AIPlanOutput, input: AIPlanInput): ValidationFailure | null {
  const allSelectedActionIds = collectAllSelectedActionIds(output);

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
  return null;
}

export function checkLinks(fullCorpusString: string): ValidationFailure | null {
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
  return null;
}

export function checkBannedPhrases(fullCorpusString: string): ValidationFailure | null {
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
  return null;
}

export function checkReadingLevel(fullCorpusString: string): ValidationFailure | null {
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
  return null;
}

export function checkConfidenceCeiling(output: AIPlanOutput, input: AIPlanInput): ValidationFailure | null {
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
  return null;
}

export function checkNumbers(
  textCorpus: string[],
  fullCorpusString: string,
  input: AIPlanInput,
  extraNumbers?: string[],
): ValidationFailure | null {
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
    const sanitized = sanitizeAuthorizedTokens(rawText, allowedValues);
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
  return null;
}

export function buildNormalizedTextCorpus(output: AIPlanOutput): string[] {
  return [
    output.headline,
    output.confidenceReason,
    ...output.timeline.map((t) => t.note),
    ...Object.values(output.explanations),
    ...output.assumptions,
  ].map((t) => normalizeUnicodeDigitsToAscii(t));
}

/**
 * Validates candidate LLM plan output deterministically against safety rules and invariants.
 */
export function validateAIPlanOutput(
  rawJson: unknown,
  input: AIPlanInput,
  extraNumbers?: string[],
): ValidationResult {
  const schemaResult = checkSchema(rawJson);
  if (!schemaResult.valid) {
    return schemaResult;
  }
  const output = schemaResult.output;

  const idsFailure = checkIds(output, input);
  if (idsFailure) return idsFailure;

  const mustIncludeFailure = checkMustInclude(output, input);
  if (mustIncludeFailure) return mustIncludeFailure;

  const textCorpus = buildNormalizedTextCorpus(output);
  const fullCorpusString = textCorpus.join(' ');

  const linksFailure = checkLinks(fullCorpusString);
  if (linksFailure) return linksFailure;

  const bannedPhrasesFailure = checkBannedPhrases(fullCorpusString);
  if (bannedPhrasesFailure) return bannedPhrasesFailure;

  const readingLevelFailure = checkReadingLevel(fullCorpusString);
  if (readingLevelFailure) return readingLevelFailure;

  const confidenceFailure = checkConfidenceCeiling(output, input);
  if (confidenceFailure) return confidenceFailure;

  const numbersFailure = checkNumbers(textCorpus, fullCorpusString, input, extraNumbers);
  if (numbersFailure) return numbersFailure;

  return {
    valid: true,
    output,
  };
}
