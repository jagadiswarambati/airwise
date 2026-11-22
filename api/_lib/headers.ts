/**
 * Standard Security Headers for same-origin API responses.
 * Enforces defense-in-depth across all /api/* handlers.
 */
export function getSecurityHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    ...extra,
  };
}
