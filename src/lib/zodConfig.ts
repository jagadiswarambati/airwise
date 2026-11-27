import { z } from 'zod';

/**
 * Disables Zod v4's JIT compiler (`new Function(...)`) so strict CSP policies
 * (`script-src 'self'` without `unsafe-eval`) never emit `kEvalViolation`
 * securitypolicyviolation telemetry on initial schema evaluation.
 */
z.config({ jitless: true });
