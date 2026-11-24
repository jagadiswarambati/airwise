/**
 * Application logger.
 * Enforces privacy and environment safety:
 * - debug is a no-op outside development.
 * - warn and error log generic messages and error names only.
 * - Logs must NEVER contain profile data, health flags, or coordinates.
 */

const isDev =
  typeof process !== 'undefined'
    ? process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
    : false;

export function debug(...args: unknown[]): void {
  if (isDev) {
    console.debug(...args);
  }
}

export function warn(message: string, errorName?: string): void {
  if (errorName) {
    console.warn(`[AirWise] ${message}: ${errorName}`);
  } else {
    console.warn(`[AirWise] ${message}`);
  }
}

export function error(message: string, errorName?: string): void {
  if (errorName) {
    console.error(`[AirWise] ${message}: ${errorName}`);
  } else {
    console.error(`[AirWise] ${message}`);
  }
}

export const logger = {
  debug,
  warn,
  error,
};
