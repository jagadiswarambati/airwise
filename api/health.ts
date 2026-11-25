import { type ApiResponse, type ApiErrorBody } from './_lib/errors';
import { getSecurityHeaders } from './_lib/headers';
import { withApiGuards } from './_lib/pipeline';
import { parseServerlessRequest } from './_lib/request';

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
  return withApiGuards(
    {
      endpointName: '/api/health',
      allowedMethods: ['GET', 'HEAD'],
      allowHeader: 'GET, HEAD',
    },
    { headers, method },
    async (cors) => {
      const llmProvider = process.env.LLM_PROVIDER || 'none';
      const llmEnabled = llmProvider !== 'none';

      return {
        status: 200,
        headers: getSecurityHeaders({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...cors.headers,
        }),
        body: {
          status: 'ok',
          llmEnabled,
        },
      };
    },
  );
}

/**
 * Vercel Serverless Function entry point.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const { headers } = parseServerlessRequest(request);
    const res = await handleHealthCore(headers, request.method);
    return new Response(JSON.stringify(res.body), {
      status: res.status,
      headers: res.headers,
    });
  },
};
