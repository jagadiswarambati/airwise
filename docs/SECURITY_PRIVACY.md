# AirWise — Security and Privacy Plan

Purpose: practical controls, with the exact settings to implement and a checklist per phase. It extends README §20 and ARCHITECTURE §8. Decisions: ADR-008, ADR-009, ADR-016, ADR-018.

## 1. Data classification

| Data | Class | Where it lives | Leaves the device? |
|---|---|---|---|
| Household profile (age groups, health flags, equipment, routine) | **Sensitive** (health-adjacent) | LocalStorage | Never, except coarse descriptors to the LLM (§6) |
| Location (rounded to 2 dp) | Personal | LocalStorage | Rounded coordinates to `/api/air` only |
| Air snapshot cache | Low | LocalStorage | No |
| Plan cache | Derived | Memory (and optionally LocalStorage) | No |
| LLM request | Derived, minimal | In transit to our API and Gemini | Yes (enums and engine facts) |
| Server logs | Operational | Hosting platform | Must contain no bodies, no coordinates |

## 2. Threat model

| # | Threat | Asset | Control |
|---|---|---|---|
| T1 | Prompt injection via user input | Plan integrity | No free text reaches the model; enums only (ADR-003) |
| T2 | Prompt injection via crafted API requests | Model behaviour, quota | Server-side Zod, catalog lookups for titles, size caps (§4, §6) |
| T3 | Hallucinated or unsafe model output | User safety | Candidate-set constraint, validator, deterministic fallback (ADR-004, 005, 006) |
| T4 | API-key theft | Gemini quota | Server-only secret, no `VITE_` prefix, secret scan, key sent in a header (§5) |
| T5 | Abuse of `/api/*` as a free proxy | Cost, availability | Rate limit, body cap, origin check, same-origin only |
| T6 | XSS from model or provider text | Users | Render as text, no `dangerouslySetInnerHTML`, CSP |
| T7 | Supply-chain compromise | Build and runtime | Lockfile, `npm audit`, minimal deps, pinned CI actions |
| T8 | Profile disclosure from the device | User privacy | Local only, export and delete, no analytics |
| T9 | Location disclosure | User privacy | Rounding, no reverse geocoding, no coordinates to the model |
| T10 | Stale or manipulated provider data | Safety | Zod parse, freshness rules, confidence caps, sample labelling |
| T11 | Information leakage in errors | Internals | Error mapper with generic messages |
| T12 | Medical-advice liability | User safety | Medical boundary (§12), fixed texts, disclaimers |

## 3. Input validation

- **Everywhere:** Zod schemas at every boundary (API request, provider response, LocalStorage read, imported JSON if added). Parse, never cast.
- **API requests:** method allow-list, `Content-Type: application/json`, body cap (8 KB for `/api/plan`, 1 KB for `/api/air` and `/api/geocode`) enforced on `Content-Length` and on the actual bytes read (the `/api/plan` body stream is read with an early-cancel byte limit before JSON parsing); unknown keys rejected (`.strict()`); numbers range-checked (lat −90..90, lon −180..180, rounded server-side to 2 dp; finite numbers only); strings limited by enum, regex or max length.
- **Geocode query:** trimmed, 2–60 characters, Unicode letters, marks, digits, spaces, apostrophes, commas, periods, and hyphens only (`^[\p{L}\p{M}\p{Nd}\s',.-]+$`), with control characters and angle brackets strictly rejected.
- **LocalStorage:** parse with the profile schema; on failure, safe reset with a one-line notice (never crash).

## 4. Output validation

- **Provider output:** Zod-parsed; nulls and missing hours handled as data-quality events, never thrown to the UI.
- **Model output:** schema (strict), then the seven validator checks (README §17, A-12), on the server and again on the client. The client is the authority because only it holds the true policy result.
- **Rendering:** all model text is rendered as plain text. Markdown, HTML and links are not interpreted. Unicode digits are normalised (NFKC) before number checks.

## 5. API-key protection and secrets

- `GEMINI_API_KEY` exists only in the host's environment settings. No variable with a secret is prefixed `VITE_`.
- `.env*` is git-ignored; `.env.example` has blank values and the default `LLM_PROVIDER=none`.
- Send the key in a request header (`x-goog-api-key`), not in the URL query, so it cannot appear in error strings or logs. **Verify** against current Gemini API docs.
- Error messages from the Gemini call are mapped to a generic code; the raw message and URL are never returned or logged.
- CI runs `scan:secrets`; the built bundle is grepped for key patterns and the string `GEMINI` (test in `TEST_PLAN.md` §11).
- If a key is ever committed, revoke it first, then rewrite nothing (single-branch repo: rotate and move on, note it in the history).

## 6. LLM request minimisation and prompt-injection defences

**Sent to `/api/plan`:** `effectiveLevel`, `trend`, per-slot levels, the Risk Radar result as **enums** (age-band role label such as "Child 5–12", slot ID), approved candidate IDs, must-include IDs, budget tier, abstract descriptors (age bands, a sensitivity category, equipment booleans, heating type), confidence ceiling.

**Never sent:** coordinates, location label or city, names, exact ages, free text, the raw profile, device identifiers.

**Defences:**
1. Server builds the prompt from validated fields only; the client never sends prompt text.
2. Candidate titles and descriptions are looked up **server-side from the catalog by ID**, never accepted from the request (closes the injection path found in the 2026-11-21 review).
3. The server derives its number allow-list from validated fields; it does not accept an allow-list from the client.
4. **Trust model, stated honestly:** the server cannot verify that the client's approved or forbidden sets are the true policy result, because the profile never leaves the device. Server checks therefore guarantee *abuse resistance* (bounded input, no injection, bounded cost). The *safety guarantee* is enforced on the client against the locally computed policy result.
5. The system prompt tells the model to ignore any instruction found inside data fields; all data fields are structured JSON values, not prose.
6. Output is constrained by JSON mode and the strict schema; unknown keys or IDs are rejected.
7. Temperature is low (0.2); `maxOutputTokens` is capped; one retry only.
8. A user-facing toggle turns the overlay off; the app is fully usable with `LLM_PROVIDER=none`.

## 7. CORS and origin policy

- No CORS headers by default: the browser calls the API same-origin.
- Cross-origin use requires configuring `ALLOWED_ORIGIN`. `ALLOWED_ORIGIN` is empty by default. If set, only that exact origin is echoed back (never `*`), with `Vary: Origin`, methods `GET, POST, OPTIONS`, headers `Content-Type`.
- CORS preflight: `OPTIONS` requests from an allowed Origin receive HTTP 204 with CORS headers and `Access-Control-Max-Age: 600`. `OPTIONS` requests without an Origin header return 405 Method Not Allowed.
- Reject requests whose `Origin` header is present and not allowed (403).

## 8. Rate limiting & Client IP extraction

- **In-Memory Token Bucket:** Token bucket per client IP: `RATE_LIMIT_PER_MIN` (default 20, burst 5) on `/api/air` and `/api/geocode`, and 6 req/min (burst 2) on `/api/plan`.
- **Honest Limitations (Soft Limit):** Serverless function worker instances do not share memory across instances; this in-memory limiter operates per-instance as a soft application-layer backstop.
- **Platform Firewall Recommendation:** Production deployments must add platform-level firewall rate limiting at the edge/CDN layer.
  **Recommended Edge Firewall Rule Text (e.g. Vercel WAF / Cloudflare):**
  ```
  Rule: API Rate Limiting
  Condition 1: Path starts with "/api/" AND NOT Path equals "/api/plan"
  Action: Rate Limit to 60 requests per 1 minute per IP (mitigation: HTTP 429)

  Rule: Plan Endpoint Rate Limiting
  Condition 2: Path equals "/api/plan"
  Action: Rate Limit to 10 requests per 1 minute per IP (mitigation: HTTP 429)
  ```
- **Client IP & Anti-Spoofing:**
  Per [Vercel Request Headers Documentation](https://vercel.com/docs/headers/request-headers#x-real-ip), the Vercel Edge Network injects `x-real-ip` containing the verified remote client IP. When parsing multi-hop `x-forwarded-for` chains, downstream proxies append IPs to the right; attackers can prefix spoofed IPs on the left. AirWise extracts `x-real-ip` first, or the last proxy-appended element from `x-forwarded-for` / `x-vercel-forwarded-for`, preventing client spoofing.
- **Bounded Memory & Eviction:**
  The bucket map is capped at `MAX_BUCKETS = 10,000` entries. On capacity, idle entries older than `IDLE_TTL_MS = 10 minutes` are evicted. If still full, the oldest entry is evicted, preventing unbounded memory growth.
- **Response:** HTTP `429` with `Retry-After` and sanitized generic JSON body. Client maps it to `RateLimited` error code and preserves the deterministic plan.

## 9. Security headers and CSP (in `vercel.json` and `api/_lib/headers.ts`)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=(), bluetooth=(), serial=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Notes:
- `connect-src 'self'` ensures all weather and geocoding requests route through our `/api/*` proxy.
- `Cache-Control: no-store` is attached to every API error response, to `/api/health`, and to `/api/plan` (AI generation responses are sensitive and personal).
- Successful responses on `/api/air` (`public, max-age=600, stale-while-revalidate=300`) and `/api/geocode` (`public, max-age=86400, stale-while-revalidate=86400`) maintain documented public cache TTLs.
- `vercel.json` and `api/_lib/headers.ts` maintain identical defense-in-depth header sets.
- React styles are applied via the CSSOM without inline `<style>` tags; CSP disallows `eval`, third-party scripts, and remote fonts.

## 10. Dependency and supply-chain controls

- Few dependencies (React, Zod, Vite tooling, Vitest). Any new runtime dependency needs a one-line justification in `DECISIONS.md`.
- `package-lock.json` committed; CI uses `npm ci`.
- `npm audit --audit-level=high` enforced in CI on every push and pull request. Workflow execution results are visible in the repository's Actions tab.
- Pinned third-party GitHub Actions to release commits/hashes.
- Strict workflow permissions: `permissions: contents: read` declared in `.github/workflows/ci.yml`.
- Static analysis via GitHub CodeQL (`.github/workflows/codeql.yml`) on push, pull request, and weekly schedule; results are visible in the repository's Actions and Security tabs.
- Vulnerability disclosure policy published in `SECURITY.md` and RFC 9116 `public/.well-known/security.txt`.

## 11. LocalStorage privacy controls

- Keys use the `airwise_` prefix and are documented in one place (`state/keys.ts`).
- Stored: profile (schema-versioned), settings (AI on/off, severe mode, scenario), air cache (rounded coordinates only). No names, no free text, no precise coordinates.
- A one-line privacy note appears in onboarding: what is stored, where, and what leaves the device.
- Storage unavailable: in-memory session profile with a visible notice (`StorageUnavailable`).
- Treat the profile as sensitive on shared devices: the Menu offers "Delete all data" and the notice says it stays in this browser.

## 12. Location minimisation

- Device location: one-shot `getCurrentPosition` (never `watchPosition`), rounded to 2 dp immediately, raw value discarded, label "Current location (approx.)".
- Manual city search always available; denial is a normal path (`GeolocationDenied`), not an error screen.
- No reverse geocoding, no IP geolocation.
- Only the rounded pair goes to `/api/air`. Because the browser talks only to our API, the weather provider sees our server's address, not the user's.

## 13. Data export and deletion

- **Export:** JSON file containing `schemaVersion`, profile and settings only. No caches, no coordinates beyond 2 dp.
- **Delete all:** removes every `airwise_*` LocalStorage key, clears in-memory plan and air caches, deletes Cache Storage entries if any exist, and resets state. Confirmation required; a test asserts no `airwise_*` key remains.
- No server-side copy exists, so there is nothing else to delete. State this in the app.

## 14. Error handling without information leakage

- A central error mapper turns internal errors into the taxonomy (`DataUnavailable`, `DataStale`, `ProviderSchemaError`, `LlmUnavailable`, `LlmInvalid`, `GeolocationDenied`, `StorageUnavailable`, `RateLimited`, `ValidationError`) with fixed user-safe messages.
- API responses never contain stack traces, upstream URLs, keys, or provider error bodies.
- Logs: status code, error code, duration. Never request bodies, coordinates, IPs joined with locations, or prompts.
- Every tab has an error boundary with a recovery action; no blank screens.

## 15. Responsible AI boundaries

The AI may: select the top three from approved candidates, order within slots, write short plain-language explanations, and propose a confidence at or below the ceiling.
The AI may not: add actions, remove or demote must-include actions, introduce numbers outside the allow-list, make health claims, give medical advice, or reference identities.
- The UI labels the plan source ("AI-personalised" or "Standard plan") in the Trust Panel and Today.
- Fixed texts (PE-04, respirator caveat, combustion caveat) are never model-written.
- Validation failures degrade silently to the deterministic plan.
- **Verify before enabling in a public demo:** Gemini data-use terms for the tier used, and the current model name (A-30). Default `LLM_PROVIDER=none` in the repo.

## 16. Medical-advice boundary

- AirWise is informational, not medical advice. A footer says so.
- No diagnosis, medication, dosing, treatment or personal risk scoring (P-14).
- PE-04 uses the fixed text: "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe." Do not add a phone number unless a sourced, region-correct emergency number is added to the content pack; otherwise say "use your local emergency number".
- Respirator text (P-13, A-08): fit matters, rating such as N95 or FFP2, "Some respirators make breathing harder. Ask your clinician if unsure.", no masks for under-5s.
- Combustion text (P-22): fixed carbon-monoxide safety line on IN-01 for affected households.

## 17. Gap resolution register (from the 2026-11-21 repo review)

| ID | Gap | Status | Resolution & Evidence |
|---|---|:---:|---|
| S-01 | No `vercel.json` (no CSP or headers) | Closed | `vercel.json` and `api/_lib/headers.ts` verified by `tests/unit/api-headers.test.ts` |
| S-02 | `/api/plan` has no request validation, body cap or rate limit | Closed | `withApiGuards` and `AIPlanInputSchema` in `api/plan.ts` verified by `tests/unit/api-plan.test.ts` |
| S-03 | Client-supplied titles and allow-lists enter the prompt | Closed | Server-side lookup from `ACTION_CATALOG` in `api/plan.ts` verified by `tests/unit/api-plan.test.ts` |
| S-04 | Browser calls Open-Meteo directly; conflicts with `connect-src 'self'`; no `/api/air` | Closed | Serverless `/api/air` proxy implemented and verified by `tests/unit/api-handlers.test.ts` |
| S-05 | `roleLabel` carries exact ages to the LLM | Closed | Abstract age bands and role labels verified by `tests/unit/privacy-payload.test.ts` |
| S-06 | API key in the URL query string | Closed | Key passed in `x-goog-api-key` header verified in `tests/unit/api-security-boundary.test.ts` |
| S-07 | `check:branches` fails open and reads only local branches | Closed | Remote branch guard fail-closed logic verified in `tests/unit/guards.test.ts` |
| S-08 | `scan-secrets` ignore list uses substring matches | Closed | Anchored segment matching verified in `tests/unit/guards.test.ts` |
| S-09 | Validator accepts full-width digits (number-check bypass) | Closed | NFKC digit normalization in `src/ai/validator.ts` verified in `tests/unit/ai-validator.test.ts` |
| S-10 | No `npm audit` in CI, no bundle scan for secrets | Closed | `npm audit --audit-level=high` in CI; secret scan guard verified in `tests/unit/guards.test.ts` |

## 18. Security checklist per phase

| Phase | Requirement | Reproducible Verification Command & Result |
|---|---|---|
| 0 | `.gitignore` covers `.env*`; `scan:secrets` flags a planted fake key; `vercel.json` headers present; lockfile committed | `npm run scan:secrets` passes; `npx vitest run tests/unit/api-headers.test.ts` passes. |
| 1A/1B | Domain has no I/O; no `Date.now()` or `Math.random()` without injection; templates contain no medical claims | `npx vitest run tests/unit/domain-purity.test.ts` passes (zero unauthorized non-deterministic calls); content lint passes. |
| 2 | Zod on every provider response; API validation, caps, rate limit, CORS tests; handlers never log bodies; `/api/air` and `/api/geocode` exist; client no longer calls providers directly | `npx vitest run tests/unit/api-handlers.test.ts` passes (23 tests); `withApiGuards` enforces 1 KB/8 KB caps and CORS. |
| 3 | Storage schema-validated; privacy note shown; export and delete tested; geolocation rounded, one-shot | `npx vitest run tests/unit/profile-store.test.ts` passes (`HouseholdProfileSchema.safeParse`, delete/export). Coordinates rounded to 2 dp. |
| 4A/4B | No `dangerouslySetInnerHTML`; error boundaries per tab | Codebase grep confirms 0 `dangerouslySetInnerHTML` occurrences; React `ErrorBoundary` wraps screens. |
| 5 | Prompt built server-side; titles from catalog; no coordinates or exact ages in the payload; abuse fixtures pass; key never in the bundle | `npx vitest run tests/validator/validator-abuse.test.ts` passes (16 tests); Gemini key read only in `api/plan.ts`. |
| 6 | New copy passes content lint; P-22 text present | `npx vitest run tests/content/content-lint.test.ts` passes; combustion warning present on indoor stove mitigation action IN-01. |
| 7 | Community briefing contains no profile data; demo data labelled | Anonymous aggregate numbers only; society mock records tagged with demo badge in UI. |
| 8 | Full checklist run; `npm audit` clean or waived; secret scan on the built bundle | `npm audit --audit-level=high` reports 0 vulnerabilities; `npx vitest run tests/unit/api-headers.test.ts` passes; built dist grepped clean of secrets. |
| 9 | Final scan; `.env.example` verified blank; single-branch verification | `.env.example` contains only template variable names without secrets; `npm run check:branches` verifies single branch `main`. |

## 19. Security evidence table

Verified via automated test suites and repository checks.

| Control | Target File(s) | Verification Command / Suite | Result |
|---|---|---|---|
| HTTP Security Headers | `api/_lib/headers.ts`, `vercel.json` | `npx vitest run tests/unit/api-headers.test.ts` | 7 tests passed |
| Content Security Policy | `api/_lib/headers.ts`, `vercel.json` | `npx vitest run tests/unit/api-headers.test.ts` | CSP directives verified (connect-src 'self', media-src 'self') |
| CORS Restrictions | `api/_lib/pipeline.ts` | `npx vitest run tests/unit/api-handlers.test.ts` | Same-origin enforced |
| Input & Upstream Validation | `api/plan.ts`, `api/_lib/validate.ts`, `src/ai/validator.ts` | `npx vitest run tests/unit/api-plan.test.ts tests/validator/validator-abuse.test.ts` | 31 tests passed |
| Rate Limiting & Anti-Spoofing IP | `api/_lib/rateLimit.ts` | `npx vitest run tests/unit/api-rate-limit.test.ts` | 10 tests passed |
| Secret Scanning & Leak Prevention | `scripts/scan-secrets.mjs`, `api/_lib/errors.ts` | `npm run scan:secrets` | PASS (0 secrets detected) |
| Dependency Auditing | `package.json`, `.github/workflows/ci.yml` | `npm audit --audit-level=high` | 0 vulnerabilities (visible in GitHub Actions) |
| Static Analysis (CodeQL) | `.github/workflows/codeql.yml` | GitHub CodeQL Workflow | Configured on push/PR (visible in GitHub Actions) |
| Vulnerability Disclosure | `SECURITY.md`, `public/.well-known/security.txt` | RFC 9116 format specification | Verified |

