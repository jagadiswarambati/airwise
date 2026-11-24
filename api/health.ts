import { createErrorResponse, ApiResponse, ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { validateCorsOrigin } from './_lib/cors';

export interface HealthResponseBody {
  status: 'ok';
  llmEnabled: boolean;
}

/**
 * Pure core health check handler.
 * Completely decoupled from serverless runtimes for direct testability.
 */
export async function handleHealthCore(
  headers: Record<string, string | string[] | undefined> = {},
  method: string = 'GET',
): Promise<ApiResponse<HealthResponseBody | ApiErrorBody>> {
  if (method !== 'GET' && method !== 'HEAD') {
    return createErrorResponse(405, 'MethodNotAllowed', 'Only GET method is supported on /api/health', {
      Allow: 'GET, HEAD',
    });
  }

  const origin = typeof headers['origin'] === 'string' ? headers['origin'] : undefined;
  const host = typeof headers['host'] === 'string' ? headers['host'] : undefined;
  const cors = validateCorsOrigin(origin, host);
  if (!cors.allowed) {
    return createErrorResponse(403, 'Forbidden', 'Cross-origin request not permitted');
  }

  const llmProvider = process.env.LLM_PROVIDER || 'none';
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  const llmEnabled = llmProvider !== 'none' && hasKey;

  return {
    status: 200,
    headers: getSecurityHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      ...cors.headers,
    }),
    body: {
      status: 'ok',
      llmEnabled,
    },
  };
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

    const res = await handleHealthCore(headers, request.method);
    return new Response(JSON.stringify(res.body), {
      status: res.status,
      headers: res.headers,
    });
  },
};
