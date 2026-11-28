import { getSecurityHeaders } from './headers';

/**
 * ApiErrorCode.
 */
export type ApiErrorCode =
  | 'DataUnavailable'
  | 'DataStale'
  | 'ProviderSchemaError'
  | 'LlmUnavailable'
  | 'LlmInvalid'
  | 'GeolocationDenied'
  | 'StorageUnavailable'
  | 'RateLimited'
  | 'ValidationError'
  | 'MethodNotAllowed'
  | 'PayloadTooLarge'
  | 'UnsupportedMediaType'
  | 'Forbidden'
  | 'NotFound'
  | 'InternalError';

/**
 * ApiErrorBody.
 */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
}

/**
 * ApiResponse.
 */
export interface ApiResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T;
}

/**
 * Creates a sanitized error response conforming to the project error taxonomy.
 * Never logs or reveals upstream URLs, credentials, or internal stacks.
 */
export function createErrorResponse(
  status: number,
  code: ApiErrorCode | string,
  message: string,
  extraHeaders?: Record<string, string>,
): ApiResponse<ApiErrorBody> {
  return {
    status,
    headers: getSecurityHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    }),
    body: {
      error: {
        code,
        message,
      },
    },
  };
}
