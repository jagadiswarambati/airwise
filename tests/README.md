# AirWise — Test Suite & Traceability Matrix

This directory contains the automated test suites proving correctness, safety, security, and accessibility for AirWise.

## Traceability Matrix

Per `docs/TEST_PLAN.md` §13, this matrix maps all P-rules (P-01 to P-22), each `ImpactStatement` field, and all operational error types to their verifying test files.

### 1. Safety & Policy Rules (P-01 to P-22)

| Rule ID | Description | Unit / Subsystem Tests | Matrix / Invariant Tests | Integration / Golden Tests |
|---|---|---|---|---|
| P-01 | Severe Smog Mode override & mandatory actions | `tests/unit/plan-builder.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/golden/personas.test.ts` |
| P-02 | Ventilation guidance & clean air window opening | `tests/unit/ventilation.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/integration/pipeline.test.ts` |
| P-03 | Stale data suppresses outdoor activity & window opening | `tests/unit/freshness.test.ts` | `tests/policy/predicates.ts` | `tests/golden/personas.test.ts` |
| P-04 | Missing/No data suppresses outdoor activity & lowers confidence | `tests/unit/fallback-chain.test.ts` | `tests/policy/predicates.ts` | `tests/golden/personas.test.ts` |
| P-05 | Window opening allowed ONLY if effective level <= 1 & fresh | `tests/unit/ventilation.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/unit/ventilation-window.test.ts` |
| P-06 | Brief ventilation window at effective level 2 | `tests/unit/ventilation.test.ts` | `tests/policy/predicates.ts` | `tests/unit/ventilation-window.test.ts` |
| P-07 | Effective level >= 3 forbids window opening, requires closed | `tests/unit/indoor.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/render/render-smoke.test.tsx` |
| P-08 | Strenuous outdoor exercise / commute forbidden at level >= 3 | `tests/unit/mobility.test.ts` | `tests/policy/predicates.ts` | `tests/render/render-smoke.test.tsx` |
| P-09 | Sensitive household indoor play (PE-03) mandatory at level >= 3 | `tests/unit/plan-builder.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/golden/personas.test.ts` |
| P-10 | Budget gating: free budget has zero required purchases | `tests/unit/low-cost-mode.test.ts` | `tests/policy/mutation.test.ts` | `tests/golden/personas.test.ts` |
| P-11 | Equipment gating: purifier (IN-05), AC (IN-06), exhaust (IN-07) | `tests/unit/indoor.test.ts` | `tests/policy/mutation.test.ts` | `tests/golden/personas.test.ts` |
| P-12 | Cooking fuel & exhaust substitutes (IN-08 low smoke) | `tests/unit/indoor.test.ts` | `tests/policy/predicates.ts` | `tests/golden/personas.test.ts` |
| P-13 | Respirator PE-02 gating: never under-5, clinician caveat | `tests/unit/indoor.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/content/content-lint.test.ts` |
| P-14 | Medical emergency guidance (PE-04) verbatim disclaimer | `tests/unit/plan-builder.test.ts` | `tests/policy/predicates.ts` | `tests/content/content-lint.test.ts` |
| P-15 | Dual-axis impact: exposure vs emissions distinction | `tests/unit/impact.test.ts` | `tests/policy/predicates.ts` | `tests/content/content-lint.test.ts` |
| P-16 | Commute mode gating: vehicle recirc (MO-03), two-wheeler N95 (MO-06) | `tests/unit/mobility.test.ts` | `tests/policy/predicates.ts` | `tests/golden/personas.test.ts` |
| P-17 | Public transit availability gating (MO-02) & remote work (MO-05) | `tests/unit/mobility.test.ts` | `tests/policy/predicates.ts` | `tests/golden/personas.test.ts` |
| P-18 | Commute shift (MO-01) threshold: canShiftTime & >= 5 ug/m3 & >= 15% | `tests/unit/mobility.test.ts` | `tests/policy/predicates.ts` | `tests/unit/move-screen.test.tsx` |
| P-19 | Risk level bands (0-4) & sensitive member buffer (+1 cap 4) | `tests/unit/levels.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/unit/bands.test.ts` |
| P-20 | Severe smog mode auto-activation at level 4 or official alert | `tests/unit/plan-builder.test.ts` | `tests/policy/policy-matrix.test.ts` | `tests/render/render-smoke.test.tsx` |
| P-21 | Community mode actions (CM-01..04) gated by community toggle | `tests/unit/community-screen.test.tsx` | `tests/policy/mutation.test.ts` | `tests/integration/pipeline.test.ts` |
| P-22 | Combustion heating / unvented biomass forbids sealing gaps (IN-04) | `tests/unit/indoor.test.ts` | `tests/policy/mutation.test.ts` | `tests/golden/personas.test.ts` |

---

### 2. ImpactStatement Fields

| Impact Field | Specification & Invariant | Verified By Test Files |
|---|---|---|
| `exposure` | Quantified direction, evidence level, and note template | `tests/content/content-lint.test.ts`, `tests/unit/impact.test.ts`, `tests/policy/predicates.ts` |
| `emissions` | Quantified direction, evidence level, and note template | `tests/content/content-lint.test.ts`, `tests/unit/impact.test.ts`, `tests/policy/predicates.ts` |
| `assumptions` | Array of transparent assumptions for every catalog action | `tests/content/content-lint.test.ts`, `tests/policy/predicates.ts` |
| `doesNotChange` | Explicit boundary disclosure of what the action does not change | `tests/content/content-lint.test.ts`, `tests/policy/predicates.ts` |
| `explanation` | User-facing explanation of impact mechanism | `tests/unit/impact.test.ts`, `tests/policy/predicates.ts` |

---

### 3. Operational Error Types

| Error Type | Trigger Condition & Handling | Verified By Test Files |
|---|---|---|
| `DataUnavailable` | Network/API offline or null PM2.5 data; falls back to sample/cache with low confidence | `tests/unit/fallback-chain.test.ts`, `tests/golden/personas.test.ts`, `tests/integration/pipeline.test.ts` |
| `DataStale` | Observation older than 15 min; triggers stale warning banner and low confidence | `tests/unit/freshness.test.ts`, `tests/golden/personas.test.ts`, `tests/integration/pipeline.test.ts` |
| `ProviderSchemaError` | Malformed API payload; caught and parsed via Zod contracts without app crash | `tests/contract/providers.test.ts` |
| `LlmUnavailable` | LLM API down/failing; transparently falls back to deterministic domain plan | `tests/unit/usePersonalizedPlan.test.tsx`, `tests/unit/api-plan.test.ts` |
| `LlmInvalid` | LLM returns malformed JSON, invented numbers, or unauthorized actions; validator rejects | `tests/unit/ai-validator.test.ts`, `tests/validator/validator-abuse.test.ts` |
| `GeolocationDenied` | Browser location permission denied; falls back to manual city selection without crash | `tests/integration/pipeline.test.ts` |
| `StorageUnavailable` | LocalStorage disabled or quota exceeded; memory store fallback prevents failure | `tests/integration/pipeline.test.ts`, `tests/unit/profile-store.test.ts` |
| `RateLimited` | API requests exceeded rate limit; responds 429 with Retry-After header and no leakage | `tests/unit/api-handlers.test.ts` |
| `ValidationError` | Request payload fails schema validation; returns 400 with structured validation issues | `tests/unit/api-handlers.test.ts`, `tests/validator/validator-abuse.test.ts` |
