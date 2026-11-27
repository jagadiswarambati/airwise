# AirWise — Test Plan

Purpose: how safety, correctness, security, accessibility and performance are proven. Rules referenced (P-xx) are in README §15 as amended by `DECISIONS.md` (A-04, A-08, A-11, A-25, P-22).

## 1. Principles
1. The domain layer is tested without mocks; the model and network are the only things mocked.
2. Safety is proven by **invariants over the whole input space**, not hand-picked examples.
3. Every rule ID P-01…P-22 has: ≥ 1 unit test, ≥ 1 matrix invariant, and (if user-visible) ≥ 1 e2e assertion.
4. Tests are written in the same phase as the code (see BUILD_PLAN). A phase is not done with failing or skipped tests.

## 2. Unit tests (Vitest, `tests/unit`)
Band boundaries (each breakpoint ±0.1, both region profiles), effective level (each vulnerability class, cap at 4), freshness tiers (A-06 edges), trend, radar (weights, ties, member with no outdoor slot), ventilation (P-05…P-07, no qualifying window → closed), slot derivation from routines (midnight-crossing bedtimes, identical times), impact formulas E1/X1/C1 (zero, negative inputs rejected, occupancy ≤ 1), confidence min-rule, quick checks, templates (fixed texts exist and are used by PE-04, P-13, P-22).

## 3. Policy matrix (`tests/policy`)
**Dimensions** (each cell is a full `HouseholdProfile` × `AirSnapshot` pair, run through `assess → policy → buildPlan`):

| Dimension | Values |
|---|---|
| Air-quality level (via PM2.5 values placed inside each band, plus both band edges) | base 0, 1, 2, 3, 4 |
| Household vulnerability | V0 healthy adults · V1 child 5–12 · V2 under-5 · V3 65+ · V4 adult with asthma/COPD, heart or pregnancy flag · V5 mixed (child + 65+ + flagged) |
| Equipment | purifier {no, yes} × cooling {none, window AC, HVAC} (6) |
| Budget tier | free, low, flexible |
| Data freshness | fresh, aging, stale, none |
| Commute mode | car, two-wheeler, public transport, walk/cycle, none/remote |
| Cooking fuel × exhaust | {lpg, electric, biomass, other} × {exhaust yes/no} (8) |
| Schedule flexibility | canShiftTime × canWorkRemotely (4) |
| Community mode | off, on |

Full cartesian = 5×6×6×3×4×5×8×4×2 = **691,200** cases. Home heating {none, electric, combustion} is a separate targeted sub-matrix against P-22 (3 × level × cooking).
- `npm run test:policy`: pairwise (all-pairs) + boundary cases + every persona, runs in CI on every push (< 30 s).
- `npm run test:matrix`: full cartesian, sharded, run locally at Phases 1B and 8 and nightly if CI minutes allow. Failure prints the minimal failing input as JSON.

**Invariants (asserted for every case):**
1. **Unsafe never appears:** no forbidden action (P-01, P-03, P-04, P-05, P-07, P-08, P-09, P-12, P-22, A-25) is in candidates, top 3, timeline or quick checks.
2. **Mandatory always appears:** `mustInclude` ⊆ plan; urgent ones in top 3 (A-11); IN-01 at effective ≥ 3; PE-03 for sensitive members at effective ≥ 3 (A-04); PE-04 text fixed when included.
3. **Budget feasibility:** budget `free` → no action with cost ≥ low unless no free equivalent; at least 3 free actions present; never a required purchase (P-10).
4. **Equipment gating:** IN-05 only with purifier; IN-06 only with AC/HVAC; IN-07 only with exhaust; substitutes present when missing (P-11).
5. **Stale/none:** no open-window, walking, or "go outdoors" action; plan confidence ≤ low for exposure-dependent actions; banner flag true (P-03, P-04).
6. **Mode gating:** MO-03/MO-06 only for car/two-wheeler/auto; MO-02 only if transit true/unknown; MO-05 only if remote; MO-01 only if canShift and threshold met (P-16…P-18).
7. **Community:** CM-* only when community mode is on (P-21).
8. **Respirator:** PE-02 never for under-5; 5–12 only with the child-size/fit wording; carries fit and clinician lines (P-13, A-08).
9. **Completeness:** every returned action has exposure impact, emissions impact, label, confidence, assumptions and `doesNotChange`; label ∈ {Estimated, Recommended} in MVP; no number without a formula source.
10. **Determinism:** same input → identical plan (deep equal); no randomness or `Date.now()` inside domain (clock injected).
11. **Shape:** ≥ 3 candidates always; top 3 distinct; Severe Mode flag iff effective = 4 or alert; Low-Cost Mode per A-13.
12. **Combustion (P-22):** with combustion heating or biomass-no-exhaust, IN-04 never present and IN-01 carries the fixed CO line.

## 4. Validator abuse tests (`tests/validator`)
Fixtures (good, malformed, malicious, partial) covering: invalid JSON, extra keys, wrong types, unknown action ID, forbidden action ID, `mustInclude` removed or demoted, duplicate IDs, invented numbers ("reduces by 40%", "PM2.5 of 312"), allowed numbers pass (times, engine µg/m³ values, N95, FFP2, PM2.5, age bands), medication/dosing/diagnosis/cure phrases, "saves the planet", prompt-injection strings inside explanations ("ignore previous…"), HTML/script and markdown links in text (rendered as plain text; flagged), oversize strings, confidence inflation above the ceiling, empty arrays, Unicode digits and look-alike digits (full-width numerals must be treated as digits), very long input. Assertion: every bad fixture is rejected with a specific error code; every good fixture passes; retry-then-fallback path produces the deterministic plan.

## 5. Contract tests (`tests/contract`)
Recorded real responses plus mutated copies: missing hours, nulls, extra fields, renamed fields, timezone offsets, empty series, current hour absent, non-numeric values, partial weather failure, geocoding with no results or odd characters. Assert Zod parse errors map to `ProviderSchemaError`, fallback order, and no thrown exceptions reach the UI.

## 6. Golden persona tests (`tests/golden`)
Snapshots of headline, radar, top 3, timeline IDs, plan confidence for: Priya × {clear, moderate, severe, stale}, outdoor worker (severe), elderly-only (moderate), free-budget student (severe), no-data. Snapshot updates require a reviewer-visible diff note in the commit message.

## 7. Content lint (`tests/content`)
Banned phrases (diagnose, treat, cure, dose, medication, "saved the planet", "guaranteed", unsourced `%`), reading level (mean ≤ 16 words/sentence and syllable heuristic ≈ grade 6–8) over all templates and fixed texts, every template key referenced exists, every catalog action has all impact fields, no names in samples/demo data, no mention of Measured in MVP UI strings, attribution string present.

## 8. End-to-end (Playwright, tests/e2e — planned, not implemented per decision A-41)
Planned, not implemented (decision A-41).
End-to-end browser automation is not implemented; see decision A-41. Core journey logic and offline scenarios are verified via Vitest render and unit smoke tests (`tests/render/render-smoke.test.tsx`, `tests/unit/pages-smoke.test.tsx`, `tests/unit/untested-branches.test.tsx`).

## 9. Accessibility tests
Automated axe-core accessibility audits run directly within the test suite via `vitest-axe` in `tests/render/accessibility-axe.test.tsx`, asserting zero violations across About, Today (moderate and severe), Onboarding steps 1 through 5, Indoor, Move, Impact, Community, Privacy, Terms, and open modal dialogs. Token contrast pairs are verified against WCAG AA standards (4.5:1 text, 3:1 UI) in `tests/unit/tokens-contrast.test.ts`. Complete animation disabling under `prefers-reduced-motion` is asserted in `tests/unit/motion-reduction.test.ts`. Keyboard tab order (skip link, navigation, primary actions), dialog Escape handling with focus restoration, and route focus shifts to main headings are verified in `tests/unit/keyboard-navigation.test.tsx`. In addition, `npm run check:ui` verifies UI token compliance, and Chrome Lighthouse mobile audits score 100 accessibility on Today and Community and 96 on About ([`docs/evidence/lighthouse.md`](./evidence/lighthouse.md)). Playwright browser automation remains not implemented (decision A-41).

## 10. Performance tests
Bundle budget script (initial JS ≤ 150 KB gzip; fails CI). Lighthouse CI (mobile, throttled): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 (run from Phase 8, informational earlier). Matrix perf: `test:policy` < 30 s. Unit: plan build for one profile < 5 ms. Today renders < 3 s from cache (Playwright timing against a throttled profile).

## 11. Security tests
API: oversize body → 413, wrong content-type → 415, unknown fields → 400, bad enum → 400, rate limit → 429 with no stack trace, CORS only allowed origin, no body logging (spy on logger), secrets never in client bundle (grep built assets for key patterns and `GEMINI`), CSP present and `connect-src 'self'`, no `dangerouslySetInnerHTML` (lint rule), `npm audit --audit-level=high`, secret scan, localStorage contains no coordinates beyond 2 dp and no names, delete-all leaves no keys.

## 12. CI gates (all required before declaring a phase done)
`lint` · `typecheck` · `test` (unit+contract+validator+golden+content) · `test:policy` · `build` · `bundle budget` · `check:size` (< 10 MB hard, 3 MB warn) · `scan:secrets` · `check:branches` (exactly one) · `audit` · Lighthouse audit (`docs/evidence/lighthouse.md`). (Note: `test:e2e` is planned, not implemented per decision A-41).

## 13. Traceability
A table in `tests/README.md` (create in Phase 1B) maps each P-rule, each ImpactStatement field, and each error type (`DataUnavailable`, `DataStale`, `ProviderSchemaError`, `LlmUnavailable`, `LlmInvalid`, `GeolocationDenied`, `StorageUnavailable`, `RateLimited`, `ValidationError`) to its tests. A script fails CI if a rule ID has no mapped test.
