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
  if (res.status === 204) {
    return new Response(null, {
      status: 204,
      headers: res.headers,
    });
  }
  return new Response(JSON.stringify(res.body), {
    status: res.status,
    headers: res.headers,
  });
}

/**
 * Reads a Request body stream with a strict byte limit.
 * Cancels stream reading early if payload exceeds maxBytes.
 */
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<{ text: string; bytes: number } | { tooLarge: true; bytes: number }> {
  if (!request.body) {
    return { text: '', bytes: 0 };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          return { tooLarge: true, bytes: totalBytes };
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder('utf-8').decode(merged);
  return { text, bytes: totalBytes };
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
