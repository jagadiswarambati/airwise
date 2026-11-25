/**
 * Shared serverless request query and header extraction.
 */
export function parseServerlessRequest(request: Request): {
  query: Record<string, string>;
  headers: Record<string, string>;
} {
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
