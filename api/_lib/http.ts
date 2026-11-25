import { type ApiResponse } from './errors';

export interface ServerlessContext {
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface ServerlessEndpoint {
  fetch(request: Request): Promise<Response>;
}

/**
 * Shared serverless request query and header extraction.
 */
export function parseServerlessRequest(request: Request): ServerlessContext {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return { query, headers };
}

/**
 * Converts a typed ApiResponse into a standard Web API Response object.
 */
export function toWebResponse<T>(res: ApiResponse<T>): Response {
  return new Response(JSON.stringify(res.body), {
    status: res.status,
    headers: res.headers,
  });
}

/**
 * Creates a one-line Vercel Serverless Function entry point from a core handler.
 */
export function createFetchHandler<T>(
  handler: (request: Request, ctx: ServerlessContext) => Promise<ApiResponse<T>>,
): ServerlessEndpoint {
  return {
    fetch: async (request: Request): Promise<Response> => {
      const ctx = parseServerlessRequest(request);
      const res = await handler(request, ctx);
      return toWebResponse(res);
    },
  };
}
