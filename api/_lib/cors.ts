export interface CorsValidationResult {
  allowed: boolean;
  headers: Record<string, string>;
}

/**
 * Validates request Origin per SECURITY_PRIVACY §7:
 * - No CORS by default (same-origin).
 * - If ALLOWED_ORIGIN is set, only that exact origin is allowed and echoed back.
 * - If Origin header is present and disallowed, reject with 403.
 */
export function validateCorsOrigin(
  origin?: string | null,
  host?: string | null,
): CorsValidationResult {
  // Same-origin GET / non-browser requests have no Origin header
  if (!origin) {
    return { allowed: true, headers: {} };
  }

  const allowedOriginEnv = process.env.ALLOWED_ORIGIN?.trim();

  if (allowedOriginEnv) {
    if (origin === allowedOriginEnv) {
      return {
        allowed: true,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Vary': 'Origin',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      };
    }
    return { allowed: false, headers: {} };
  }

  // ALLOWED_ORIGIN is not configured.
  // Permit if Origin matches same-origin Host (e.g. localhost dev or deployment host).
  if (host) {
    const isSameOrigin =
      origin === `http://${host}` ||
      origin === `https://${host}` ||
      origin === host;
    if (isSameOrigin) {
      return { allowed: true, headers: {} };
    }
  }

  // Cross-origin request with no matching ALLOWED_ORIGIN is rejected (403)
  return { allowed: false, headers: {} };
}
