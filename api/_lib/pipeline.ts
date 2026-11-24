import { createErrorResponse, type ApiResponse, type ApiErrorBody } from './errors';
import { validateCorsOrigin, type CorsValidationResult } from './cors';
import { checkRateLimit, getClientIp } from './rateLimit';
import { validatePayloadSize } from './validate';
import { type Clock, systemClock } from '../../src/lib/clock';

export interface GuardConfig {
  endpointName: string;
  allowedMethods: string[];
  allowHeader?: string;
  rateLimitBucket?: 'general' | 'plan';
  maxBodyBytes?: number;
  requireJsonContentType?: boolean;
}

export interface GuardContext {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  bodyBytes?: number;
  clock?: Clock;
}

function checkMethod(method: string, config: GuardConfig): ApiResponse<ApiErrorBody> | null {
  if (!config.allowedMethods.includes(method)) {
    const primaryMethod = config.allowedMethods[0];
    const allowHeader = config.allowHeader ?? config.allowedMethods.join(', ');
    return createErrorResponse(
      405,
      'MethodNotAllowed',
      `Only ${primaryMethod} method is supported on ${config.endpointName}`,
      { Allow: allowHeader },
    );
  }
  return null;
}

function checkContentType(
  headers: Record<string, string | string[] | undefined>,
  requireJson?: boolean,
): ApiResponse<ApiErrorBody> | null {
  if (!requireJson) return null;
  const contentType = typeof headers['content-type'] === 'string' ? headers['content-type'] : '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return createErrorResponse(
      415,
      'UnsupportedMediaType',
      'Content-Type must be application/json',
    );
  }
  return null;
}

function checkPayloadSize(
  headers: Record<string, string | string[] | undefined>,
  bodyBytes?: number,
  maxBytes?: number,
): ApiResponse<ApiErrorBody> | null {
  if (maxBytes === undefined) return null;
  const contentLength =
    typeof headers['content-length'] === 'string' ? headers['content-length'] : undefined;
  const sizeValidation = validatePayloadSize(contentLength, bodyBytes ?? 0, maxBytes);
  return sizeValidation.valid ? null : sizeValidation.response;
}

function checkRateLimits(
  headers: Record<string, string | string[] | undefined>,
  bucket?: 'general' | 'plan',
  clock: Clock = systemClock,
): ApiResponse<ApiErrorBody> | null {
  if (!bucket) return null;
  const ip = getClientIp(headers);
  const rateLimit = checkRateLimit(ip, bucket, clock);
  if (!rateLimit.allowed) {
    return createErrorResponse(429, 'RateLimited', 'Too many requests. Please try again later.', {
      'Retry-After': String(rateLimit.retryAfterSeconds || 30),
    });
  }
  return null;
}

/**
 * Higher-order API guard pipeline:
 * Enforces method check, CORS, content-type, payload byte size, and rate limits
 * consistently in one single location across all serverless endpoints.
 */
export async function withApiGuards<T>(
  config: GuardConfig,
  ctx: GuardContext,
  coreHandler: (cors: CorsValidationResult) => Promise<ApiResponse<T | ApiErrorBody>>,
): Promise<ApiResponse<T | ApiErrorBody>> {
  const method = (ctx.method || 'GET').toUpperCase();
  const headers = ctx.headers || {};

  const methodErr = checkMethod(method, config);
  if (methodErr) return methodErr;

  const origin = typeof headers['origin'] === 'string' ? headers['origin'] : undefined;
  const host = typeof headers['host'] === 'string' ? headers['host'] : undefined;
  const cors = validateCorsOrigin(origin, host);
  if (!cors.allowed) {
    return createErrorResponse(403, 'Forbidden', 'Cross-origin request not permitted');
  }

  const contentErr = checkContentType(headers, config.requireJsonContentType);
  if (contentErr) return contentErr;

  const sizeErr = checkPayloadSize(headers, ctx.bodyBytes, config.maxBodyBytes);
  if (sizeErr) return sizeErr;

  const rateErr = checkRateLimits(headers, config.rateLimitBucket, ctx.clock);
  if (rateErr) return rateErr;

  return coreHandler(cors);
}
