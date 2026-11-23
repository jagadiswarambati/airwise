# AirWise — Decision Records

Status values: **Accepted**, **Deferred**, **To Verify**. Where a decision changes `README.md` or `ARCHITECTURE.md`, the Amendment Register (end of this file) is authoritative until those files are patched. When documents disagree, precedence is: **DECISIONS.md amendments > README.md > ARCHITECTURE.md > other docs**.

---

## ADR-001 Deterministic-first decision engine
- **Context:** Safety, ranking and numbers must be reproducible and testable. LLMs hallucinate and cannot be exhaustively tested.
- **Options:** (a) LLM authors the plan; (b) LLM authors, rules filter after; (c) rules author a complete plan, LLM personalises.
- **Chosen:** (c). Pure TypeScript in `src/domain` produces a complete, valid plan before any model call.
- **Reason:** Safety never depends on a network call; the policy matrix can prove properties over the whole input space.
- **Consequences:** More upfront domain work (Phases 1A/1B). The product works with `LLM_PROVIDER=none`.
- **Risks / mitigations:** Deterministic text can feel generic → templates are written in plain, warm language and the overlay personalises when available.
- **Status:** Accepted.

## ADR-002 LLM is an overlay, not the decision-maker
- **Context:** Judges may probe "what does the AI actually do?".
- **Chosen:** The model may (1) choose the top 3 from approved candidates, (2) order actions within a slot, (3) write short explanations, (4) propose a confidence no higher than the engine's ceiling. It may not add actions, numbers, health claims, or lower a safety requirement.
- **Reason:** Real, bounded value from GenAI with zero safety authority.
- **Consequences:** Every model output passes the validator (ADR-005). Anything failing is discarded.
- **Risks:** Perceived as "thin AI" → demo shows the AI-personalised vs Standard plan badge and the household-specific wording.
- **Status:** Accepted.

## ADR-003 No free-text user input reaches the LLM
- **Context:** Free text is the main prompt-injection and unsafe-advice surface.
- **Options:** Free chat; sanitized free text; enums and engine facts only.
- **Chosen:** Enums and engine-computed facts only. "Quick Checks" replace chat and are deterministic.
- **Consequences:** No chat UI. Injection from users is structurally impossible; remaining injection vector is model output, handled by ADR-005.
- **Risks:** Less flexible UX → Quick Checks cover the four highest-value questions.
- **Status:** Accepted.

## ADR-004 Candidate-set constraint for AI actions
- **Chosen:** The prompt lists approved candidate IDs, the `mustInclude` IDs and nothing else. The validator rejects any ID not in the approved set or present in the forbidden set.
- **Reason:** Closed-world selection removes the hallucinated-action class of error.
- **Status:** Accepted.

## ADR-005 Structured JSON output and strict validation
- **Chosen:** Gemini JSON mode with the schema in README §16; Zod strict parse server-side and client-side; seven deterministic checks (README §17) plus amendments A-12 (number allow-list) and A-10.
- **Consequences:** One retry with an error summary, then deterministic fallback (ADR-006). Validator is the most heavily tested module.
- **Risks:** False rejections of good output → allow-list tested against realistic fixtures; rejection rate tracked in e2e with a mocked model.
- **Status:** Accepted.

## ADR-006 Deterministic fallback plan
- **Chosen:** The deterministic plan is always rendered first; AI output swaps in only if valid. Badge: "Standard plan" vs "AI-personalised".
- **Consequences:** No spinner blocks the plan; cold starts are invisible.
- **Status:** Accepted.

## ADR-007 Open-Meteo as primary air and weather source
- **Context:** Keyless, hourly series, forecast, global coverage, geocoding in one family. Judging-day reliability matters more than station-grade precision.
- **Options:** OpenAQ (observed, needs key, sparse), WAQI (token, licensing), Open-Meteo (modelled, keyless).
- **Chosen:** Open-Meteo Air Quality, Forecast and Geocoding, always labelled **Modelled** with the resolution disclosed. OpenAQ stays a roadmap stretch behind the provider interface.
- **Consequences:** `Measured` impact labels are effectively unused in the MVP. Coarse resolution (see `docs/DATA_SOURCES.md`) limits claims.
- **Risks:** Modelled data misses local peaks → Trust Panel, confidence ceiling at *medium*, no sub-3-hour precision claims (A-23).
- **Status:** Accepted; endpoint/limit details **To Verify** in Phase 2.

## ADR-008 LocalStorage-only household profile
- **Chosen:** Profile and settings in LocalStorage with `schemaVersion`; in-memory fallback if unavailable; export JSON and delete-all in Menu.
- **Reason:** No accounts, no server-side personal data, minimal privacy surface. The profile includes coarse health flags, so treat it as sensitive (see `docs/SECURITY_PRIVACY.md`).
- **Risks:** Data lost on clearing storage → export is offered; no promise of sync.
- **Status:** Accepted.

## ADR-009 No accounts or backend database in MVP
- **Chosen:** Stateless serverless functions with in-memory caches and best-effort rate limits only.
- **Consequences:** Rate limiting is best-effort and documented. Community is client-side demo data (ADR-010).
- **Status:** Accepted.

## ADR-010 Seeded demo data for community mode
- **Chosen:** One seeded society ("Green Meadows Apartments, 120 homes") with fixed pledge counts; user pledges are local toggles; briefing text is generated from engine data; everything labelled **Demo data**. Carpool board (CM-02) is deferred; buddy-check (CM-03) is a counts line only (A-17).
- **Reason:** Shows coordination without a backend; avoids fake-interactivity credibility risk.
- **Status:** Accepted.

## ADR-011 No DIY filtration guidance in MVP
- **Chosen:** Excluded entirely (no box-fan filters, no improvised filters). Purifier guidance only for owned purifiers (IN-05).
- **Reason:** Safety and credibility; the brief says DIY must not be primary. Roadmap with evidence review.
- **Status:** Accepted.

## ADR-012 Dual-axis exposure and emissions framework
- **Chosen:** Every action carries both axes independently, each with direction, label, confidence, note, plus `doesNotChange`. Exposure reduction never implies emissions reduction and vice versa. Details in `docs/IMPACT_METHODOLOGY.md`.
- **Status:** Accepted.

## ADR-013 PM2.5-first; AQI secondary
- **Chosen:** Decisions use PM2.5 µg/m³ through region band tables. AQI is shown as a secondary label only, using the standard the source actually provides (US AQI or European AQI from Open-Meteo). **No Indian AQI is claimed** unless computed locally from the CPCB sub-index method and labelled "computed" (A-24).
- **Risks:** Band tables assume 24-hour averages but the series is hourly → bands are applied to the **rolling mean** defined in `docs/DATA_SOURCES.md`, and the mismatch is disclosed.
- **Status:** To Verify (band breakpoints and averaging, Phase 1 gate).

## ADR-014 Severe Smog Mode and Low-Cost Protection Mode
- **Chosen:** Severe Mode: automatic when effective level = 4 or official alert, manual toggle always available; max 3 actions, mustInclude first. Low-Cost Mode: on when `budget = free`, or `budget = low` and no purifier (A-13). Both are states of one engine, not separate code paths.
- **Status:** Accepted.

## ADR-015 Vite + React + TypeScript stack
- **Options:** Next.js, Vite+React, SvelteKit.
- **Chosen:** Vite + React + strict TypeScript, Vitest, Playwright, Zod. Few dependencies; `vite-plugin-pwa` for the service worker.
- **Reason:** Fast static PWA, trivial to test, small bundle; serverless only where secrets or CORS require it.
- **Status:** Accepted.

## ADR-016 Thin serverless API
- **Chosen:** `api/air.ts`, `api/geocode.ts` (new, A-02), `api/plan.ts`, `api/health.ts`. Browser only talks same-origin, so CSP `connect-src 'self'` holds. Provider adapters are pure functions shared by the API and tests. Local dev uses a Vite middleware that mounts the same handlers (A-14).
- **Status:** Accepted.

## ADR-017 Testing and CI strategy
- **Chosen:** Pyramid in `docs/TEST_PLAN.md`: unit, exhaustive policy matrix, validator abuse, contract, golden, content lint, Playwright + axe, size/secret/branch/audit guards. CI is the merge gate (single branch, so "merge" = push).
- **Status:** Accepted.

## ADR-018 Privacy minimisation for the LLM
- **Chosen:** Send only `ageGroup`, a sensitivity category (`respiratory` | `other` | `none`), equipment booleans, budget tier, slot labels, levels and approved IDs. No coordinates, no location label, no free text, no names, no heart/pregnancy specifics. An in-app notice explains this and a toggle disables the overlay (A-10).
- **Risks:** Provider data-use terms differ between free and paid tiers → **To Verify** before enabling `gemini` in production; default `LLM_PROVIDER=none` in the repo.
- **Status:** Accepted (terms: To Verify).

## ADR-019 Combustion safety rule (new P-22)
- **Context:** "Keep windows closed" and "seal gaps" can be dangerous with unvented combustion (angithi, kerosene or gas heaters, biomass cooking without exhaust).
- **Chosen:** Add `homeHeating` to the profile (`none` | `electric` | `combustion`) and rule P-22: never suggest sealing gaps (IN-04) when `homeHeating = combustion` or cooking is biomass without exhaust; attach a fixed carbon-monoxide safety line to IN-01 for those households. Fixed text, no diagnosis.
- **Status:** Accepted.

## ADR-020 Scope discipline for Attempt 1
- **Chosen:** Attempt 1 ships all MVP capabilities with the trims in the Amendment Register (no CO₂e unless verified, no carpool board, no Hindi/Telugu, no weekly history). See `docs/BUILD_PLAN.md` Attempt 1 cut line.
- **Status:** Accepted.

---

## Amendment Register (patches to README.md / ARCHITECTURE.md)

| ID | Amendment |
|---|---|
| A-01 | Document map: add DECISIONS, TEST_PLAN, SECURITY_PRIVACY, ACCESSIBILITY, IMPACT_METHODOLOGY, DEMO_SCRIPT, SUBMISSION_CHECKLIST to README companion links and repo tree. `docs/a11y-checklist.md` and `docs/security-checklist.md` are replaced by `ACCESSIBILITY.md` and `SECURITY_PRIVACY.md`. Fix README TOC numbering (starts at §2). |
| A-02 | Geocoding and weather go through same-origin serverless (`api/geocode.ts`, weather merged into `api/air.ts` response incl. sunrise/sunset). Adapters in `src/data/providers` are pure and also imported by `api/`. Update the ESLint boundary: `api` may import `domain` and `src/data/providers`. |
| A-03 | No names anywhere. Members get generated role labels ("Child, 5–12", "Adult 65+"). The Priya narration says "the 7:30 school run", never a child's name. |
| A-04 | P-09: required PE-03 and forbidden outdoor exercise trigger at **effective level ≥ 3** for households with sensitive members. At effective level 2, PE-01 and PE-03 are high-ranked candidates, not mandatory. (Avoids double-counting the +1 sensitivity bump and forbidding outdoor play at "Satisfactory" air.) |
| A-05 | Confidence: `sample` data type tier = medium, always shown with a **Demo data** badge. The `stale` scenario's staleness still caps confidence at low. |
| A-06 | Freshness (config, To Verify): measured from `fetchedAt` and series coverage. fresh ≤ 3 h; aging > 3 h to ≤ 12 h; stale > 12 h to ≤ 48 h; none otherwise or if the series lacks the current hour. |
| A-07 | New rule **P-22** and profile field `homeHeating` (ADR-019). |
| A-08 | P-13 addition: for members with respiratory/heart conditions or pregnancy, the respirator text carries a fixed line: "Some respirators make breathing harder. Ask your clinician if unsure." |
| A-09 | UI wording: the headline level is always "for your household" (for example "Severe for your household"), never confused with the city's AQI category. |
| A-10 | LLM payload minimisation and consent notice (ADR-018). |
| A-11 | Top-3 composition precedence: urgent `mustInclude` > exposure actions > emissions action (only if a slot remains). `mustInclude` may exceed 3; Severe Mode shows the first 3 by priority with "Show full plan" for the rest. |
| A-12 | Validator number allow-list includes engine facts plus fixed tokens: `PM2.5`, `N95`, `FFP2`, age bands, clock times from the routine and forecast windows, level names. |
| A-13 | Low-Cost Mode = `budget = free` OR (`budget = low` AND no purifier). Priya (`low`, no purifier) triggers it. |
| A-14 | `npm run dev` mounts `api/` handlers through a Vite middleware; `vercel dev` is optional. |
| A-15 | CSP: no inline `style` attributes (use classes and CSS custom properties set via stylesheet); system font stack, no external fonts; relaxed CSP applies to dev server only. |
| A-16 | Hindi/Telugu UI strings are deferred out of the submission. Keep i18n-ready keys only. |
| A-17 | CM-02 carpool board deferred; CM-03 reduced to a counts line in the briefing. |
| A-18 | Sample scenarios live in `src/data/samples/` and load lazily; `public/` holds icons and manifest only. |
| A-19 | Deployment wording: with one branch there are no separate preview deployments; production deploys from `main`. Do not enable Dependabot or any bot that opens branches or PRs. Agents never create branches or push tags other than `attempt-N`. |
| A-20 | `tripsPerWeek` = round trips per week. `Mode` = `car` \| `two_wheeler` \| `auto_rickshaw` \| `bus` \| `metro_rail` \| `cycle` \| `walk`. Default carpool occupancy = 2, shown as an assumption. |
| A-21 | CO₂e (E2) is behind a `SHOW_CO2E` constant, off until emission factors are sourced and recorded in `DATA_SOURCES.md` during Phase 2/7. |
| A-22 | Time zone comes from the API (`timezone=auto`). Daylight (P-08) uses sunrise/sunset from the forecast API; if missing, MO-07 is not offered. |
| A-23 | Global CAMS domain is coarse in space and time. No claim finer than ~3-hour blocks; ventilation windows and commute comparisons are phrased as "around HH:00" and use window means. |
| A-24 | `aqi.standard` is `'US' \| 'EU'` from Open-Meteo. `'IN'` only if computed locally and labelled "computed". |
| A-25 | MO-02 (public transport) is not offered for trips involving sensitive members at effective level ≥ 3, since it implies outdoor waiting (conflicts with P-09). |
| A-26 | CI: Playwright e2e job is added in Phase 4, not Phase 0. |
| A-27 | Radar weights in `src/domain/config/radar-weights.ts`; member weight = max of age and flag weights (no summing). Documented in `docs/IMPACT_METHODOLOGY.md` §Radar. |
| A-28 | The "Try Priya's household" preset sets profile (`budget: low`) **and** scenario `severe`. |
| A-29 | Plan cache key uses a hash of the plan-input payload (levels, candidates, descriptors), never the raw profile or location. |
| A-30 | Gemini data-use terms and current model name must be verified before enabling the overlay in the deployed demo. |
| A-31 | Confidence computation: exposure = min(evidence, freshness, dataType); emissions = min(evidence, inputTier); plan ceiling = min(freshness, dataType); stale/none => low. |
| A-32 | Fallback chain: live -> cached -> none. Cache read returns the last real reading even when past TTL, with freshness recomputed from fetchedAt (aging or stale). If live and cache both fail, return freshness 'none' with pm25.now: null (so P-04 applies: cautious level 2, ventilation and walking suppressed) and offer an explicit 'Use demo data' action in the UI. Sample scenarios are used ONLY when the user explicitly selects a demo scenario. Never silently substitute sample data for live. |
| A-37 | Font self-hosting: Atkinson Hyperlegible Next (variable WOFF2, Latin subset, ~34 KB) self-hosted under `src/assets/fonts/` with `OFL.txt` (SIL Open Font License 1.1). Commissioned by the Braille Institute for low-vision legibility and distributed via Google Fonts / Fontsource. Preloaded in `index.html` with system UI fallback. |
| A-38 | Responsive Shell & Semantic Navigation: Replaces 640px/880px single columns with `.aw-container` (max-width 1200px; responsive gutters 16px/24px/32px) and 12-column grid layout for desktop. Replaces TabBar (`role="tablist"`) with semantic `<nav aria-label="Main"><ul>` with `aria-current="page"` (TopNav at >=1024px and BottomNav at <1024px). Adds hash routing (`#/today`, `#/indoor`, `#/move`, `#/impact`, `#/community`, `#/about`, `#/privacy`, `#/terms`) with focus management to screen `h1[tabindex="-1"]`, document title updates, and LiveRegion announcements. Implements accessible Dialog and Sheet primitives with focus trap, Escape key handling, and focus restoration. Header features DemoSheet trigger, active demo notice strip, and responsive Menu modal with theme toggle (System, Light, Dark syncing `data-theme`). |

