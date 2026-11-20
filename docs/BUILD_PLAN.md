# AirWise — Build Plan

Purpose: the phase-by-phase execution plan for Antigravity. Source of truth for scope is `README.md` as amended by `DECISIONS.md` (Amendment Register A-xx). Paste-ready prompts are in `ANTIGRAVITY_PROMPTS.md`.

## Sequence changes versus the README baseline

| Change | Reason |
|---|---|
| Phase 1 split into **1A** (types, config, levels, freshness, trend, radar, ventilation, catalog, templates) and **1B** (policy, plan-builder, impact, confidence, quick checks, policy matrix). | Phase 1 is the largest. Two commits keep each reviewable. |
| Phase 4 split into **4A** (Today shell + deterministic plan) and **4B** (Severe Mode, Quick Checks, action detail, Trust Panel, service worker). | First usable product earlier; offline gate sits at 4B. |
| Playwright e2e job added at 4A (not Phase 0). axe in unit-level component checks from Phase 3, in Playwright from 4A. | Nothing to run e2e against before that. |
| `api/geocode.ts` added in Phase 2. | CSP `connect-src 'self'` (A-02). |
| Policy-matrix *full* enumeration runs in Phase 1B; Phase 8 adds sharding, perf budget, and regression fixtures. | Safety proven before UI exists. |

## Attempt cut line (minimum credible Attempt 1)

Must exist at Gate A: onboarding + Priya preset; live/cached/sample air with Trust Panel; deterministic plan; Risk Radar; Severe Mode; Low-Cost Mode; Quick Checks; action detail with dual-axis impact for **every** action; AI overlay with validator and fallback; Indoor (Ventilation Advisor); Move (Commute Planner); Impact tab with E1 and X1; Community (seeded, pledges, copy briefing); offline/sample mode; matrix, validator, contract, golden tests; README.
Cut from Attempt 1: CO₂e, carpool board, weekly history, Hindi/Telugu, OpenAQ, any chart beyond the inline sparkline.

## Global rules for every phase

1. Start from a green `main` (`npm run lint && npm run typecheck && npm test && npm run build`).
2. Agent writes a short plan, then implements. No scope outside the phase.
3. Each phase ends with: all checks green, the manual verification done, acceptance boxes ticked here, one commit pushed to `main`.
4. Never create branches. Never commit `.env`, build output, or binaries over 50 KB.
5. If a rule, number or action is missing from docs, stop and ask; never invent.

---

## Phase 0 — Foundations
**Objective:** An empty but fully gated repository.
**Scope:** Tooling, CI, guards, tokens, docs placement. No product code.
**Tasks:**
1. Vite + React + strict TS scaffold; Vitest; Playwright config (no tests yet); ESLint with `no-restricted-imports` boundary rules (domain → nothing; data/ai → domain; ui → domain/data/ai types/state; api → domain + `src/data/providers`); Prettier.
2. `AGENTS.md` from the Shared Context Block; `.gitignore`, `.env.example`, `LICENSE` (MIT).
3. `scripts/check-size.mjs`, `check-branches.mjs`, `scan-secrets.mjs`; npm scripts `check:size`, `check:branches`, `scan:secrets`.
4. `.github/workflows/ci.yml`: install, lint, typecheck, unit, build, audit (`--audit-level=high`), size, secrets, branches. **No Dependabot.**
5. `src/styles/tokens.css` (colour tokens with contrast-checked pairs, spacing, type scale, focus ring, ≥44 px target token), `base.css`, system font stack.
6. `vercel.json` with security headers and CSP (A-15). Placeholder `/api/health.ts`.
7. Place all docs under `docs/`; apply README patches A-01.
**Files:** repo root config, `scripts/`, `.github/`, `src/styles/`, `src/main.tsx` (hello shell), `api/health.ts`, `vercel.json`, docs.
**Depends on:** none.
**Acceptance:** CI green on a trivial test; boundary lint fails on a deliberate bad import (then removed); CSP present; repo < 1 MB; `scan:secrets` flags a planted fake key (then removed).
**Tests:** one smoke unit test; a script test for size/secret guards.
**Manual:** `npm run dev` loads; `npm run build` output not tracked.
**Done:** all above, pushed.
**Commit:** `chore: scaffold repo, CI guards, tokens and AGENTS.md`
**Gate:** CI green.

## Phase 1A — Domain foundations
**Objective:** Types and risk primitives, fully unit-tested.
**Tasks:** `types.ts` (+Zod; incl. `homeHeating`, `Mode`, role labels A-03/A-20); `config/bands.ts` (India CPCB-aligned and US-EPA-aligned, each with source note and `verified: false` until Phase 2 check); `config/thresholds.ts` (A-06, P-16 ≥5 µg/m³ and ≥15%); `config/radar-weights.ts` (A-27); `levels.ts`; `freshness.ts`; `trend.ts`; `radar.ts`; `ventilation.ts` (P-05…P-07, A-23); `catalog/` for all Appendix A IDs (impact specs, templateKey, evidence, cost, effort, gating); `templates.ts` (plain-language text, i18n keys, fixed texts for PE-04, P-13, P-22).
**Files:** `src/domain/**`, `tests/unit/**`.
**Depends on:** 0.
**Acceptance:** band boundary tests at every breakpoint; effective-level tests for each vulnerability class; trend/freshness edge cases (missing hours, null now, DST-free but timezone-offset series); every catalog entry has both impact axes, label, confidence rule input, assumptions, `doesNotChange`; domain imports nothing outside `src/domain`.
**Manual:** none (no UI).
**Commit:** `feat(domain): types, levels, freshness, radar, ventilation, catalog`

## Phase 1B — Policy, plan builder, impact, matrix
**Tasks:** `policy.ts` (P-01…P-22 with A-04, A-08, A-11, A-25), `plan-builder.ts` (slots, ranking, top-3 composition, Low-Cost Mode A-13), `impact.ts` (E1, X1, C1; E2 behind `SHOW_CO2E`), `confidence.ts`, `quickchecks.ts`; policy matrix tests per `TEST_PLAN.md` (pairwise in `test:policy`, full cartesian in `test:matrix`); golden personas (Priya ×4 scenarios, outdoor worker, elderly-only, free-budget student).
**Depends on:** 1A.
**Acceptance:** every rule has ≥1 unit test and matrix assertion; zero invariant violations; plan always ≥3 candidates and ≥1 action per slot where applicable; `test:policy` < 30 s; `test:matrix` completes locally.
**Commit:** `feat(domain): policy engine, plan builder, impact and matrix tests`
**Gate:** Policy matrix green.

## Phase 2 — Data layer
**Tasks:** verify Open-Meteo parameters and band breakpoints against official docs, record access dates in `DATA_SOURCES.md`; `providers/openMeteoAir.ts`, `openMeteoWeather.ts` (incl. sunrise/sunset), `geocode.ts` (pure parse + Zod); `api/air.ts`, `api/geocode.ts`, `api/_lib/*` (rate limit, validation, headers, error mapper); Vite dev middleware (A-14); `fallback-chain.ts`; `cache.ts`; `samples/` (clear, moderate, severe, stale, city list ≤ 20) with a size guard; `trust.ts`.
**Depends on:** 1B.
**Acceptance:** contract tests on recorded fixtures (nulls, missing hours, schema drift, partial failure, timezone offset); fallback order primary → cache → sample verified; attribution string present in Trust model; `npm run dev` serves `/api/air` with no keys.
**Tests:** contract, fallback chain, cache TTL, rate limiter, handler validation, CORS.
**Manual:** hit `/api/air` for Hyderabad and Delhi coordinates; unplug network and confirm sample fallback.
**Commit:** `feat(data): providers, api handlers, fallback chain, samples, trust model`
**Gate:** Contract tests green.

## Phase 3 — Onboarding and profile
**Tasks:** state store (`state/`), LocalStorage adapter with schema versioning and in-memory fallback; five-step onboarding (incl. `homeHeating`, privacy and AI notice with toggle); Priya preset (profile + severe scenario, A-28); Menu: edit profile, export JSON, delete all; accessible form components.
**Depends on:** 2.
**Acceptance:** onboarding completes in < 90 s keyboard-only; validation errors announced; export/delete work and delete leaves no AirWise keys; corrupt storage recovers to safe reset; axe zero serious/critical on every step.
**Tests:** store migration, corrupt storage, form validation, Playwright onboarding + axe.
**Commit:** `feat(ui): onboarding, local profile, export and delete`
**Gate:** a11y checks green.

## Phase 4A — Today and deterministic plan
**Tasks:** app shell with 5 tabs (lazy chunks), Today: air briefing card (PM2.5 primary, AQI secondary, sparkline inline SVG), risk headline (A-09), Risk Radar, top 3, six-slot timeline; scenario switcher in Menu; Playwright e2e job in CI.
**Acceptance:** Priya preset → Today in ≤ 3 taps and ≤ 10 s; all four scenarios render correct level and plan; no AI code involved.
**Commit:** `feat(today): briefing, risk radar, deterministic plan and timeline`

## Phase 4B — Severe Mode, Quick Checks, action detail, Trust Panel, offline
**Tasks:** Severe Mode layout (auto/manual, ≥ 20 px, max 3 actions, no charts); Quick Checks; action detail sheet (Why, dual-axis, doesNotChange, assumptions, cost/effort); Trust Panel (plan source and confidence); stale/no-data banners; `vite-plugin-pwa` (shell + last air snapshot only; never cache `/api/plan`); error boundary per tab.
**Acceptance:** works offline with `LLM_PROVIDER=none`; stale scenario suppresses walking/ventilation and lowers confidence; 100% of visible actions show all impact fields; axe clean incl. Severe Mode.
**Manual:** browser test of all scenarios at 360 px width and 200% text.
**Commit:** `feat(today): severe mode, quick checks, action detail, trust panel, offline`
**Gate:** Works offline with no AI. **This is the first usable product.**

## Phase 5 — AI plan layer
**Tasks:** `ai/schema.ts`, `prompts/` (+`PROMPT_VERSION`), `api/plan.ts` (Zod body validation, server-built prompt, JSON mode, no body logging, timeout, rate limit), `ai/client.ts`, `validator.ts` (7 checks + A-12), `overlay.ts` (confidence ceiling), `plan-cache.ts` (A-29), UI swap-in with badge and polite live-region announcement; settings toggle.
**Acceptance:** malicious, malformed, hallucinated, partial fixtures all rejected; one retry then fallback; with mocked model the plan swaps in; with `none` nothing changes; no coordinates or location label in the request.
**Tests:** validator abuse suite, client timeout/abort, plan-cache keys, e2e with mocked `/api/plan`.
**Commit:** `feat(ai): constrained plan overlay with validator and fallback`
**Gate:** Abuse tests green.

## Phase 6 — Indoor and Move
**Tasks:** Indoor tab (Ventilation Advisor, cleaner room, source control, cooking by fuel/exhaust, equipment steps, P-22 safety line); Move tab (Commute Exposure Planner with X1 and P-16 threshold, transport options by P-18/P-25, trip combining, walk/cycle "not suitable today" with reason); Low-Cost Mode visible indicator.
**Acceptance:** verdict and reason match domain output; no recommendation outside the approved set; Priya shows low-cost cooking steps and carpool.
**Commit:** `feat(ui): indoor and move modules`
**Gate:** e2e smoke green.

## Phase 7 — Impact and Community
**Tasks:** Impact tab (per-action cards, E1/X1 with formula links, "if you do these this week" tally from profile inputs), Community tab (seeded society, local pledges, C1 aggregate, counts line, Copy briefing), Demo data labelling.
**Acceptance:** every number links to formula and assumptions; no banned copy (content lint); briefing copy contains no personal data.
**Commit:** `feat(impact): impact tab, community mode and shareable briefing`
**Gate A (Attempt 1):** full checklist in `SUBMISSION_CHECKLIST.md` §Attempt 1 passes; tag `attempt-1`.

## Phase 8 — Quality hardening
**Tasks:** shard/optimise matrix, add regression fixtures from bugs; e2e for every scenario and keyboard-only journey; axe on all screens; Lighthouse mobile budgets; bundle analysis (≤ 150 KB gzip initial); manual screen-reader and keyboard pass (`ACCESSIBILITY.md`); security checklist run; fix findings only.
**Acceptance:** budgets met; zero serious/critical axe; security checklist complete; no new features.
**Commit:** `test: harden matrix, e2e, a11y, performance and security`
**Gate B (Attempt 2):** tag `attempt-2`.

## Phase 9 — Demo and submission
**Tasks:** reading-level and copy pass; rehearse `DEMO_SCRIPT.md` on a phone; README final (vertical, approach, logic, how it works, assumptions, limitations, setup); final guards; freeze.
**Acceptance:** `SUBMISSION_CHECKLIST.md` fully ticked.
**Commit:** `docs: final README, demo script and submission freeze`
**Gate C (Attempt 3):** tag `attempt-3`.

## Phase tracker
- [x] 0 · [x] 1A · [x] 1B · [x] 2 · [x] 3 · [x] 4A · [x] 4B · [ ] 5 · [ ] 6 · [ ] 7 (Gate A) · [ ] 8 (Gate B) · [ ] 9 (Gate C)
