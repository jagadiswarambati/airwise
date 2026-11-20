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
  /\btreat(ment|s|ing)?\b/i,
  /\bcure[s]?\b/i,
  /\bmedicat(ion|ions|ed)?\b/i,
  /\bmedicin(e|es)?\b/i,
  /\bdos(e|age|ages|ing)?\b/i,
  /\bprescrib[a-z]*/i,
  /\binhaler dose\b/i,
  /\bdoctor ordered\b/i,
  /sav(e|ed|ing) the planet/i,
  /\bguarantee[d|s]?\b/i,
];

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Validates candidate LLM plan output deterministically against safety rules and invariants.
 */
export function validateAIPlanOutput(rawJson: unknown, input: AIPlanInput): ValidationResult {
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

  // Check 4: Number allowlist verification
  // Extract all digit sequences from generated natural language
  const textCorpus: string[] = [
    output.headline,
    output.confidenceReason,
    ...output.timeline.map((t) => t.note),
    ...Object.values(output.explanations),
    ...output.assumptions,
  ];

  const allowedNumberSet = new Set(input.allowlistedNumbers);

  for (const text of textCorpus) {
    const numbersInText = text.match(/\d+(?:\.\d+)?/g);
    if (numbersInText) {
      for (const num of numbersInText) {
        if (!allowedNumberSet.has(num)) {
          return {
            valid: false,
            error: {
              code: 'INVENTED_NUMBERS',
              message: `Invented or unsupported number '${num}' found in output text`,
            },
          };
        }
      }
    }
  }

  // Check 5: Banned phrase scan (medical, cures, false promises)
  const fullCorpusString = textCorpus.join(' ');
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

  // Check 6: Sentence reading-level heuristic
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

  return {
    valid: true,
    output,
  };
}
