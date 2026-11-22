import { z } from 'zod';
import { ApiResponse, createErrorResponse, ApiErrorBody } from './errors';

// Latitude (-90..90) and Longitude (-180..180) schemas with server-side 2dp rounding
export const LatSchema = z.coerce
  .number()
  .min(-90, 'Latitude must be >= -90')
  .max(90, 'Latitude must be <= 90')
  .transform((val) => Math.round(val * 100) / 100);

export const LonSchema = z.coerce
  .number()
  .min(-180, 'Longitude must be >= -180')
  .max(180, 'Longitude must be <= 180')
  .transform((val) => Math.round(val * 100) / 100);

export const AirQuerySchema = z
  .object({
    lat: LatSchema,
    lon: LonSchema,
  })
  .strict();

export const GEOCODE_QUERY_REGEX = /^[a-zA-Z0-9\s',.-]+$/;

export const GeocodeQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(2, 'Query must be at least 2 characters')
      .max(60, 'Query must not exceed 60 characters')
      .regex(
        GEOCODE_QUERY_REGEX,
        "Query contains disallowed characters. Only letters, numbers, spaces, apostrophes, commas, periods, and hyphens are permitted.",
      ),
    count: z.coerce.number().int().min(1).max(10).default(5),
  })
  .strict();

export type AirQuery = z.infer<typeof AirQuerySchema>;
export type GeocodeQuery = z.infer<typeof GeocodeQuerySchema>;

/**
 * Validates and parses query parameters against a strict Zod schema.
 */
export function parseQuery<T>(
  query: Record<string, string | string[] | undefined>,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; response: ApiResponse<ApiErrorBody> } {
  // Normalize array query values to single strings if applicable
  const flatQuery: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(query)) {
    if (val !== undefined) {
      flatQuery[key] = Array.isArray(val) ? val[0] : val;
    }
  }

  const result = schema.safeParse(flatQuery);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      success: false,
      response: createErrorResponse(
        400,
        'ValidationError',
        `Invalid query parameter: ${issue?.path.join('.') || 'param'} - ${issue?.message || 'Invalid format'}`,
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates request payload size against a strict byte cap.
 */
export function validatePayloadSize(
  contentLengthHeader: string | undefined,
  bodyBytes: number,
  maxBytes: number,
): { valid: true } | { valid: false; response: ApiResponse<ApiErrorBody> } {
  if (contentLengthHeader) {
    const declaredLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(declaredLength) && declaredLength > maxBytes) {
      return {
        valid: false,
        response: createErrorResponse(
          413,
          'PayloadTooLarge',
          `Payload exceeds maximum size limit of ${maxBytes} bytes`,
        ),
      };
    }
  }

  if (bodyBytes > maxBytes) {
    return {
      valid: false,
      response: createErrorResponse(
        413,
        'PayloadTooLarge',
        `Payload exceeds maximum size limit of ${maxBytes} bytes`,
      ),
    };
  }

  return { valid: true };
}
