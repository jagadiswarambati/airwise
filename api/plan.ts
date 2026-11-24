import { type AIPlanInput, type AIPlanOutput, AIPlanInputSchema } from '../src/ai/schema';
import { validateAIPlanOutput } from '../src/ai/validator';
import { buildPlanPrompt, type CandidateSummary } from '../src/ai/prompts/planPrompt';
import { ACTION_CATALOG } from '../src/domain/catalog/actions';
import { createErrorResponse, type ApiResponse, type ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { withApiGuards } from './_lib/pipeline';

export interface PlanApiResponse {
  success: boolean;
  plan?: AIPlanOutput;
  fallback?: boolean;
  message?: string;
  error?: unknown;
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
  return approvedCandidateIds.map((id) => {
    const action = ACTION_CATALOG.find((a) => a.id === id)!;
    return {
      id: action.id,
      title: action.title,
      category: action.category,
      costTier: action.cost,
      exposureImpact: `${action.impactSpec.exposure.direction} (${action.impactSpec.exposure.label})`,
      emissionsImpact: `${action.impactSpec.emissions.direction} (${action.impactSpec.emissions.label})`,
    };
  });
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
          'Cache-Control': 'no-store, max-age=0',
          ...cors.headers,
        }),
        body: planResult,
      };
    },
  );
}

/**
 * Calls Google Gemini REST endpoint requesting JSON mode.
 */
async function callGeminiJsonMode(prompt: string, apiKey: string): Promise<unknown> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
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
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(text);
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
      message: 'LLM_PROVIDER is none or API key is not configured',
    };
  }

  const prompt = buildPlanPrompt(input, candidateSummaries);

  try {
    const rawResult = await callGeminiJsonMode(prompt, apiKey);
    const validation = validateAIPlanOutput(rawResult, input);
    if (validation.valid) {
      return { success: true, plan: validation.output };
    }

    const retryPrompt = `${prompt}\n\n=== PREVIOUS ATTEMPT FAILED SAFETY VALIDATION ===\nError: ${validation.error.message} (${validation.error.code})\nPlease fix this violation and generate valid strict JSON meeting all rules.`;
    const retryResult = await callGeminiJsonMode(retryPrompt, apiKey);
    const retryValidation = validateAIPlanOutput(retryResult, input);
    if (retryValidation.valid) {
      return { success: true, plan: retryValidation.output };
    }

    return {
      success: false,
      fallback: true,
      error: retryValidation.error,
      message: 'AI output failed safety validation twice; falling back to deterministic plan',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      fallback: true,
      error: message,
      message: 'Failed to contact LLM service; falling back to deterministic plan',
    };
  }
}

/**
 * Vercel Serverless Function entry point.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const rawBody = await request.text();
    const res = await handlePlanCore(rawBody, headers, request.method);
    return new Response(JSON.stringify(res.body), {
      status: res.status,
      headers: res.headers,
    });
  },
};
