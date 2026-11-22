import { getSecurityHeaders } from './headers';

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

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: unknown;
  };
}

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
