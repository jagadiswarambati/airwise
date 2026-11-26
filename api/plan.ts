import { z } from 'zod';
import { type AIPlanInput, type AIPlanOutput, AIPlanInputSchema } from '../src/ai/schema';
import { validateAIPlanOutput } from '../src/ai/validator';
import { buildPlanPrompt, type CandidateSummary } from '../src/ai/prompts/planPrompt';
import { ACTION_CATALOG } from '../src/domain/catalog/actions';
import { createErrorResponse, type ApiResponse, type ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { withApiGuards } from './_lib/pipeline';
import { createFetchHandler, readBodyWithLimit } from './_lib/http';

export interface PlanApiResponse {
  success: boolean;
  plan?: AIPlanOutput;
  fallback?: boolean;
  message?: string;
}

const CATALOG_ID_SET = new Set(ACTION_CATALOG.map((a) => a.id));

function validateCatalogExistence(ids: string[], fieldName: string): ApiResponse<ApiErrorBody> | null {
  for (const id of ids) {
    if (!CATALOG_ID_SET.has(id)) {
      return createErrorResponse(
        400,
        'ValidationError',
        `Action ID '${id}' in ${fieldName} does not exist in catalog`,
      );
    }
  }
  return null;
}

function validatePlanCatalog(input: AIPlanInput): ApiResponse<ApiErrorBody> | null {
  const approvedErr = validateCatalogExistence(input.approvedCandidateIds, 'approvedCandidateIds');
  if (approvedErr) return approvedErr;

  const mustErr = validateCatalogExistence(input.mustIncludeIds, 'mustIncludeIds');
  if (mustErr) return mustErr;

  const forbiddenErr = validateCatalogExistence(input.forbiddenActionIds, 'forbiddenActionIds');
  if (forbiddenErr) return forbiddenErr;

  const approvedSet = new Set(input.approvedCandidateIds);
  for (const id of input.forbiddenActionIds) {
    if (approvedSet.has(id)) {
      return createErrorResponse(
        400,
        'ValidationError',
        `Action ID '${id}' cannot be in both approvedCandidateIds and forbiddenActionIds`,
      );
    }
  }

  for (const id of input.mustIncludeIds) {
    if (!approvedSet.has(id)) {
      return createErrorResponse(
        400,
        'ValidationError',
        `Must-include action ID '${id}' must be in approvedCandidateIds`,
      );
    }
  }

  return null;
}

function buildCandidateSummaries(approvedCandidateIds: string[]): CandidateSummary[] {
  const summaries: CandidateSummary[] = [];
  for (const id of approvedCandidateIds) {
    const action = ACTION_CATALOG.find((a) => a.id === id);
    if (!action) continue;
    summaries.push({
      id: action.id,
      title: action.title,
      category: action.category,
      costTier: action.cost,
      exposureImpact: `${action.impactSpec.exposure.direction} (${action.impactSpec.exposure.label})`,
      emissionsImpact: `${action.impactSpec.emissions.direction} (${action.impactSpec.emissions.label})`,
    });
  }
  return summaries;
}

/**
 * Pure core plan handler.
 */
export async function handlePlanCore(
  rawBody: string,
  headers: Record<string, string | string[] | undefined> = {},
  method: string = 'POST',
  bodyBytes?: number,
): Promise<ApiResponse<PlanApiResponse | ApiErrorBody>> {
  const actualBytes = bodyBytes ?? Buffer.byteLength(rawBody, 'utf-8');

  return withApiGuards(
    {
      endpointName: '/api/plan',
      allowedMethods: ['POST'],
      allowHeader: 'POST',
      maxBodyBytes: 8192,
      requireJsonContentType: true,
      rateLimitBucket: 'plan',
    },
    { headers, method, bodyBytes: actualBytes },
    async (cors) => {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawBody);
      } catch {
        return createErrorResponse(400, 'ValidationError', 'Invalid JSON body format');
      }

      const parseResult = AIPlanInputSchema.safeParse(parsedJson);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        return createErrorResponse(
          400,
          'ValidationError',
          `Plan input validation failed: ${issue?.path.join('.') || 'input'} - ${issue?.message || 'Invalid format'}`,
        );
      }

      const input = parseResult.data;
      const catalogError = validatePlanCatalog(input);
      if (catalogError) {
        return catalogError;
      }

      const candidateSummaries = buildCandidateSummaries(input.approvedCandidateIds);
      const planResult = await handlePlanRequest(input, candidateSummaries);

      return {
        status: 200,
        headers: getSecurityHeaders({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...cors.headers,
        }),
        body: planResult,
      };
    },
  );
}

export const GeminiResponseEnvelopeSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z
            .array(
              z.object({
                text: z.string().max(8192, 'Gemini response text exceeds maximum cap'),
              }),
            )
            .min(1),
        }),
      }),
    )
    .min(1),
});

/**
 * Calls Google Gemini REST endpoint requesting JSON mode.
 */
async function callGeminiJsonMode(
  prompt: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<unknown> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    throw new Error('Gemini API request failed');
  }

  let rawJson: unknown;
  try {
    rawJson = await res.json();
  } catch {
    throw new Error('Malformed upstream JSON from Gemini API');
  }

  const envelopeParse = GeminiResponseEnvelopeSchema.safeParse(rawJson);
  if (!envelopeParse.success) {
    throw new Error('Malformed Gemini response envelope');
  }

  const text = envelopeParse.data.candidates[0].content.parts[0].text;
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(text);
  } catch {
    throw new Error('Gemini response part is not valid JSON');
  }

  return parsedContent;
}

/**
 * Serverless API handler for /api/plan
 */
export async function handlePlanRequest(
  input: AIPlanInput,
  candidateSummaries: CandidateSummary[],
): Promise<PlanApiResponse> {
  const provider = process.env.LLM_PROVIDER || 'none';
  const apiKey = process.env.GEMINI_API_KEY;

  if (provider === 'none' || !apiKey) {
    return {
      success: false,
      fallback: true,
      message: 'AI personalisation is unavailable right now.',
    };
  }

  const prompt = buildPlanPrompt(input, candidateSummaries);
  const startTime = Date.now();
  const TOTAL_BUDGET_MS = 12000;
  const ATTEMPT_TIMEOUT_MS = 6000;
  const MIN_RETRY_REMAINING_MS = 3000;

  try {
    const elapsed1 = Date.now() - startTime;
    const remaining1 = TOTAL_BUDGET_MS - elapsed1;
    const timeout1 = Math.min(ATTEMPT_TIMEOUT_MS, Math.max(0, remaining1));
    const rawResult = await callGeminiJsonMode(prompt, apiKey, AbortSignal.timeout(timeout1));
    const validation = validateAIPlanOutput(rawResult, input);
    if (validation.valid) {
      return { success: true, plan: validation.output };
    }

    // Skip retry if less than 3 seconds remain of total budget
    const elapsedAfterAttempt1 = Date.now() - startTime;
    const remainingForRetry = TOTAL_BUDGET_MS - elapsedAfterAttempt1;
    if (remainingForRetry < MIN_RETRY_REMAINING_MS) {
      return {
        success: false,
        fallback: true,
        message: 'AI personalisation is unavailable right now.',
      };
    }

    const retryTimeout = Math.min(ATTEMPT_TIMEOUT_MS, remainingForRetry);
    // Retry prompt includes only fixed internal error codes, never text from model or validator free-text fields
    const retryPrompt = `${prompt}\n\n=== PREVIOUS ATTEMPT FAILED SAFETY VALIDATION ===\nViolation code: ${validation.error.code}\nPlease fix this violation and generate valid strict JSON meeting all rules.`;
    const retryResult = await callGeminiJsonMode(
      retryPrompt,
      apiKey,
      AbortSignal.timeout(retryTimeout),
    );
    const retryValidation = validateAIPlanOutput(retryResult, input);
    if (retryValidation.valid) {
      return { success: true, plan: retryValidation.output };
    }

    return {
      success: false,
      fallback: true,
      message: 'AI personalisation is unavailable right now.',
    };
  } catch (_err: unknown) {
    return {
      success: false,
      fallback: true,
      message: 'AI personalisation is unavailable right now.',
    };
  }
}

/**
 * Vercel Serverless Function entry point.
 */
export default createFetchHandler(async (req, { headers }) => {
  const MAX_BYTES = 8192;
  const readResult = await readBodyWithLimit(req, MAX_BYTES);
  if ('tooLarge' in readResult) {
    return createErrorResponse(
      413,
      'PayloadTooLarge',
      `Payload exceeds maximum size limit of ${MAX_BYTES} bytes`,
    );
  }
  return handlePlanCore(readResult.text, headers, req.method, readResult.bytes);
});
