import { AIPlanInput, AIPlanOutput, AIPlanInputSchema } from '../src/ai/schema';
import { validateAIPlanOutput } from '../src/ai/validator';
import { buildPlanPrompt, CandidateSummary } from '../src/ai/prompts/planPrompt';
import { ACTION_CATALOG } from '../src/domain/catalog/actions';
import { createErrorResponse, ApiResponse, ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { validateCorsOrigin } from './_lib/cors';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';
import { validatePayloadSize } from './_lib/validate';

export interface PlanApiResponse {
  success: boolean;
  plan?: AIPlanOutput;
  fallback?: boolean;
  message?: string;
  error?: unknown;
}

const CATALOG_ID_SET = new Set(ACTION_CATALOG.map((a) => a.id));

/**
 * Pure core plan handler.
 */
export async function handlePlanCore(
  rawBody: string,
  headers: Record<string, string | string[] | undefined> = {},
  method: string = 'POST',
  bodyBytes?: number,
): Promise<ApiResponse<PlanApiResponse | ApiErrorBody>> {
  // 1. Method check
  if (method !== 'POST') {
    return createErrorResponse(405, 'MethodNotAllowed', 'Only POST method is supported on /api/plan', {
      Allow: 'POST',
    });
  }

  // 2. CORS check
  const origin = typeof headers['origin'] === 'string' ? headers['origin'] : undefined;
  const host = typeof headers['host'] === 'string' ? headers['host'] : undefined;
  const cors = validateCorsOrigin(origin, host);
  if (!cors.allowed) {
    return createErrorResponse(403, 'Forbidden', 'Cross-origin request not permitted');
  }

  // 3. Content-Type check (415 Unsupported Media Type)
  const contentType = typeof headers['content-type'] === 'string' ? headers['content-type'] : '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return createErrorResponse(
      415,
      'UnsupportedMediaType',
      'Content-Type must be application/json',
    );
  }

  // 4. Payload size check (8 KB cap)
  const actualBytes = bodyBytes ?? Buffer.byteLength(rawBody, 'utf-8');
  const contentLength = typeof headers['content-length'] === 'string' ? headers['content-length'] : undefined;
  const sizeValidation = validatePayloadSize(contentLength, actualBytes, 8192);
  if (!sizeValidation.valid) {
    return sizeValidation.response;
  }

  // 5. Rate limit check (6 req/min, burst 2)
  const ip = getClientIp(headers);
  const rateLimit = checkRateLimit(ip, 'plan');
  if (!rateLimit.allowed) {
    return createErrorResponse(429, 'RateLimited', 'Too many requests. Please try again later.', {
      'Retry-After': String(rateLimit.retryAfterSeconds || 30),
    });
  }

  // 6. JSON parse
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return createErrorResponse(400, 'ValidationError', 'Invalid JSON body format');
  }

  // 7. Schema validation
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

  // 8. Server-side Catalog verification
  // Verify all IDs exist in catalog
  for (const id of input.approvedCandidateIds) {
    if (!CATALOG_ID_SET.has(id)) {
      return createErrorResponse(400, 'ValidationError', `Action ID '${id}' in approvedCandidateIds does not exist in catalog`);
    }
  }
  for (const id of input.mustIncludeIds) {
    if (!CATALOG_ID_SET.has(id)) {
      return createErrorResponse(400, 'ValidationError', `Action ID '${id}' in mustIncludeIds does not exist in catalog`);
    }
  }
  for (const id of input.forbiddenActionIds) {
    if (!CATALOG_ID_SET.has(id)) {
      return createErrorResponse(400, 'ValidationError', `Action ID '${id}' in forbiddenActionIds does not exist in catalog`);
    }
  }

  // Verify approved and forbidden are disjoint
  const approvedSet = new Set(input.approvedCandidateIds);
  for (const id of input.forbiddenActionIds) {
    if (approvedSet.has(id)) {
      return createErrorResponse(400, 'ValidationError', `Action ID '${id}' cannot be in both approvedCandidateIds and forbiddenActionIds`);
    }
  }

  // Verify mustInclude is a subset of approved
  for (const id of input.mustIncludeIds) {
    if (!approvedSet.has(id)) {
      return createErrorResponse(400, 'ValidationError', `Must-include action ID '${id}' must be in approvedCandidateIds`);
    }
  }

  // 9. Build candidate summaries from catalog on server
  const candidateSummaries: CandidateSummary[] = input.approvedCandidateIds.map((id) => {
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

  // 10. Execute plan request
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
}

/**
 * Serverless API handler for /api/plan
 * Enforces server-side Gemini invocation, zero client secret exposure,
 * strict schema validation, one retry on error, and fallback.
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
      return {
        success: true,
        plan: validation.output,
      };
    }

    // Validation failed: retry ONCE with error feedback
    const retryPrompt = `${prompt}\n\n=== PREVIOUS ATTEMPT FAILED SAFETY VALIDATION ===
Error: ${validation.error.message} (${validation.error.code})
Please fix this violation and generate valid strict JSON meeting all rules.`;

    const retryResult = await callGeminiJsonMode(retryPrompt, apiKey);
    const retryValidation = validateAIPlanOutput(retryResult, input);

    if (retryValidation.valid) {
      return {
        success: true,
        plan: retryValidation.output,
      };
    }

    // Both attempts failed: graceful fallback
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
 * Calls Google Gemini REST endpoint requesting JSON mode.
 * Key is sent in request header x-goog-api-key, never in the URL query.
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
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
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
