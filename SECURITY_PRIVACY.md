# AirWise — Security and Privacy Plan

Purpose: practical controls, with the exact settings to implement and a checklist per phase. It extends README §20 and ARCHITECTURE §8. Decisions: ADR-008, ADR-009, ADR-016, ADR-018.

## 1. Data classification

| Data | Class | Where it lives | Leaves the device? |
|---|---|---|---|
| Household profile (age groups, health flags, equipment, routine) | **Sensitive** (health-adjacent) | LocalStorage | Never, except coarse descriptors to the LLM (§6) |
| Location (rounded to 2 dp) | Personal | LocalStorage | Rounded coordinates to `/api/air` only |
| Air snapshot cache | Low | LocalStorage, service worker | No |
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
- **API requests:** method allow-list, `Content-Type: application/json`, body cap (8 KB for `/api/plan`, 1 KB for `/api/air` and `/api/geocode`) enforced on `Content-Length` and on the actual bytes read; unknown keys rejected (`.strict()`); numbers range-checked (lat −90..90, lon −180..180, rounded server-side to 2 dp); strings limited by enum, regex or max length.
- **Geocode query:** trimmed, 2–60 characters, letters, digits, spaces, apostrophes, hyphens and commas only.
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
- `ALLOWED_ORIGIN` is empty by default. If set, only that exact origin is echoed back (never `*`), with `Vary: Origin`, methods `GET, POST, OPTIONS`, headers `Content-Type`.
- Reject requests whose `Origin` header is present and not allowed (403).

## 8. Rate limiting

- Per-IP token bucket in memory: `RATE_LIMIT_PER_MIN` (default 20) with a burst of 5, applied to `/api/plan` and `/api/air`, and a stricter limit on `/api/plan` (default 6 per minute).
- IP from the platform's trusted forwarded header only; if missing, a shared "unknown" bucket.
- Response `429` with `Retry-After` and a generic body. The client maps it to `RateLimited` and keeps the deterministic plan.
- **Documented limitation:** serverless instances do not share memory, so the limit is best-effort. A daily cap on LLM calls via an environment-set counter is a stretch item.

## 9. Security headers and CSP (in `vercel.json`)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000   (HTTPS hosts)
```

Notes:
- `connect-src 'self'` requires all provider calls to go through `/api/*`. The current client calls Open-Meteo directly and must be moved (repair phase R1).
- React applies `style={{…}}` through the CSSOM, which `style-src 'self'` does not block. **Verify** with a Playwright CSP-violation listener; if any violation fires, replace the offending inline style with a class. Prefer classes anyway so colours come from design tokens.
- The dev server may use a relaxed CSP; the preview and production builds must use the strict one.
- No inline scripts, no `eval`, no third-party scripts or fonts.

## 10. Dependency and supply-chain controls

- Few dependencies (React, Zod, Vite tooling, Vitest, Playwright, `vite-plugin-pwa`). Any new runtime dependency needs a one-line justification in `DECISIONS.md`.
- `package-lock.json` committed; CI uses `npm ci`.
- `npm audit --audit-level=high` in CI; fix or document waivers with an expiry.
- Pin third-party GitHub Actions to a major version at minimum (a commit SHA is better).
- No postinstall scripts from new packages without review.
- No Dependabot or other bots that open branches or PRs (single-branch rule, A-19).

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
- **Delete all:** removes every `airwise_*` LocalStorage key, clears in-memory plan and air caches, unregisters nothing but deletes the service-worker caches, and resets state. Confirmation required; a test asserts no `airwise_*` key remains.
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

## 17. Known gaps to close (from the 2026-11-21 repo review)

| ID | Gap | Close in |
|---|---|---|
| S-01 | No `vercel.json` (no CSP or headers) | R1 |
| S-02 | `/api/plan` has no request validation, body cap or rate limit | R1 |
| S-03 | Client-supplied titles and allow-lists enter the prompt | R1 |
| S-04 | Browser calls Open-Meteo directly; conflicts with `connect-src 'self'`; no `/api/air` | R1 |
| S-05 | `roleLabel` carries exact ages to the LLM | R1 |
| S-06 | API key in the URL query string | R1 |
| S-07 | `check:branches` fails open and reads only local branches | R3 |
| S-08 | `scan-secrets` ignore list uses substring matches | R3 |
| S-09 | Validator accepts full-width digits (number-check bypass) | R1 |
| S-10 | No `npm audit` waiver policy, no bundle grep for secrets | Phase 8 |

## 18. Security checklist per phase

| Phase | Must be true before the commit |
|---|---|
| 0 | `.gitignore` covers `.env*`; `scan:secrets` flags a planted fake key; `vercel.json` headers present; lockfile committed |
| 1A/1B | Domain has no I/O; no `Date.now()` or `Math.random()` without injection; templates contain no medical claims |
| 2 | Zod on every provider response; API validation, caps, rate limit, CORS tests; handlers never log bodies; `/api/air` and `/api/geocode` exist; client no longer calls providers directly |
| 3 | Storage schema-validated; privacy note shown; export and delete tested; geolocation rounded, one-shot |
| 4A/4B | No `dangerouslySetInnerHTML`; service worker never caches `/api/plan`; error boundaries per tab |
| 5 | Prompt built server-side; titles from catalog; no coordinates or exact ages in the payload; abuse fixtures pass; key never in the bundle |
| 6 | New copy passes content lint; P-22 text present |
| 7 | Community briefing contains no profile data; demo data labelled |
| 8 | Full checklist run; `npm audit` clean or waived; CSP-violation listener green; secret scan on the built bundle |
| 9 | Final scan; `.env.example` verified blank; repo history scanned once more |
