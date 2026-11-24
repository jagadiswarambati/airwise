import { describe, it, expect } from 'vitest';
import { validateAIPlanOutput } from '../../src/ai/validator';
import { type AIPlanInput, type AIPlanOutput } from '../../src/ai/schema';

describe('Validator Abuse & Adversarial Suite (TEST_PLAN Section 4)', () => {
  const sampleInput: AIPlanInput = {
    effectiveLevel: 3,
    trend: 'rising',
    slotRisks: [
      { slotId: 'commute-out', level: 3 },
      { slotId: 'evening', level: 3 },
    ],
    radar: {
      memberBand: '5-12',
      peakSlotId: 'evening',
    },
    approvedCandidateIds: ['IN-01', 'PE-03', 'PE-02', 'IN-02', 'MO-06', 'CM-01'],
    mustIncludeIds: ['IN-01', 'PE-03'],
    forbiddenActionIds: ['MO-07', 'IN-10'],
    budgetTier: 'low',
    householdDescriptors: {
      sensitiveCategory: 'respiratory',
      ageGroups: ['5-12', '18-64'],
      equipment: { purifier: false, windowAC: false, hvac: false, kitchenExhaust: true },
      homeHeating: 'none',
    },
    confidenceCeiling: 'medium',
    numericFacts: {
      pm25Now: 85,
      slotMeanPm25Values: [
        { slotId: 'commute-out', pm25: 110 },
        { slotId: 'evening', pm25: 95 },
      ],
      routineTimes: ['07:30', '17:00', '19:00', '22:00'],
    },
  };

  const validOutput: AIPlanOutput = {
    schemaVersion: 1,
    headline: 'High pollution evening expected. Keep windows sealed and prioritize indoor rest.',
    topActionIds: ['IN-01', 'PE-03', 'PE-02'],
    timeline: [
      {
        slotId: 'commute-out',
        actionIds: ['PE-02'],
        note: 'Wear respirator for the 07:30 school trip.',
      },
      {
        slotId: 'evening',
        actionIds: ['IN-01', 'PE-03'],
        note: 'Keep windows closed and shift play inside.',
      },
    ],
    explanations: {
      'IN-01': 'Prevents heavy outdoor PM 2.5 particulate matter from entering the living room.',
      'PE-03': 'Protects developing lungs from strenuous breathing during peak stagnation.',
    },
    assumptions: ['Household has low-cost N95 or suitable masks available.'],
    planConfidence: 'medium',
    confidenceReason: 'Verified model forecast and routine timing alignment.',
  };

  it('accepts valid baseline output', () => {
    const res = validateAIPlanOutput(validOutput, sampleInput);
    expect(res.valid).toBe(true);
  });

  describe('Action ID Safety Constraints', () => {
    it('rejects hallucinated action IDs not in catalog/approved candidate set', () => {
      const bad = {
        ...validOutput,
        topActionIds: ['IN-01', 'PE-03', 'NON_EXISTENT_ID'] as [string, string, string],
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('UNKNOWN_ACTION_ID');
      }
    });

    it('rejects forbidden action IDs', () => {
      const bad = {
        ...validOutput,
        topActionIds: ['IN-01', 'PE-03', 'MO-07'] as [string, string, string],
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('FORBIDDEN_ACTION_ID');
      }
    });

    it('rejects output missing mandatory safety actions', () => {
      const bad = {
        ...validOutput,
        topActionIds: ['PE-02', 'IN-02', 'MO-06'] as [string, string, string],
        timeline: [],
        explanations: {},
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('MUST_INCLUDE_MISSING');
      }
    });

    it('rejects output when urgent mandatory action (IN-01 or PE-03 at level >= 3) is demoted from top 3', () => {
      const bad = {
        ...validOutput,
        topActionIds: ['PE-02', 'IN-02', 'MO-06'] as [string, string, string],
        timeline: [
          {
            slotId: 'evening',
            actionIds: ['IN-01', 'PE-03'],
            note: 'Included in timeline but omitted from top actions',
          },
        ],
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('MUST_INCLUDE_MISSING');
        expect(res.error.message).toContain('top actions');
      }
    });
  });

  describe('Number Parsing by Value & Grounding', () => {
    it('accepts valid time formats: 7:30, 07:30, 6 pm, 6:00 pm, 6am', () => {
      const timesToTest = [
        'Routine departure scheduled at 7:30.',
        'Routine departure scheduled at 07:30.',
        'Evening risk peak around 6 pm.',
        'Evening risk peak around 6:00 pm.',
        'Morning window opening at 6am.',
      ];

      for (const t of timesToTest) {
        const out = {
          ...validOutput,
          headline: t,
        };
        const res = validateAIPlanOutput(out, sampleInput);
        expect(res.valid).toBe(true);
      }
    });

    it('accepts catalog durations like 10 minutes, 15 minutes, 30 minutes', () => {
      const durationsToTest = [
        'Ventilate for 10 minutes during the clean window.',
        'Run exhaust fan for 15 minutes after cooking.',
        'Shift travel time by 30 minutes to reduce exposure.',
      ];

      for (const d of durationsToTest) {
        const out = {
          ...validOutput,
          headline: d,
        };
        const res = validateAIPlanOutput(out, sampleInput);
        expect(res.valid).toBe(true);
      }
    });

    it('rejects invented percentages (e.g. 40%, 88%)', () => {
      const percentages = [
        'Reduces particulate exposure by 40%.',
        'Filtering captures 88% of smoke particles.',
        'Indoor air is 50% cleaner.',
      ];

      for (const p of percentages) {
        const out = {
          ...validOutput,
          headline: p,
        };
        const res = validateAIPlanOutput(out, sampleInput);
        expect(res.valid).toBe(false);
        if (!res.valid) {
          expect(res.error.code).toBe('INVENTED_NUMBERS');
        }
      }
    });

    it('rejects invented numbers not supported by engine facts', () => {
      const ungrounded = [
        'Pollution index spiked by 74 points.',
        'Wait 42 minutes before outdoor exercise.',
        'Outdoor PM2.5 reached 999 near the road.',
      ];

      for (const u of ungrounded) {
        const out = {
          ...validOutput,
          headline: u,
        };
        const res = validateAIPlanOutput(out, sampleInput);
        expect(res.valid).toBe(false);
        if (!res.valid) {
          expect(res.error.code).toBe('INVENTED_NUMBERS');
        }
      }
    });

    it('normalizes NFKC and rejects full-width digits attempting circumvention', () => {
      // Full-width "４０％" (40%)
      const outPercent = {
        ...validOutput,
        headline: 'Reduces particulate exposure by \uFF14\uFF10\uFF05.',
      };
      const resPercent = validateAIPlanOutput(outPercent, sampleInput);
      expect(resPercent.valid).toBe(false);
      if (!resPercent.valid) {
        expect(resPercent.error.code).toBe('INVENTED_NUMBERS');
      }

      // Full-width "８８" (88 - not in allowlist)
      const outNum = {
        ...validOutput,
        headline: 'Particulate score reached \uFF18\uFF18 ug/m3.',
      };
      const resNum = validateAIPlanOutput(outNum, sampleInput);
      expect(resNum.valid).toBe(false);
      if (!resNum.valid) {
        expect(resNum.error.code).toBe('INVENTED_NUMBERS');
      }
    });
  });

  describe('Content Sanitization: Markdown Links, HTML, URLs & Banned Phrases', () => {
    it('rejects markdown links in any generated text', () => {
      const bad = {
        ...validOutput,
        headline: 'Check out [Air Quality Guidelines](https://example.com/guide) now.',
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('BANNED_CONTENT');
      }
    });

    it('rejects HTML tags in generated text', () => {
      const bad = {
        ...validOutput,
        confidenceReason: 'Verified with <script>alert(1)</script> sensors.',
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('BANNED_CONTENT');
      }
    });

    it('rejects bare URLs in generated text', () => {
      const bad = {
        ...validOutput,
        assumptions: ['Household visits https://airwise.local for real-time info.'],
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('BANNED_CONTENT');
      }
    });

    it('rejects banned medical, diagnostic, and cure language', () => {
      const bannedPhrases = [
        'Will cure your respiratory irritation.',
        'Diagnose your asthma progression.',
        'Adjust your inhaler dose before going out.',
        'Take prescribed medication.',
        'We guaranteed 100 percent pure indoor air.',
        'This plan guarantees safe breathing.',
        'Taking these steps will save the planet.',
      ];

      for (const phrase of bannedPhrases) {
        const bad = {
          ...validOutput,
          headline: phrase,
        };
        const res = validateAIPlanOutput(bad, sampleInput);
        expect(res.valid).toBe(false);
        if (!res.valid) {
          expect(res.error.code).toBe('BANNED_PHRASE');
        }
      }
    });
  });

  describe('Confidence Ceiling & Reading Level', () => {
    it('rejects confidence inflation above engine ceiling', () => {
      const bad = {
        ...validOutput,
        planConfidence: 'high' as const, // ceiling is medium
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('CONFIDENCE_INFLATED');
      }
    });

    it('rejects sentences exceeding 30 words', () => {
      // 32 words, 160 characters (fits within explanations 200-char limit)
      const longSentence =
        'Word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word.';
      const bad = {
        ...validOutput,
        explanations: {
          ...validOutput.explanations,
          'IN-01': longSentence,
        },
      };
      const res = validateAIPlanOutput(bad, sampleInput);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('READING_LEVEL_EXCEEDED');
      }
    });
  });
});
