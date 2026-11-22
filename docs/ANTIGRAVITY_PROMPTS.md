# AirWise — Antigravity Prompts

Purpose: paste-ready prompts, one per phase, plus three repair prompts for the current repository. Phase scope, files, acceptance and commit messages come from `BUILD_PLAN.md`; rules from `README.md` as amended by `DECISIONS.md`.

## How to use

1. Save **§1 Shared Context Block** as `AGENTS.md` in the repo root (replace the existing file; its P-rule summary is folded in).
2. Paste one prompt at a time. Do not start the next until the current one is green, reviewed, committed and pushed to `main`.
3. Each prompt assumes the previous phase is complete and passing.
4. **Where the repo already contains a phase** (the 2026-11-21 repository is roughly at Phase 4B with partial 5 and 6), do not re-run it from scratch. Run the repair prompts **R1 → R2 → R3**, then **Prompt 7**, then 8 and 9. For earlier phases, paste the prompt but prepend: *"Audit only: verify each acceptance criterion against the existing code, fix gaps, add missing tests, and do not rewrite working code."*
5. Ask the agent for a short plan first. Review the diff and the acceptance list yourself.

---

## 1. Shared Context Block (save as `AGENTS.md`)

```text
# AirWise: Agent Rules (read before every task)

## Product goal
AirWise is a GenAI-assisted household clean-air decision assistant (Hack2skill PromptWars, Challenge 6). It turns air data plus household reality into one prioritised, explainable daily plan, with honest dual-axis impact (Exposure and Emissions) and visible trust information. It must be useful with no purifier, no account, no AI and no network.

## Source-of-truth order
DECISIONS.md amendments (A-xx) > README.md > ARCHITECTURE.md > docs/*. If documents conflict or something is missing, STOP and ask. Never guess.

## Non-negotiable safety principles
1. Deterministic core, AI overlay. Safety, ranking and numbers live in pure TypeScript in src/domain. The LLM may only choose from approved candidate IDs, order within slots, write short explanations, and propose a confidence at or below the engine ceiling.
2. DO NOT invent actions, numbers, health advice, thresholds, emission factors, policy exceptions or data. Every number comes from a documented formula (docs/IMPACT_METHODOLOGY.md) or an engine fact. If a value is unknown, say so in the UI.
3. No diagnosis, medication, dosing, treatment, or personal risk scores. Fixed texts (PE-04, respirator caveat, combustion caveat) are never model-written and never reworded.
   PE-04: "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe."
   PE-02 caveat: "Some respirators make breathing harder. Ask your clinician if unsure." No masks for under-5s.
4. Policy rules P-01 to P-22 (README section 15 plus A-04, A-08, A-11, A-25, P-22) are inviolable. Each has unit tests and matrix coverage. Never add an exception.
5. Exposure and Emissions are independent. Never imply one from the other. Labels: Measured (unused in MVP), Estimated (formula), Recommended (qualitative). Banned: "saves the planet", unsourced percentages, promised health outcomes.
6. Stale or missing data lowers confidence and suppresses uncertain advice (P-03, P-04). Modelled data is always labelled Modelled. Sample data is always labelled Sample or Demo data. Never present sample data as live.
7. No free text to the LLM. No coordinates, location labels, names, exact ages or raw profile to the LLM.

## Architecture and layering
- src/domain: pure TS. No React, no browser APIs, no fetch, no storage, no Date.now()/Math.random() without injection. Imports nothing from data, ai, ui, state.
- src/data and src/ai import domain. src/ui imports domain, data, ai types and state. api/ imports domain and src/data/providers and src/ai (schema, validator, prompts) only.
- Types are defined once in src/domain/types.ts. Zod at every boundary (API request/response, provider response, storage read).

## Coding standards
- TypeScript strict. No `any` without a comment. No non-null assertions without a reason.
- Small pure functions, clear names, comments explain why and cite rule IDs (P-xx).
- No new runtime dependency without a one-line justification added to DECISIONS.md.
- Colours come from design tokens (src/styles/tokens.css); no hard-coded hex in components.
- Model and provider text is rendered as plain text. Never dangerouslySetInnerHTML.
- Error handling uses the taxonomy: DataUnavailable, DataStale, ProviderSchemaError, LlmUnavailable, LlmInvalid, GeolocationDenied, StorageUnavailable, RateLimited, ValidationError. No blank screens.

## Testing standards
- Domain tests need no mocks. Policy matrix enumerates programmatically and uses INDEPENDENT oracles (not the policy's own output). Every rule has a unit test and a matrix invariant.
- Provider contract tests use recorded fixtures. The LLM is mocked with good, malformed, malicious and partial fixtures.
- A phase is not done with failing, skipped or weakened tests. Never delete or loosen a test to make it pass; fix the code or ask.

## Accessibility standards (WCAG 2.2 AA; see docs/ACCESSIBILITY.md)
- Semantic landmarks and heading order; keyboard operable; visible focus; focus trap and return in dialogs.
- Risk level always as text + icon + colour. Touch targets >= 44 px. Works at 200% text and 360 px width.
- Plain language, grade 6 to 8. Reduced motion and dark mode honoured. Status via one polite live region.

## Security standards (see docs/SECURITY_PRIVACY.md)
- Secrets server-side only; no secret with a VITE_ prefix; keys never in URLs, logs or bundles.
- Validate all inputs (Zod, size caps, enums). Same-origin API; connect-src 'self'. Rate limit /api/*. No request-body logging.
- Location rounded to 2 dp. Profile stays in LocalStorage. Export and delete must work.

## Commit and repository standards
- Single branch: main. NEVER create branches, forks, PRs, or tags (except `attempt-N` when explicitly told).
- Conventional commits (feat, fix, test, docs, chore), one commit per phase with the exact message given.
- Repo under 10 MB (target 3 MB). No binaries over 50 KB, no build output, no .env.
- Before every commit run: npm run lint, typecheck, test, test:policy, build, check:size, scan:secrets, check:branches.

## Working method
1. Write a short plan first (files to touch, tests to add). Then implement.
2. Do only the scope given. If you find an out-of-scope bug, list it in your report; do not fix it silently.
3. Before declaring completion, REPORT: files changed, command outputs with pass/fail counts, each acceptance criterion with evidence, manual verification results, deviations and open questions. Do not commit if any check fails.
```

---

## 2. Phase prompts

### Prompt 0: Foundations

```text
CONTEXT: New repo "airwise" (public, single branch main). Read AGENTS.md (create it first from the Shared Context Block), README.md, ARCHITECTURE.md, DECISIONS.md, docs/BUILD_PLAN.md. No product code exists yet.

SCOPE: Tooling, CI, guards, tokens, security headers, docs placement. NO domain, data, AI or UI features.

FILES: package.json, tsconfig.json, vite.config.ts, vitest.config.ts, eslint.config.js, .prettierrc, .gitignore, .env.example, LICENSE (MIT), AGENTS.md, index.html, src/main.tsx (minimal shell with skip link, landmarks, <html lang="en">), src/styles/tokens.css, src/styles/base.css, api/health.ts, vercel.json, scripts/check-size.mjs, scripts/check-branches.mjs, scripts/scan-secrets.mjs, .github/workflows/ci.yml, docs/*.

TASKS:
1. Vite + React 18 + strict TypeScript; Vitest; Prettier; ESLint with no-restricted-imports boundary rules that also catch NESTED relative imports (use patterns like '**/data/**', '**/ai/**', '**/ui/**', '**/state/**' for src/domain) and no-restricted-globals (window, document, localStorage, navigator, fetch) for src/domain.
2. Tokens: colour pairs for light, dark and a Severe theme with tested contrast, spacing, type scale (16 px base, Severe >= 20 px), 3 px focus ring, --target-min: 44px. Respect prefers-reduced-motion and prefers-color-scheme.
3. vercel.json with the CSP and headers from docs/SECURITY_PRIVACY.md section 9.
4. Guards: check-size (fail > 10 MB, warn > 3 MB; include .git size if present); check-branches using `git ls-remote --heads origin` when a remote exists, else local branches, and FAIL CLOSED on errors; scan-secrets using anchored path-segment ignores (not substring matches).
5. CI: install (npm ci), lint, typecheck, format:check, test, build, scan:secrets, check:size, check:branches, npm audit --audit-level=high. No Dependabot. No e2e yet.
6. Put the delivered docs in docs/ and apply amendment A-01 to README (companion links, repo tree, TOC numbering).

ACCESSIBILITY: lang attribute, skip link, landmarks, tokens with contrast unit test, focus ring token.
SECURITY: .env* ignored, .env.example blank with LLM_PROVIDER=none, headers present, no secrets, lockfile committed.
TESTING: one smoke test; tests proving the guards work (planted fake key fails scan-secrets then removed; fake extra branch name fails the branch check logic; size check thresholds).
DO NOT BUILD: any domain logic, providers, AI, onboarding, or screens; no Dependabot; no e2e; no analytics.

ACCEPTANCE: CI green on a clean clone; boundary lint FAILS on a deliberate bad import (then remove it); contrast test passes; scan-secrets catches a planted key; repo < 1 MB; `npm run dev` shows the shell.

REQUIRED CHECKS: lint, typecheck, format:check, test, build, check:size, scan:secrets, check:branches, audit.
REPORT before declaring completion (see AGENTS.md "Working method").
COMMIT (one commit on main): chore: scaffold repo, CI guards, tokens and AGENTS.md
```

### Prompt 1A: Domain foundations

```text
CONTEXT: Phase 0 is complete and green. Read AGENTS.md, README sections 13, 15, 18, Appendix A, DECISIONS.md (A-03, A-04, A-06, A-07, A-20, A-23, A-27), docs/IMPACT_METHODOLOGY.md (radar and formulas), docs/DATA_SOURCES.md section 7.

SCOPE: Pure domain primitives with tests. No UI, no I/O.

FILES: src/domain/types.ts (+Zod), config/bands.ts, config/thresholds.ts, config/radar-weights.ts, levels.ts, freshness.ts, trend.ts, radar.ts, ventilation.ts, catalog/ (all 25 Appendix A actions), templates.ts, index.ts; tests/unit/*.

TASKS:
1. types.ts: HouseholdProfile with homeHeating (none|electric|combustion), Mode enum (A-20), member roleLabel as AGE-BAND text only (e.g. "Child 5-12", never exact ages or names, A-03), AirSnapshot, RiskAssessment, Action, ImpactStatement (direction down|none|conditional; label; confidence; note; assumptions; doesNotChange), Plan.
2. bands.ts: India (CPCB-aligned) and US (EPA-aligned) PM2.5 bands mapped to levels 0-4, each with a source note and `verified: false` until Phase 2. Apply to the rolling mean per DATA_SOURCES.md section 7.
3. levels.ts: base level, effective level (P-02), level names ("Severe for your household" for level 4, A-09).
4. freshness.ts: tiers per A-06; trend.ts; radar.ts using R1 from IMPACT_METHODOLOGY (max of weights, no summing); ventilation.ts (P-05, P-06, P-07, A-23: windows "around HH:00"). Brief-window threshold comes from the bands config, not a hard-coded number.
5. Time handling: functions take an injected `now` and read the HOUR from the timestamp's own local value or an explicit utcOffsetSeconds; never use the runtime's local time zone.
6. catalog: every action has cost, effort, evidence, requires, gating, templateKey, and an ImpactSpec with BOTH axes, label, assumptions (>= 1) and doesNotChange (see IMPACT_METHODOLOGY section 6).
7. templates.ts: plain-language text keyed by templateKey with i18n keys; fixed texts verbatim (PE-04, respirator caveat, combustion caveat).

ACCESSIBILITY: every action has an accessible name and one-sentence summary string; templates pass the reading-level check (add the content-lint helper now).
SECURITY: domain has no I/O and no randomness; templates contain no medical claims.
TESTING: boundary tests at every band breakpoint (+/-0.1) for both regions; effective level per vulnerability class and the cap at 4; freshness edges; trend edge cases (missing hours, nulls); radar ties and weights; ventilation outcomes; time-zone tests using offsets (a series in UTC+5:30 evaluated under a different process time zone gives identical results); catalog completeness test.
DO NOT BUILD: policy engine, plan builder, impact formulas, providers, UI, AI.

ACCEPTANCE: all tests pass; domain imports nothing outside src/domain (lint proves it); every catalog entry complete; no use of Date.now(), new Date() without a parameter, or getHours() on runtime-local time.

REQUIRED CHECKS: lint, typecheck, test, build, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(domain): types, levels, freshness, radar, ventilation, catalog
```

### Prompt 1B: Policy, plan builder, impact, matrix

```text
CONTEXT: Phase 1A is complete and green. Read AGENTS.md, README sections 14, 15, 17, 18, DECISIONS.md (A-04, A-05, A-08, A-11, A-13, A-21, A-25, A-31), docs/IMPACT_METHODOLOGY.md, docs/TEST_PLAN.md sections 3, 6.

SCOPE: policy.ts (P-01 to P-22), plan-builder.ts, impact.ts, confidence.ts, quickchecks.ts, policy-matrix tests, golden personas.

TASKS:
1. policy.ts: approved candidates, forbidden set, mustInclude and urgent sets; implement every rule with its ID in a comment; P-13 per-member wording (never masks for under-5s; 5-12 only child-sized fit); P-22 combustion safety (IN-04 forbidden; fixed CO line on IN-01).
2. plan-builder.ts: six slots, ranking by urgency x feasibility x cost fit (shown as tags, not a score), free-first in Low-Cost Mode (A-13), top-3 precedence per A-11, mustInclude never dropped. The builder takes an injected clock.
3. impact.ts: E1, X1, C1 exactly as IMPACT_METHODOLOGY (E2 behind SHOW_CO2E = false). Suppress numbers when inputs are invalid.
4. confidence.ts: exposure = min(evidence, freshness, dataType); emissions = min(evidence, inputTier) (A-31); plan ceiling = min(freshness, dataType), stale/none => low.
5. quickchecks.ts: deterministic answers for the four chips.
6. Policy matrix in tests/policy: (a) `test:policy` = pairwise plus boundary plus all personas (< 30 s); (b) `test:matrix` = the FULL cartesian product over the nine dimensions in TEST_PLAN section 3 (use it.each or a generator with shards). Assertions use INDEPENDENT oracles: write each rule as its own tiny predicate in the test file (for example "level >= 3 implies IN-02 absent") rather than comparing against policy.forbiddenActionIds. Failures print the minimal failing input as JSON.
7. Golden personas (Priya x 4 scenarios, outdoor worker, elderly-only, free-budget student, no-data) as snapshots.
8. tests/README.md traceability table: P-01..P-22, error types, impact fields -> tests; add a script that fails CI if a rule has no mapped test.

ACCESSIBILITY: quick-check answers and plan strings are plain language and tested.
SECURITY: no I/O; deterministic (same input, identical plan).
TESTING: as above; every invariant in TEST_PLAN section 3 asserted; add negative tests that deliberately break a rule in a copy of the policy and prove the matrix catches it (mutation checks for at least five rules).
DO NOT BUILD: providers, UI, AI, new actions, new rules, or exceptions to rules.

ACCEPTANCE: zero invariant violations; `test:policy` < 30 s; `test:matrix` completes locally and the output is saved to docs/matrix-run.txt; mutation checks fail as expected; Priya and golden snapshots reviewed.

REQUIRED CHECKS: lint, typecheck, test, test:policy, test:matrix (local), build, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(domain): policy engine, plan builder, impact and matrix tests
```

### Prompt 2: Data layer

```text
CONTEXT: Phase 1B is complete and green. Read AGENTS.md, README sections 19, 24, DECISIONS.md (ADR-007, ADR-016, A-02, A-06, A-14, A-18, A-22, A-23, A-24, A-32), docs/DATA_SOURCES.md, docs/SECURITY_PRIVACY.md sections 3, 7, 8, 9, 14.

SCOPE: Providers, same-origin API handlers, fallback chain, caches, samples, trust model. No UI changes except none.

FILES: src/data/providers/openMeteoAir.ts, openMeteoWeather.ts, geocode.ts; src/data/fallback-chain.ts, cache.ts, trust.ts, samples/*.json (+cities.json <= 20 cities); api/air.ts, api/geocode.ts, api/health.ts, api/_lib/{rateLimit,validate,headers,errors}.ts; dev middleware in vite.config.ts; tests/contract/**.

TASKS:
1. FIRST complete the DATA_SOURCES.md verification checklist against the live official docs; record access dates; set `verified: true` in bands.ts only after checking the CPCB and EPA tables.
2. Providers are pure adapters (parse + Zod) shared by api/ and tests. Air: pm2_5 and one AQI standard (US or EU; never label an index "Indian AQI", A-24), timezone=auto, utc_offset_seconds kept. Weather: temperature, wind, humidity, sunrise, sunset.
3. API handlers use the Vercel function signature (default export) and a pure core function for testing. Validation with Zod, body caps (1 KB), method allow-list, rate limit (token bucket), CORS per SECURITY_PRIVACY section 7, generic errors, no logging of coordinates or bodies. Coordinates are rounded to 2 dp server-side. Server cache TTL 10 min.
4. The BROWSER calls only /api/air and /api/geocode (no direct provider calls, so connect-src 'self' holds). Dev middleware mounts the same handlers for `npm run dev` with no keys.
5. fallback-chain: live -> cached -> none. A cache read returns the last real reading even when past TTL, with freshness RECOMPUTED from fetchedAt (aging or stale). If live and cache both fail, return freshness `none` so P-04 applies (cautious level 2) and offer an explicit "Use demo data" action. Sample scenarios are used ONLY when the user explicitly selects a demo scenario (A-32). Never silently substitute sample data for live.
6. samples: clear, moderate, severe, stale (fixed >= 24 h old) as valid snapshots with dataType 'sample'; timestamps generated relative to now using explicit offsets; total <= 200 KB.
7. trust.ts: Trust model with source, data type, freshness, fallback status, notes, attribution string, resolution note.

ACCESSIBILITY: data-quality and offline notices have plain-language text and defined ARIA roles (status vs alert).
SECURITY: all items in SECURITY_PRIVACY section 18, Phase 2 row.
TESTING: contract tests on recorded real fixtures plus mutated copies (missing hours, nulls, extra or renamed fields, offset times, empty series, missing current hour, non-numeric values, partial weather failure, geocode no results and odd characters); fallback order tests including expired-cache-served-as-stale; cache TTL; rate limiter; handler tests for 400/413/415/429/403; time-zone test with a non-local offset.
DO NOT BUILD: UI, AI, OpenAQ, reverse geocoding, accounts, a database, analytics.

ACCEPTANCE: contract tests green; `curl localhost:5173/api/air?lat=17.38&lon=78.49` returns normalised JSON with no keys; with the network blocked the app falls back per item 5; headers present; no direct provider URLs remain in src/ui or src/data client code.

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, check:size, scan:secrets, check:branches.
MANUAL: call /api/air for Hyderabad and Delhi coordinates; disable network and confirm the fallback behaviour.
REPORT before declaring completion.
COMMIT: feat(data): providers, api handlers, fallback chain, samples, trust model
```

### Prompt 3: Onboarding and profile

```text
CONTEXT: Phase 2 is complete and green. Read AGENTS.md, README section 12 (Onboarding), docs/ACCESSIBILITY.md sections 4, 11, docs/SECURITY_PRIVACY.md sections 11, 12, 13.

SCOPE: Profile store, five-step onboarding, Priya preset, export and delete.

FILES: src/state/{profileStore,settingsStore,keys}.ts; src/ui/onboarding/*; src/ui/components/{Field,ErrorSummary,Stepper}.tsx; Menu additions; tests/unit and tests/e2e (add Playwright config now with an onboarding smoke test).

TASKS:
1. Store: schema-versioned, Zod-validated reads, migration or safe reset, in-memory fallback with notice (`StorageUnavailable`). Keys prefixed airwise_ and listed in keys.ts.
2. Steps: Where (city search via /api/geocode or the offline list; device location one-shot, rounded to 2 dp; manual entry), Who (age group and flags; no names; role labels are age bands only), Home (including homeHeating), Travel, Day. Plain-language privacy and AI notice with an AI on/off setting.
3. "Try Priya's household" preset sets the profile (budget low, no purifier, child with asthma flag, elder, LPG without exhaust) AND selects the severe scenario (A-28). Preset label is "demo household", no child's name anywhere.
4. Menu: edit profile, export JSON (profile and settings only), delete all (confirmation; removes every airwise_ key, caches and service-worker caches).

ACCESSIBILITY: labels, fieldset and legend groups, aria-describedby help, error summary receiving focus, progress as text, native time inputs, no redundant entry, keyboard-only completion in under 90 s.
SECURITY: Zod on storage reads; no coordinates beyond 2 dp; no names or free text stored; delete leaves no airwise_ key.
TESTING: store migration and corrupt-storage tests; form validation; export content test; delete test; Playwright onboarding; axe on every step (zero serious/critical).
DO NOT BUILD: accounts, cloud sync, import, Today screen changes, AI.

ACCEPTANCE: keyboard-only onboarding < 90 s; Priya preset in <= 3 taps; export/delete verified; axe clean.

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e (smoke), check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(ui): onboarding, local profile, export and delete
```

### Prompt 4A: Today and deterministic plan

```text
CONTEXT: Phase 3 is complete and green. Read AGENTS.md, README section 12 (Today), docs/ACCESSIBILITY.md sections 2, 3, 6, 10.

SCOPE: App shell, tabs, Today with deterministic plan. No AI.

FILES: src/App.tsx, src/ui/components/{Header,TabBar,AirBriefingCard,RiskBadge,RiskRadarCard,ActionCard,Sparkline,Timeline}.tsx, src/ui/screens/TodayScreen.tsx, src/state/scenarioStore.ts, .github/workflows/ci.yml (add e2e job), tests/e2e.

TASKS:
1. Tabs: Today, Indoor, Move, Impact, Community (non-Today tabs lazy-loaded, placeholders allowed until their phases), Menu.
2. Today: air briefing (PM2.5 in µg/m³ primary; secondary AQI named with its standard; trend; "next 6 h"; timestamp; data-type badge; freshness chip), risk headline "<Level> for your household" with text + icon + colour, Risk Radar from the REAL radar result, top 3 with Why, tags and confidence word, six-slot timeline, scenario switcher in Menu.
3. Sparkline: inline SVG with text alternative and an expandable hourly table; colours from tokens.
4. Compute the plan once per snapshot/profile change with memoisation; no plan logic in components.
5. Add the Playwright job to CI (vite preview, LLM_PROVIDER=none, sample provider).

ACCESSIBILITY: landmarks, one h1 per screen, tab semantics with aria-current, sparkline alt, focus moves to the new heading on tab change, axe clean on Today.
SECURITY: render all strings as text; no dangerouslySetInnerHTML.
TESTING: component tests for headline per level; Priya preset -> Today in <= 3 taps and <= 10 s (e2e timing); all four scenarios render the right level and plan; axe.
DO NOT BUILD: Severe Mode layout, Quick Checks, action detail sheet, Trust Panel, AI calls, Indoor or Move content, Impact, Community.

ACCEPTANCE: first usable plan on Today; no component recomputes policy; e2e and axe green.

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(today): briefing, risk radar, deterministic plan and timeline
```

### Prompt 4B: Severe Mode, Quick Checks, action detail, Trust Panel, offline

```text
CONTEXT: Phase 4A is complete and green. Read AGENTS.md, README section 12 (Severe Mode, Action detail, Trust Panel), docs/ACCESSIBILITY.md sections 4, 9, 12, docs/IMPACT_METHODOLOGY.md section 9a.

SCOPE: Severe Mode, Quick Checks, action detail sheet, Trust Panel, stale/no-data banners, PWA basics, error boundaries.

FILES: src/ui/components/{SevereView,QuickChecks,ActionDetailSheet,TrustPanel,Banner,ErrorBoundary,Dialog}.tsx; vite-plugin-pwa config; public/manifest icons (tiny); tests.

TASKS:
1. A reusable accessible Dialog (focus trap, Escape, return focus, aria-labelledby, inert background) used by the action sheet and Menu.
2. Severe Mode: automatic when effective level = 4 or an official alert, manual toggle always available; single column, >= 20 px, max contrast theme, <= 3 actions with mustInclude first, no charts, one primary button "Show full plan". Announce entry ONCE via the polite live region; do not wrap the screen in role=alert or aria-live=assertive.
3. Quick Checks: four chips with deterministic answers and reasons.
4. Action detail: What to do, Why now, Exposure and Emissions (label, confidence, note), What it does NOT change, Assumptions, Cost and effort. Renders only what the engine returns.
5. Trust Panel: source, data type, freshness, fallback status, uncertainty note, attribution, plan source (AI-personalised or Standard plan) and plan confidence with reason.
6. Stale or no-data banner (role=status unless blocking); suppressed actions explain why.
7. Service worker: caches shell and last air snapshot only; NEVER caches /api/plan; offline banner shows data age.
8. Error boundary per tab with a recovery action.

ACCESSIBILITY: all of section 4 and 9 in ACCESSIBILITY.md; axe clean in light, dark and Severe.
SECURITY: service worker excludes /api/plan; no inline scripts; CSP-violation listener in e2e shows zero violations.
TESTING: component tests for Dialog focus behaviour; e2e for severe, stale and offline scenarios; 100% of visible actions show all impact fields (test over rendered DOM); axe.
DO NOT BUILD: AI calls, Indoor or Move content, Impact, Community, Hindi/Telugu.

ACCEPTANCE: works offline with LLM_PROVIDER=none; stale scenario suppresses walking and ventilation and shows low confidence; Priya severe shows <= 3 actions; zero CSP violations.

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
MANUAL: run all scenarios at 360 px and 200% text; use a screen reader on Severe Mode.
REPORT before declaring completion.
COMMIT: feat(today): severe mode, quick checks, action detail, trust panel, offline
```

### Prompt 5: AI plan layer

```text
CONTEXT: Phase 4B is complete and green. Read AGENTS.md, README sections 16, 17, DECISIONS.md (ADR-002 to ADR-006, ADR-018, A-10, A-12, A-29, A-30), docs/SECURITY_PRIVACY.md sections 4, 5, 6, 15, docs/TEST_PLAN.md section 4.

SCOPE: Gemini overlay end to end: schema, prompt, API, client, validator, overlay, cache, UI swap-in.

FILES: src/ai/{schema,validator,overlay,plan-cache,client}.ts, src/ai/prompts/*, api/plan.ts, api/_lib/*, UI wiring in Today and TrustPanel, tests/validator/**, tests/e2e.

TASKS:
1. Request schema (Zod, strict): enums and engine facts only. Role labels are age bands. NO exact ages, coordinates, labels or free text. Titles and descriptions are NOT in the request; the server looks them up from the catalog by ID. Body cap 8 KB.
2. api/plan.ts: default-export Vercel handler plus a pure core; validate body; verify IDs exist in the catalog, approved and forbidden are disjoint, mustInclude is a subset of approved; derive the number allow-list server-side; build the prompt server-side; call Gemini in JSON mode with the key in a header; low temperature; maxOutputTokens cap; one retry with an error summary; validate output; return generic errors; rate limit; never log bodies. Verify the current model name and JSON-mode support against the official docs and record them in DATA_SOURCES.md.
3. Validator: seven checks plus A-12; NFKC-normalise text before number checks; compare numbers by VALUE; allow hours 0-23, minutes, 12-hour forms, durations that exist in catalog text, engine PM2.5 values (rounded and as given), level names, N95/FFP2/PM2.5, age bands. Reject markdown links and HTML. Fix the banned-phrase regexes (no character-class typos).
4. Client: the Today screen shows the deterministic plan immediately, then requests the overlay with an AbortController (8 s); the client builds its own allow-list and validates the response against the LOCALLY computed policy result (the client is the safety authority). On success swap in, announce "Plan updated with personalised order" via the live region WITHOUT moving focus. Use the REAL Risk Radar result in the payload.
5. Plan cache keyed by a hash of the plan-input payload + hour bucket + data signature + PROMPT_VERSION (A-29); never the raw profile or location.
6. Settings toggle to turn the overlay off; Trust Panel and Today show plan source.

ACCESSIBILITY: swap-in does not move focus or steal reading position; status announced once; badge is text.
SECURITY: SECURITY_PRIVACY section 18, Phase 5 row; bundle grep for key patterns.
TESTING: abuse suite per TEST_PLAN section 4 (hallucinated and forbidden IDs, must-include removed or demoted, invented numbers, full-width digits, injection strings, HTML or links, oversize, confidence inflation, extra keys, malformed JSON, "7:30" and "6 pm" accepted when engine-supported); API tests for 400/413/429; client timeout and abort; plan-cache keys; e2e with a mocked /api/plan showing the swap-in and the failure fallback.
DO NOT BUILD: chat, free-text input, multi-agent flows, streaming, new actions, any way for the model to alter policy results.

ACCEPTANCE: with LLM_PROVIDER=none nothing changes; with a mocked good response the plan swaps in; every bad fixture falls back to "Standard plan"; payload contains no coordinates, labels or exact ages (test asserts this by scanning the serialised request).

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(ai): constrained plan overlay with validator and fallback
```

### Prompt 6: Indoor and Move

```text
CONTEXT: Phase 5 is complete and green. Read AGENTS.md, README section 12 (Indoor, Move), P-05 to P-08, P-11, P-12, P-15 to P-18, P-22, docs/IMPACT_METHODOLOGY.md (X1, E1).

SCOPE: Indoor tab and Move tab. Content comes from the domain; the UI renders it.

FILES: src/ui/screens/{IndoorScreen,MoveScreen}.tsx, src/domain/{indoor,mobility}.ts (extend, do not weaken), tests.

TASKS:
1. Indoor: Ventilation Advisor verdict (Keep closed / Brief window around HH:00 / Ventilate) with reason and uncertainty; cleaner-room setup; source control; cooking guidance by fuel and exhaust; equipment-specific steps (purifier, window AC, HVAC, none); the P-22 safety line where required; Low-Cost Mode indicator.
2. Move: Commute Exposure Planner using X1 and the P-16 threshold ("no meaningful difference" otherwise); transport options filtered by P-18 and A-25; trip combining; E1 estimate with formula link; walk or cycle shown as "not suitable today" with the reason.
3. Everything shown is an approved candidate or a domain-computed fact.

ACCESSIBILITY: verdicts and reasons as text; "not suitable today" explained; axe clean; plain language.
SECURITY: nothing new on the server; content lint passes.
TESTING: component and e2e tests that the displayed verdict equals the domain output for each scenario; Priya shows low-smoke cooking and carpool; no walking in stale or severe; P-22 line for combustion households.
DO NOT BUILD: routing or maps, live traffic, new actions, new rules, Impact or Community.

ACCEPTANCE: UI never contradicts the domain output; no recommendation outside the approved set; e2e smoke green.

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(ui): indoor and move modules
```

### Prompt 7: Impact and Community (Attempt 1 gate)

```text
CONTEXT: Phase 6 is complete and green. Read AGENTS.md, README sections 12 (Impact, Community), 18, DECISIONS.md (ADR-010, A-17, A-21, A-31), docs/IMPACT_METHODOLOGY.md in full, docs/DEMO_SCRIPT.md.

SCOPE: Impact tab, Community tab with seeded data, shareable briefing.

FILES: src/ui/screens/{ImpactScreen,CommunityScreen}.tsx, src/data/samples/community.json, src/domain/community.ts, tests.

TASKS:
1. Impact tab: per-action dual-axis cards from the engine; a "this week if you do these" tally using E1 (and X1 where shown) from profile inputs; every number links to its formula, inputs and assumptions; CO2e hidden unless SHOW_CO2E.
2. Community: one seeded society labelled Demo data; local pledge toggles (no-burning CM-01); buddy-check as a counts line only (CM-03); carpool board deferred (A-17); C1 aggregate = sum of E1 over seeded per-pledge constants plus the user's own pledge; exposure never summed.
3. Copy briefing: plain text with level, top three actions, counts, disclaimer; announces "Copied"; contains no profile data, ages, flags or finer-than-city location (test asserts this).

ACCESSIBILITY: formulas readable as text; Copy briefing announced; counts have text; axe clean.
SECURITY: briefing text built from engine data only; clipboard written only on user action.
TESTING: unit tests for C1; content lint for banned claims and for the word "Measured"; e2e: pledge -> aggregate updates; Copy briefing content; Impact numbers match impact.ts for Priya.
DO NOT BUILD: community backend, social feed, chat, carpool board, accounts, push, weekly history storage.

ACCEPTANCE (Gate A): all items in SUBMISSION_CHECKLIST sections 0 and 11 (Attempt 1) are ticked; demo script runs end to end on a phone; CI green. Then tag: git tag attempt-1 && git push origin attempt-1 (tag only, no branch).

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: feat(impact): impact tab, community mode and shareable briefing
```

### Prompt 8: Quality hardening (Attempt 2 gate)

```text
CONTEXT: Phase 7 and Attempt 1 are complete. Read AGENTS.md, docs/TEST_PLAN.md, docs/ACCESSIBILITY.md section 15, docs/SECURITY_PRIVACY.md section 18, docs/SUBMISSION_CHECKLIST.md.

SCOPE: Hardening only. NO new features.

TASKS:
1. Matrix: shard and speed up `test:matrix`; add regression fixtures for every bug found; keep mutation checks.
2. E2E for every scenario and the keyboard-only journey; CSP-violation listener; 360 px and 200% text projects.
3. axe on all screens, dialogs and Severe Mode in light and dark with reduced motion; unit contrast tests; replace every hard-coded colour in components with tokens.
4. Performance: bundle budget script (initial JS <= 150 KB gzip) in CI; Lighthouse CI (mobile, throttled): Performance >= 90, Accessibility >= 95, Best Practices >= 95; fix findings.
5. Security checklist run (SECURITY_PRIVACY section 18, all rows); npm audit; secret scan on the built bundle.
6. Manual pass per ACCESSIBILITY section 15; record docs/a11y-report.md.
7. Fix only defects found; update README evidence (test counts, Lighthouse numbers).

DO NOT BUILD: new features, new actions or rules, new dependencies without justification, refactors that change behaviour.

ACCEPTANCE (Gate B): budgets met; zero serious or critical axe; all CI gates green; checklists complete; tag attempt-2 (tag only).

REQUIRED CHECKS: lint, typecheck, test, test:policy, test:matrix (local), build, test:e2e, Lighthouse CI, check:size, scan:secrets, check:branches, audit.
REPORT before declaring completion, including before/after numbers.
COMMIT: test: harden matrix, e2e, a11y, performance and security
```

### Prompt 9: Demo and submission (Attempt 3 gate)

```text
CONTEXT: Phase 8 and Attempt 2 are complete. Read AGENTS.md, docs/DEMO_SCRIPT.md, docs/SUBMISSION_CHECKLIST.md.

SCOPE: Copy and reading-level pass, demo assets, final README, freeze. NO new features.

TASKS:
1. Reading-level and consistency pass over all user-facing text; fix banned or risky phrasing; terms consistent ("Severe for your household", "respirator (N95 or FFP2)").
2. Verify the 90-second demo script step by step against the real UI; fix mismatches in the SCRIPT or (if a bug) the code with a regression test.
3. Final README: vertical, approach, logic, how it works, assumptions, limitations, setup, env table, evidence (tests, Lighthouse, axe), attribution, links to every doc (all must exist). Apply remaining amendments A-xx so README, ARCHITECTURE and DECISIONS agree.
4. Run the full "Final quality gates" in SUBMISSION_CHECKLIST section 12 on a clean clone and attach the output.
5. Freeze: no feature changes. Tag attempt-3 (tag only).

DO NOT BUILD: anything new; Hindi/Telugu only if all gates are already green and the user explicitly asks (A-16).

ACCEPTANCE (Gate C): SUBMISSION_CHECKLIST fully ticked with evidence.

REQUIRED CHECKS: every gate in SUBMISSION_CHECKLIST section 12.
REPORT before declaring completion.
COMMIT: docs: final README, demo script and submission freeze
```

---

## 3. Repair prompts for the current repository

These fix defects found in the 2026-11-21 review (see `SUBMISSION_CHECKLIST.md` section 0). Run in order **before Prompt 7**.

### Prompt R1: API foundation and AI wiring

```text
CONTEXT: The repo has an AI layer (src/ai/*, api/plan.ts) that is NOT wired and NOT deployable: getPersonalizedPlan is never called from the UI; api/plan.ts exports a plain function (no Vercel handler); api/air.ts, api/geocode.ts, api/health.ts and vercel.json do not exist; the browser calls Open-Meteo directly; the server trusts client-supplied candidate titles, IDs and number allow-lists; prepareAIPlanInput uses members[0] and slots[0] instead of the real Risk Radar result and sends exact ages in roleLabel; the validator rejects legitimate text ("7:30" when the routine is "07:30", "6 pm", "10 minutes") and misses full-width digits. Read AGENTS.md, docs/SECURITY_PRIVACY.md (sections 3-9, 17), docs/DATA_SOURCES.md, docs/TEST_PLAN.md sections 4, 5, 11.

SCOPE: Close blockers B-1 to B-5 in SUBMISSION_CHECKLIST.md. Nothing else.

FILES: api/{air,geocode,plan,health}.ts, api/_lib/*, vercel.json, vite.config.ts (dev middleware), src/ai/*, src/data/providers/*, src/data/fallback-chain.ts (provider calls via /api only), src/ui/screens/TodayScreen.tsx, src/ui/components/TrustPanel.tsx, tests.

TASKS:
1. Implement the handlers exactly as in Prompt 2 items 3-4 and Prompt 5 items 1-3 (Zod strict bodies, caps, rate limit, CORS, generic errors, key in a header, catalog-derived titles, server-derived allow-list, one retry). Pure core functions are unit-tested; default exports satisfy the Vercel runtime (verify against current Vercel docs).
2. Add vercel.json with the CSP and headers; route the browser only through /api/*; remove direct Open-Meteo calls from client code.
3. Fix prepareAIPlanInput: real radar result (member age-band label and slot ID), age-band role labels only, no exact ages.
4. Rewrite the validator number check: NFKC normalise; compare by value; allow engine-supported hours, minutes, 12-hour forms, catalog durations, PM2.5 values (rounded and raw), level names, N95/FFP2/PM2.5, age bands; fix banned-phrase regexes.
5. Wire the overlay into Today: deterministic plan first; request the overlay in an effect with AbortController; validate against the locally computed policy result; swap in; announce via the polite live region without moving focus; settings toggle; plan source in the Trust Panel.

ACCESSIBILITY: no focus movement on swap-in; text badge; one announcement.
SECURITY: SECURITY_PRIVACY section 18 Phase 2 and 5 rows; test that the serialised AI request contains no coordinates, labels or exact ages; bundle grep for key patterns.
TESTING: handler tests (400/413/415/429/403); abuse fixtures; "7:30", "6 pm", "10 minutes" accepted when engine-supported and an invented "40%" rejected; full-width digits rejected; e2e with a mocked /api/plan (swap-in and failure fallback); CSP-violation listener.
DO NOT BUILD: new features, new actions, chat, streaming, OpenAQ, any change to policy rules.

ACCEPTANCE: with LLM_PROVIDER=none the app behaves as before; with the mocked good response the badge shows "AI-personalised"; every bad fixture shows "Standard plan"; `curl` oversize and bad-enum requests return 413 and 400; no provider URL appears in src/ui or client data code.

REQUIRED CHECKS: lint, typecheck, test, test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: fix(api): real handlers, headers, server-side validation and wired AI overlay
```

### Prompt R2: Time and offline correctness

```text
CONTEXT: Slots, radar and ventilation use the browser's local getHours(), but Open-Meteo returns the location's local time, so viewers in other time zones get shifted windows. Sample scenarios are generated with local setHours then converted to UTC. The fallback chain's "stale cache" step is unreachable because the cache deletes expired entries, and a live failure silently falls back to the moderate SAMPLE scenario. Read AGENTS.md, DECISIONS.md (A-06, A-22, A-23, A-32), docs/DATA_SOURCES.md sections 4, 11.

SCOPE: Close blockers B-6 and B-7.

FILES: src/domain/{radar,ventilation,trend,freshness,normalization}.ts, src/data/{cache,fallback-chain}.ts, src/data/samples/*, src/ui banners and a "Use demo data" action, tests.

TASKS:
1. Introduce a single time helper in the domain that reads the local hour/minute from the timestamp string (or applies utcOffsetSeconds); replace every getHours()/getMinutes() on runtime-local time.
2. Regenerate sample timestamps with explicit offsets so slots align for any viewer time zone.
3. Cache returns the last real reading even after TTL, with freshness RECOMPUTED from fetchedAt (fresh/aging/stale per A-06); TTL only decides whether to refetch.
4. When live and cache both fail, return freshness `none` so P-04 applies (cautious level 2, no ventilation or walking) and show a "Use demo data" button. Sample data is only used when the user selects a demo scenario (A-32). Update README section 24 and ARCHITECTURE accordingly.
5. Ventilation uses the bands config for its threshold and selects the window that contains the chosen hour.

ACCESSIBILITY: new banners have plain-language text; the demo-data button is labelled and keyboard operable.
SECURITY: no new surface.
TESTING: run the whole suite under TZ=UTC, TZ=Asia/Kolkata and TZ=America/Los_Angeles and assert identical plans for the same snapshot; cache tests (expired entry served as stale, freshness recomputed); fallback tests (no cache => none => level 2 and suppressed outdoor actions); e2e offline with and without a prior live fetch.
DO NOT BUILD: new providers, new rules, UI redesign.

ACCEPTANCE: identical results in three time zones; offline after TTL shows the last real reading as aging/stale; offline with no cache shows cautious defaults and the demo-data button, never silent sample data.

REQUIRED CHECKS: lint, typecheck, test (under the three TZ values), test:policy, build, test:e2e, check:size, scan:secrets, check:branches.
REPORT before declaring completion.
COMMIT: fix(domain): time-zone-safe slots and honest offline fallback
```

### Prompt R3: Real policy matrix and working guards

```text
CONTEXT: tests/policy/policy-matrix.test.ts rotates secondary dimensions with a counter instead of crossing them; invariant 1 compares the policy against its own forbiddenActionIds (it cannot fail); the under-5 assertion never fires for the infant-plus-adult persona; expectedBase is never asserted; everything sits in one `it`. check:branches reads only local branches and fails open; scan-secrets ignores by substring; ESLint boundary patterns miss nested relative imports and do not lint domain purity. Read AGENTS.md, docs/TEST_PLAN.md sections 3, 12, docs/SECURITY_PRIVACY.md section 17.

SCOPE: Close blockers B-8 and B-10. Tests and tooling only; change production code only to fix a defect the new tests expose, and list each one.

FILES: tests/policy/*, tests/README.md, scripts/*.mjs, eslint.config.js, .github/workflows/ci.yml, package.json scripts.

TASKS:
1. Rebuild the matrix: pairwise (`test:policy`, < 30 s, runs in CI) and the full cartesian (`test:matrix`, sharded, local and nightly) over the nine dimensions in TEST_PLAN section 3. Use it.each or a generator so failures name the case. Assert each rule P-01..P-22 with its own INDEPENDENT predicate written in the test (for example: level >= 3 implies IN-02 absent; sensitive member and level >= 3 implies PE-03 in the top 3; any under-5 member implies PE-02 wording excludes that member; P-22; P-16 threshold; budget free implies no purchase required unless no free equivalent). Assert expectedBase for the band values.
2. Mutation checks: copies of the policy with five different rules disabled must make the matrix FAIL.
3. Add tests/README.md traceability table and a CI script that fails if any P-rule, error type, or impact field has no mapped test.
4. check:branches: use `git ls-remote --heads origin` (fall back to local branches only when no remote exists), fail closed on errors, require exactly `main`. scan-secrets: anchored path-segment ignores. check-size: include .git size.
5. ESLint: nested-import boundary patterns; no-restricted-globals for src/domain (window, document, localStorage, navigator, fetch, Date.now via a custom message); add format:check, test:policy and the traceability script to CI.

ACCESSIBILITY: none.
SECURITY: S-07 and S-08 closed; guard behaviour tested.
TESTING: guard scripts have tests (fake extra remote branch name list, planted secret in a path containing "dist", nested bad import).
DO NOT BUILD: new product features or new rules.

ACCEPTANCE: the matrix can fail (mutation checks prove it); `test:policy` < 30 s; full matrix output saved to docs/matrix-run.txt with zero violations; guards fail closed; the lint rule rejects a nested bad import.

REQUIRED CHECKS: lint, typecheck, test, test:policy, test:matrix (local), build, check:size, scan:secrets, check:branches.
REPORT before declaring completion, listing any production defects the stronger tests found and how they were fixed.
COMMIT: test: independent policy matrix, mutation checks and fail-closed guards
```
