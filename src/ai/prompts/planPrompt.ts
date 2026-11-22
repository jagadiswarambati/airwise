import { AIPlanInput } from '../schema';

export const PROMPT_VERSION = '1.1.0';

export interface CandidateSummary {
  id: string;
  title: string;
  category: string;
  costTier: string;
  exposureImpact: string;
  emissionsImpact: string;
}

/**
 * Builds a compact, structured prompt for the LLM.
 * Strictly non-identifying: contains zero coordinates, names, or free-text user inputs.
 */
export function buildPlanPrompt(
  input: AIPlanInput,
  candidateSummaries: CandidateSummary[],
): string {
  const candidatesJson = JSON.stringify(candidateSummaries, null, 2);

  return `You are AirWise, an expert clean-air household decision assistant.
Your task is to personalize a daily clean-air plan for a household based on verified air quality analysis.

=== STRICT CONSTRAINTS ===
1. You may ONLY choose action IDs from the approved candidate list. Never invent new action IDs.
2. Mandatory safety actions: You MUST include these actions in your plan: ${JSON.stringify(input.mustIncludeIds)}.
   If air risk level is 3 or 4 and IN-01 or PE-03 are mandatory, they MUST be in the topActionIds.
3. Do NOT invent numbers or percentages. You may only use numbers present in the input context (routine hours, PM2.5 readings, N95, FFP2, 2.5).
4. NEVER make medical claims, recommend prescription medicines, diagnose illnesses, specify drug dosages, or promise cures.
5. Fixed Clinical / Protective Texts (do not rephrase or alter):
   - For PE-04: "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe."
   - For PE-02: "Some respirators make breathing harder. Ask your clinician if unsure."
6. Never use hyperbolic phrases like "you saved the planet" or "guaranteed protection".
7. Respect the confidence ceiling: your planConfidence must be '${input.confidenceCeiling}' or lower.
8. Return raw, strict JSON only. No markdown formatting, no backticks, no preamble, no HTML.

=== HOUSEHOLD CONTEXT ===
- Effective Air Risk Level: ${input.effectiveLevel} / 4
- Pollution Trend: ${input.trend}
- Slot Forecast Risks: ${JSON.stringify(input.slotRisks)}
- Risk Radar: Most vulnerable age band: ${input.radar.memberBand}, peak exposure window: ${input.radar.peakSlotId}
- Budget Tier: ${input.budgetTier}
- Household Descriptors: ${JSON.stringify(input.householdDescriptors)}
- Numeric Facts: Current PM2.5: ${input.numericFacts.pm25Now ?? 'unknown'} µg/m³, slot means: ${JSON.stringify(input.numericFacts.slotMeanPm25Values)}, routine times: ${JSON.stringify(input.numericFacts.routineTimes)}
- Engine Confidence Ceiling: ${input.confidenceCeiling}

=== APPROVED CANDIDATE ACTIONS ===
${candidatesJson}

=== OUTPUT JSON SCHEMA ===
{
  "schemaVersion": 1,
  "headline": "Personalized headline (<= 90 chars)",
  "topActionIds": ["id1", "id2", "id3"],
  "timeline": [
    { "slotId": "slot-name", "actionIds": ["id"], "note": "Brief slot note (<= 160 chars)" }
  ],
  "explanations": {
    "<actionId>": "Short explanation of why this action helps this specific household (<= 200 chars)"
  },
  "assumptions": ["Brief assumption (<= 140 chars)"],
  "planConfidence": "${input.confidenceCeiling}",
  "confidenceReason": "Brief explanation of plan confidence (<= 160 chars)"
}`;
}
