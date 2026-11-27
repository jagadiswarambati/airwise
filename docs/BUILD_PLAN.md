# AirWise — Build Plan

Purpose: the phase-by-phase execution plan for Antigravity. Source of truth for scope is `README.md` as amended by `DECISIONS.md` (Amendment Register A-xx). Master agent instructions are in `AGENTS.md`.

## Sequence changes versus the README baseline

| Change | Reason |
|---|---|
| Phase 1 split into **1A** (types, config, levels, freshness, trend, radar, ventilation, catalog, templates) and **1B** (policy, plan-builder, impact, confidence, quick checks, policy matrix). | Phase 1 is the largest. Two commits keep each reviewable. |
| Phase 4 split into **4A** (Today shell + deterministic plan) and **4B** (Severe Mode, Quick Checks, action detail, Trust Panel). | First usable product earlier (service worker and offline shell are not implemented). |
| Playwright e2e and axe-core automation: Planned, not implemented (decision A-41). | Accessibility currently verified with Vitest render tests, check:ui, manual keyboard/screen-reader checks, and Chrome Lighthouse (docs/evidence/lighthouse.md). |
| `api/geocode.ts` added in Phase 2. | CSP `connect-src 'self'` (A-02). |
| Policy-matrix *full* enumeration runs in Phase 1B; Phase 8 adds sharding, perf budget, and regression fixtures. | Safety proven before UI exists. |

## Attempt cut line (minimum credible Attempt 1)

Must exist at Gate A: onboarding + Priya preset; live/cached/sample air with Trust Panel; deterministic plan; Risk Radar; Severe Mode; Low-Cost Mode; Quick Checks; action detail with dual-axis impact for **every** action; AI overlay with validator and fallback; Indoor (Ventilation Advisor); Move (Commute Planner); Impact tab with E1 and X1; Community (seeded, pledges, copy briefing); sample demo mode (offline shell not implemented); matrix, validator, contract, golden tests; README.
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
1. Vite + React + strict TS scaffold; Vitest; (Playwright e2e: Planned, not implemented per decision A-41); ESLint with `no-restricted-imports` boundary rules (domain → nothing; data/ai → domain; ui → domain/data/ai types/state; api → domain + `src/data/providers`); Prettier.
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
**Acceptance:** onboarding completes in < 90 s keyboard-only; validation errors announced; export/delete work and delete leaves no AirWise keys; corrupt storage recovers to safe reset; accessibility verified clean via Vitest render tests and check:ui (axe-core automation: Planned, not implemented per decision A-41).
**Tests:** store migration, corrupt storage, form validation. (Playwright onboarding and axe-core: Planned, not implemented per decision A-41).
**Commit:** `feat(ui): onboarding, local profile, export and delete`
**Gate:** a11y checks green.

## Phase 4A — Today and deterministic plan
**Tasks:** app shell with 5 tabs (lazy chunks), Today: air briefing card (PM2.5 primary, AQI secondary, sparkline inline SVG), risk headline (A-09), Risk Radar, top 3, six-slot timeline; scenario switcher in Menu. (Playwright e2e job: Planned, not implemented per decision A-41).
**Acceptance:** Priya preset → Today in ≤ 3 taps and ≤ 10 s; all four scenarios render correct level and plan; no AI code involved.
**Commit:** `feat(today): briefing, risk radar, deterministic plan and timeline`

## Phase 4B — Severe Mode, Quick Checks, action detail, Trust Panel (offline shell/PWA not implemented)
**Tasks:** Severe Mode layout (auto/manual, ≥ 20 px, max 3 actions, no charts); Quick Checks; action detail sheet (Why, dual-axis, doesNotChange, assumptions, cost/effort); Trust Panel (plan source and confidence); stale/no-data banners; error boundary per tab. (Service worker and `vite-plugin-pwa`: not implemented).
**Acceptance:** operates without AI keys (`LLM_PROVIDER=none`, rules-only mode); stale scenario suppresses walking/ventilation and lowers confidence; 100% of visible actions show all impact fields; accessibility verified clean incl. Severe Mode via Vitest render tests, check:ui, and Lighthouse (docs/evidence/lighthouse.md); axe-core automation: Planned, not implemented (decision A-41).
**Manual:** browser test of all scenarios at 360 px width and 200% text.
**Commit:** `feat(today): severe mode, quick checks, action detail, trust panel`
**Gate:** Operates in rules-only mode with no AI (live air data needs network). **This is the first usable product.**

## Phase 5 — AI plan layer
**Tasks:** `ai/schema.ts`, `prompts/` (+`PROMPT_VERSION`), `api/plan.ts` (Zod body validation, server-built prompt, JSON mode, no body logging, timeout, rate limit), `ai/client.ts`, `validator.ts` (7 checks + A-12), `overlay.ts` (confidence ceiling), `plan-cache.ts` (A-29), UI swap-in with badge and polite live-region announcement; settings toggle.
**Acceptance:** malicious, malformed, hallucinated, partial fixtures all rejected; one retry then fallback; with mocked model the plan swaps in; with `none` nothing changes; no coordinates or location label in the request.
**Tests:** validator abuse suite, client timeout/abort, plan-cache keys; integration tests with mocked `/api/plan` (Playwright e2e: Planned, not implemented per decision A-41).
**Commit:** `feat(ai): constrained plan overlay with validator and fallback`
**Gate:** Abuse tests green.

## Phase 6 — Indoor and Move
**Tasks:** Indoor tab (Ventilation Advisor, cleaner room, source control, cooking by fuel/exhaust, equipment steps, P-22 safety line); Move tab (Commute Exposure Planner with X1 and P-16 threshold, transport options by P-18/P-25, trip combining, walk/cycle "not suitable today" with reason); Low-Cost Mode visible indicator.
**Acceptance:** verdict and reason match domain output; no recommendation outside the approved set; Priya shows low-cost cooking steps and carpool.
**Commit:** `feat(ui): indoor and move modules`
**Gate:** render and unit smoke tests green (Playwright e2e: Planned, not implemented per decision A-41).

## Phase 7 — Impact and Community
**Tasks:** Impact tab (per-action cards, E1/X1 with formula links, "if you do these this week" tally from profile inputs), Community tab (seeded society, local pledges, C1 aggregate, counts line, Copy briefing), Demo data labelling.
**Acceptance:** every number links to formula and assumptions; no banned copy (content lint); briefing copy contains no personal data.
**Commit:** `feat(impact): impact tab, community mode and shareable briefing`
**Gate A (Attempt 1):** full checklist in `SUBMISSION_CHECKLIST.md` §Attempt 1 passes; tag `attempt-1`.

## Phase 8 — Quality hardening
**Tasks:** shard/optimise matrix, add regression fixtures from bugs; Lighthouse mobile budgets; bundle analysis (≤ 150 KB gzip initial); manual screen-reader and keyboard pass (`ACCESSIBILITY.md`); security checklist run; fix findings only. (Playwright e2e and axe-core automation: Planned, not implemented per decision A-41).
**Acceptance:** budgets met; accessibility verified via manual audit, check:ui, and Lighthouse (docs/evidence/lighthouse.md); security checklist complete; no new features. (axe-core: Planned, not implemented per decision A-41).
**Commit:** `test: harden matrix, e2e, a11y, performance and security`
**Gate B (Attempt 2):** tag `attempt-2`.

## Phase 9 — Demo and submission
**Tasks:** reading-level and copy pass; rehearse `DEMO_SCRIPT.md` on a phone; README final (vertical, approach, logic, how it works, assumptions, limitations, setup); final guards; freeze.
**Acceptance:** `SUBMISSION_CHECKLIST.md` fully ticked.
**Commit:** `docs: final README, demo script and submission freeze`
**Gate C (Attempt 3):** tag `attempt-3`.

## Phase tracker
- [x] 0 · [x] 1A · [x] 1B · [x] 2 · [x] 3 · [x] 4A · [x] 4B · [x] 5 · [x] 6 · [x] 7 (Gate A) · [x] 8 (Gate B) · [x] 9 (Gate C)

---

## Development workflow for Antigravity

1. Save the **Shared Context Block** as `AGENTS.md` in the repo root (and, if your Antigravity version supports workspace rules, as a rule too).
2. Run **one phase at a time**. Paste that phase's prompt. Require the agent to produce a plan first, then implement.
3. The agent must run lint, typecheck and tests, and report results, before declaring done.
4. **You review the diff and the acceptance checklist.** Do not start the next phase until the current one passes and is committed and pushed.
5. One branch (`main`). Small, meaningful commits (conventional style). Push after every phase and, ideally, after each meaningful sub-step.
6. After each phase, tick the checklist in `docs/BUILD_PLAN.md`.
7. Ask the agent to open the running app and test it in the browser at the end of Phases 4, 6, 7 and 8.

## Demonstration script

- Rehearsed 90-second judge demonstration script and fallback procedure are in [`docs/DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

## Global product acceptance criteria

Each phase has numbered, checkable criteria in this document. Global product acceptance criteria:

- [x] Priya preset → Today in ≤ 3 taps and ≤ 10 s.
- [x] All four demo scenarios render correct level, plan and Trust Panel.
- [x] 100% of actions show Why, Exposure, Emissions, label, confidence and assumptions.
- [x] No action violates any rule P-01…P-22 anywhere in the policy matrix.
- [x] App is fully usable with `LLM_PROVIDER=none` and with the network off (sample/cached).
- [ ] axe-core automation: Planned, not implemented (decision A-41). Accessibility is currently verified via Vitest render tests, check:ui, manual keyboard and screen-reader checks (docs/a11y-report.md), and Chrome Lighthouse ([docs/evidence/lighthouse.md](./evidence/lighthouse.md)). Keyboard-only flow completes the journey.
- [x] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- [x] CI green: lint, types, unit, audit, size, secret scan, branch guard.
- [x] Repo < 10 MB (target < 3 MB), public, single branch, regular commit history.
- [x] README explains vertical, approach, logic, how it works, assumptions.

## Three-attempt submission strategy

| Attempt | Submit when | Contains | Rule |
|---|---|---|---|
| **1: Complete and safe** | After Phase 7 (Gate A) | Every mandatory capability, deterministic plan, AI overlay with fallback, Severe/Low-Cost modes, community on seeded data, core + matrix tests, README | Must be demoable end-to-end on a phone. Not a prototype. |
| **2: Evidence of quality** | After Phase 8 (Gate B) | Expanded tests, Lighthouse, security checklist, manual a11y audit (Playwright e2e and axe-core: Planned, not implemented per decision A-41) | Strict improvement only. Re-run full suite. |
| **3: Polish and de-risk** | After Phase 9 (Gate C) | Copy and reading-level pass, demo assets, final README, freeze | No new features. If in doubt, don't ship the change. |

Always keep a tagged known-good commit (`git tag attempt-N`) before submitting. Tags are not branches.

## Evaluation-criteria mapping & verification metrics

| Criterion | Target | Measured in this Session | Verification Command |
|---|---|---|---|
| **Repository Size** | < 3 MB (Warning: 3 MB, Limit: 10 MB) | **2.67 MB** (28,00,860 bytes) [including `.git`] | `npm run check:size` |
| **Unit & Integration Tests** | 100% passing across domain, data, shell, screens | **421 passed** across **56 test files** | `npm test` |
| **Policy Matrix Invariants** | P-01 to P-22 zero violations + mutations | **9 passed** across **2 test files** | `npm run test:policy` |
| **Timezone Invariance** | Zero shifts across global runtime timezones | **PASS** across `UTC`, `Asia/Kolkata`, `America/Los_Angeles` | `npm run test:tz` |
| **Design System & UI Guard** | Zero undefined tokens, zero literal hex colors in components, zero non-token inline styles, zero emoji in UI, zero uppercase transforms, zero disallowed alerts | **0 errors** (all rules compliant) | `npm run check:ui` |
| **Documentation Link Integrity** | Zero broken relative links across README and docs/*.md | **PASS** (all links resolve) | `npm run check:links` |
| **Secret Leakage Guard** | Zero committed credentials or keys | **PASS** (0 secrets detected) | `npm run scan:secrets` |
| **Single-Branch Guard** | Exactly `main` only on origin remote | **PASS** (remote origin has only `main`) | `npm run check:branches` |
| **Production Build Size** | Clean bundle, optimized code splitting | Entry JS: **413.08 kB** (124.16 kB gzip); CSS: **75.83 kB** (11.45 kB gzip); Font: **34.00 kB** WOFF2 | `npm run build` |
| **Mobile Lighthouse Scores** | Score >= 90 across all categories | Performance: **85–93**, Accessibility: **96–100**, Best Practices: **92–96**, SEO: **100** | See [`docs/evidence/lighthouse.md`](./evidence/lighthouse.md) |

## Appendix A: Action catalog (approved candidate universe)

| ID | Action | Axis | Cost | Gating |
|---|---|---|---|---|
| IN-01 | Keep windows and doors closed | Exposure | Free | Required at effective level ≥ 3 |
| IN-02 | Brief ventilation in the cleanest window | Exposure (conditional) | Free | P-05/P-06/P-07 |
| IN-03 | Set up one cleaner room (bedroom of most vulnerable member) | Exposure | Free | Always candidate |
| IN-04 | Seal gaps (door/window leaks) with towels or draught strips | Exposure | Free–Low | Rented-friendly, non-permanent |
| IN-05 | Run purifier correctly (closed room, right placement, filter care) | Exposure | Free | Requires purifier |
| IN-06 | Window AC/HVAC on recirculate where available; clean filter | Exposure | Free | Requires AC/HVAC |
| IN-07 | Cook with exhaust/chimney on | Exposure (+ source control) | Free | Requires exhaust |
| IN-08 | Low-smoke cooking: lids, batch cooking, children out of kitchen | Exposure + Emissions (minor) | Free | Substitutes IN-07 |
| IN-09 | No indoor smoke: incense, coils, candles, tobacco, burning | Exposure + Emissions | Free | Always |
| IN-10 | Damp-wipe/mop instead of dry sweeping | Exposure | Free | Always |
| PE-01 | Limit outdoor time for sensitive members; avoid long outdoor waits | Exposure | Free | Level ≥ 2 |
| PE-02 | Fitted respirator (N95/FFP2) for essential outdoor trips | Exposure | Low | P-13, budget |
| PE-03 | Indoor play/exercise instead of outdoor | Exposure | Free | Required for sensitive at level ≥ 2 |
| PE-04 | Check on elders; follow own clinician plan; know when to seek care | Exposure (protective) | Free | Fixed medical-boundary text |
| MO-01 | Shift commute to cleaner forecast window | Exposure + Emissions (if less idling) | Free | P-16 |
| MO-02 | Use public transport for the trip | Emissions | Low | P-18, waiting caveat |
| MO-03 | Carpool | Emissions | Free | P-18 |
| MO-04 | Combine trips/errands | Emissions | Free | Always |
| MO-05 | Work remotely on worst day | Both | Free | P-17 |
| MO-06 | Engine off when waiting; no idling | Emissions | Free | P-18 |
| MO-07 | Walk short trips | Both (conditional) | Free | P-08 |
| CM-01 | No-burning pledge | Emissions | Free | Community |
| CM-02 | Carpool board | Emissions | Free | Community |
| CM-03 | Buddy-check for vulnerable residents | Exposure (support) | Free | Community |
| CM-04 | Share daily briefing | Both (coordination) | Free | Community |

## Appendix B: Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Live data unavailable or looks "boring" on judging day | High | High | Keyless provider, caches, sample scenarios, scenario switcher |
| 2 | LLM output unsafe/invalid | Medium | High | Candidate-set constraint, validator, deterministic fallback, abuse tests |
| 3 | False precision in impact claims | Medium | High | Formula-only numbers, qualitative otherwise, banned-copy lint |
| 4 | Scope creep / unfinished polish | High | High | Frozen scope, early usable build (Phase 4), gates per attempt |
| 5 | Judges perceive "AQI app + chatbot" | Medium | High | Lead demo with plan, Radar, dual-axis, Trust Panel; no chat UI |
| 6 | Agent writes untested or inconsistent code | Medium | Medium | Phase prompts, review per phase, CI gates, AGENTS.md |
| 7 | Band thresholds or API details wrong | Medium | Medium | Verify against official docs in Phase 1–2; record in DATA_SOURCES.md; boundary tests |
| 8 | Key leakage | Low | High | Server-side only, secret scan, `.env.example` |
| 9 | Repo bloat or extra branches | Low | High | Size and branch guard scripts, no build output |
