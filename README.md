# AirWise

> **Your AI-powered household clean-air decision assistant.**
> Understand your air. Protect your family. Change what you can. See the difference.

Hack2skill **PromptWars – Challenge 6** submission. This README is both the human-readable project document and the execution guide for building AirWise with Google Antigravity.

**Companion documents:** [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · [`DECISIONS.md`](./docs/DECISIONS.md) · [`BUILD_PLAN.md`](./docs/BUILD_PLAN.md) · [`DESIGN_BRIEF.md`](./docs/DESIGN_BRIEF.md) · [`DATA_SOURCES.md`](./docs/DATA_SOURCES.md) · [`ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md) · [`TEST_PLAN.md`](./docs/TEST_PLAN.md) · [`IMPACT_METHODOLOGY.md`](./IMPACT_METHODOLOGY.md) · [`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md) · [`SUBMISSION_CHECKLIST.md`](./SUBMISSION_CHECKLIST.md) · [`Lighthouse Evidence`](./docs/evidence/lighthouse.md)

**Legal and In-App Policies:** [Privacy Policy](#/privacy) · [Terms of Use](#/terms) · [About AirWise](#/about)

---

## Table of contents

1. [Challenge and chosen vertical](#2-challenge-and-chosen-vertical) · 2. [Problem](#3-problem-statement) · 3. [Deep analysis](#4-deep-problem-analysis) · 4. [Users](#5-target-users-and-personas) · 5. [Vision](#6-product-vision-and-value-proposition) · 6. [Journey](#7-core-user-journey) · 7. [Differentiators](#8-key-differentiators) · 8. [MVP scope](#9-finalized-mvp-scope) · 9. [Out of scope](#10-explicit-out-of-scope-features) · 10. [IA](#11-information-architecture) · 11. [Screens](#12-screen-by-screen-specification) · 12. [Data model](#13-data-model) · 13. [AI architecture](#14-ai-reasoning-architecture) · 14. [Policy rules](#15-deterministic-policy-rules) · 15. [Prompt strategy](#16-llm-prompt-strategy-and-output-schema) · 16. [Safety](#17-safety-validation-and-fallback-strategy) · 17. [Impact](#18-exposure-and-emissions-impact-framework) · 18. [Data sources](#19-data-sources-assumptions-and-limitations) · 19. [Security](#20-security-and-privacy-plan) · 20. [Accessibility](#21-accessibility-plan) · 21. [Performance](#22-performance-and-efficiency-plan) · 22. [Testing](#23-testing-strategy) · 23. [Errors](#24-error-handling-and-degradation-strategy) · 24. [Repo](#25-repository-structure) · 25. [Antigravity workflow](#26-development-workflow-for-antigravity) · 26. [Phases](#27-phase-by-phase-build-plan) · 27. [Prompts](#28-layer-by-layer-prompts-for-each-phase) · 28. [Acceptance](#29-acceptance-criteria-for-every-phase) · 29. [Attempts](#30-three-attempt-submission-strategy) · 30. [Demo](#31-demo-script) · 31. [Evaluation map](#32-evaluation-criteria-mapping) · 32. [Limitations](#33-known-limitations) · 33. [Roadmap](#34-future-roadmap) · 34. [Setup](#35-setup-and-run-instructions) · 35. [Env](#36-environment-variables) · 36. [License](#37-license-and-credits)

---

## 2. Challenge and chosen vertical

**Challenge:** Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution by suggesting low-emission daily routines, practical indoor air-quality guidance, sustainable alternatives tailored to location and lifestyle, and a clear explanation of the direct impact of the user's choices.

**Chosen vertical:** *Household-level environmental health and sustainability decision support.* AirWise sits between public AQI data (what is the air like?) and household behaviour (what should we do about it?).

## 3. Problem statement

Millions of households can see an AQI number but cannot turn it into decisions: *Should my asthmatic child walk to school? Should I open the window? I cannot afford a purifier. Does carpooling help my family's air, or only the city's?* Existing apps stop at the number. Generic chatbots give unverifiable, un-personalised, sometimes unsafe advice.

## 4. Deep problem analysis

| Observation | Design consequence |
|---|---|
| AQI is a label; PM2.5 is a concentration. People confuse both with "what to do". | Show PM2.5 (µg/m³) as the primary reading, AQI as secondary, and *household action levels* as the decision layer. |
| Winter smog worsens with temperature inversions, low wind and cold evenings. Exposure risk is time-dependent. | Use the hourly forecast. Find each household's highest-risk moment instead of one daily number. |
| Indoor air is often as important as outdoor air (cooking, burning, incense, dust, ventilation choices). | A full Indoor module with source control first, not just "buy a purifier". |
| Protection and pollution reduction are different things. A mask protects *you*; skipping a car trip reduces *emissions*. Apps conflate them. | **Dual-axis impact** on every action: Exposure and Emissions, scored independently. |
| Many users have no purifier, little money, rented homes, no control over the commute. | Equipment- and budget-gated candidate actions. Free-first ranking. Never require a purchase. |
| Public data is often modelled or sparse, sometimes stale. | A Trust Panel and confidence rules that visibly degrade when data is weak. |
| LLMs hallucinate numbers and can give unsafe health advice. | LLM never decides safety, never produces numbers, and chooses only from an approved action set. |
| On judging day the real air may be clean, which makes a live-only app look boring and untestable. | Built-in **Demo scenarios** (Clear, Moderate, Severe, Stale data) so every state can be reviewed in 60 seconds. |
| Free-text chat is both an injection risk and a safety risk. | No free text reaches the LLM. "Quick Checks" give deterministic answers to common questions. |

## 5. Target users and personas

**Primary: Priya, 34.** Working parent in a rented 2BHK. Child (7) with asthma. Father-in-law (68). Commutes by two-wheeler or car. LPG cooking. Window AC. No purifier. Limited budget. About 30 seconds each morning.

**Secondary:** students and office workers; elderly people; people with respiratory or cardiovascular sensitivity; outdoor workers; apartment societies, schools and neighbourhood groups (community mode).

## 6. Product vision and value proposition

AirWise converts *live air conditions + household reality* into **one prioritised, explainable daily Clean-Air Plan**. It is useful with no purifier, no car, no account and (via sample mode and deterministic plans) no AI and no network.

## 7. Core user journey

1. **Onboard (under 90 s):** five short steps, or tap **"Try Priya's household"**.
2. **Today:** one headline answers *"What should this household do today, and why?"*
3. **Act:** top 3 actions → time-ordered plan → tap any action for Why / Impact / Confidence / Assumptions.
4. **Check:** Quick Checks ("Can my child play outside?") get deterministic answers.
5. **Go deeper:** Indoor, Move, Impact tabs.
6. **Coordinate (optional):** Community mode with pledges and a shareable briefing.

## 8. Key differentiators

1. **Deterministic-first decision engine.** A complete, safe plan exists before the LLM is called. The LLM can reorder and explain, never invent or override.
2. **Household Risk Radar.** Names the most vulnerable member and the highest-risk moment ("Aarav, 7:30–8:15 am commute").
3. **Dual-Axis Impact Explainer.** Exposure and Emissions scored separately, labelled *Measured / Estimated / Recommended*, with confidence and assumptions.
4. **Trust Panel + Plan Confidence.** Source, data type (modelled vs observed), freshness, fallback status; confidence visibly drops when data is weak.
5. **Smart Ventilation Advisor + Commute Exposure Planner.** Both rule-based and explainable, using the hourly forecast.
6. **Severe Smog Mode and Low-Cost Protection Mode** as first-class states, not afterthoughts.
7. **Demo scenarios and Priya preset** so judges see every state in seconds.

## 9. Finalized MVP scope

**In scope (all built to a high standard):**

- Location-aware air briefing with Trust Panel
- 5-step onboarding, local-only profile, export and delete
- Deterministic Clean-Air Plan, with an optional LLM overlay for ordering and explanation
- Household Risk Radar
- Indoor Air module with Smart Ventilation Advisor
- Move Smarter module with Commute Exposure Planner
- Action detail with dual-axis impact on every recommendation
- Impact tab with transparent formulas
- Community mode on seeded demo data, plus a shareable text briefing
- Severe Smog Mode (auto and manual) and Low-Cost Protection Mode (automatic)
- Quick Checks (deterministic "Can I…?" answers)
- Demo scenarios, sample/offline mode, PWA basics

**Deliberate changes to the original proposal (why):**

| Change | Reason |
|---|---|
| **Free-form "Ask AirWise" chat → deterministic Quick Checks** | Removes the largest injection and unsafe-advice surface, makes answers testable, and avoids the "just a chatbot" perception. |
| **No free-text input to the LLM at all** | Strongest possible security story. Only enums and engine-computed facts are sent. |
| **LLM is an overlay on a complete deterministic plan, not the author of it** | LLM failure becomes invisible to the user. Safety never depends on the model. |
| **Composite "Decision Score" → visible rank tags (Health, Urgency, Cost, Effort)** | A single score is false precision. Tags are honest and testable. |
| **DIY box-fan filter removed from MVP** | Challenge brief says DIY filtration must not be primary. Excluding it entirely avoids a credibility attack. Roadmap item with caveats. |
| **Severe Smog Mode moved into the Today phase; policy-matrix tests moved into the domain phase** | A safe, usable product exists early. Safety is tested before any UI exists. |
| **Added Demo scenarios, Priya preset, WhatsApp-style shareable briefing** | Judge-evaluability in 60 seconds, and a real-world coordination channel for Indian families and societies. |
| **Primary data = Open-Meteo (keyless, hourly forecast); measured station data is optional** | Reliability for demo. Honesty: labelled as *modelled*, with its coarse resolution disclosed in the Trust Panel. |
| **Emissions axis leads with vehicle-km avoided; CO₂e shown only as a ranged secondary estimate** | CO₂e is a climate metric, not a local pollutant metric. Claiming local PM reductions would be indefensible. |

## 10. Explicit out-of-scope features

Accounts/authentication, databases, real-time community backend, social feed, free-text chat, routing maps, native apps, payments, push notifications, wearable/health-device integration, DIY filtration guidance, medical advice of any kind, per-person health risk scoring, multi-agent orchestration.

## 11. Information architecture

```
AirWise (PWA, bottom tabs, 5 items)
├─ Today        Air briefing · Risk Radar · Top 3 · Timeline · Quick Checks · Trust Panel
├─ Indoor       Ventilation Advisor · Source control · Cleaner room · Cooking · Equipment steps
├─ Move         Commute Exposure Planner · Transport options · Trip combining
├─ Impact       Per-action dual-axis cards · Weekly tally · Formulas
├─ Community    Society briefing · Pledges · Carpool board (concept) · Buddy check · Share
└─ ⚙ Menu       Profile edit · Export/Delete · Demo scenarios · Severe Mode toggle · About/Sources
```

## 12. Screen-by-screen specification

**Onboarding (5 steps, one question group per screen, progress shown, skippable fields where safe):**
1. *Where?* Search a city or use device location (rounded to ~1 km). Manual entry always available.
2. *Who?* Household members: age group (under 5 / 5–12 / 13–17 / 18–64 / 65+) and flags (asthma/COPD, heart condition, pregnancy, other sensitivity). No names.
3. *Home:* housing (owned/rented, apartment/house), cooking fuel, equipment (purifier, window AC, HVAC, kitchen exhaust/chimney), budget tier (free-only / low / flexible).
4. *Travel:* commute mode(s), approximate one-way km, trips/week, flexibility (can shift time? can work remotely? transit available?), outdoor worker flag.
5. *Day:* wake, leave, return, cooking, bedtime windows (pre-filled defaults).
Plus a one-tap **"Try Priya's household"** preset.

**Today:**
- *Air briefing card:* PM2.5 µg/m³ (primary), AQI (secondary, labelled with standard), 6-hour trend arrow, "next 6 h" outlook, timestamp, data type badge (*Modelled* / *Observed* / *Sample*), freshness chip.
- *Risk headline:* plain-language level (Clear / Watch / Caution / Protect / Severe) for **this household**, in words + icon + colour.
- *Risk Radar:* most vulnerable member and highest-risk moment.
- *Top 3 actions:* each with Why (one line), tags (Exposure/Emissions), cost tag, confidence dot.
- *Timeline:* six slots (early morning, commute out, daytime, commute back, evening, night), each with 1–3 actions.
- *Quick Checks:* chips: "Can my child play outside?", "Should I open a window?", "Can I walk to school?", "Should I run my purifier?"
- *Trust Panel (expandable):* source, data type, freshness, fallback status, uncertainty note, plan source (*AI-personalised* / *Standard plan*), plan confidence + reason.

**Action detail (sheet):** What to do · Why now · What it changes (Exposure: ↓ / – ; Emissions: ↓ / –, each with label, magnitude only if defensible, confidence) · What it does *not* change · Assumptions · Cost/effort.

**Indoor:** Ventilation Advisor verdict (*Keep closed / Brief window at HH:MM / Ventilate*) with reason; cleaner-room setup; source control; cooking guidance by fuel and equipment; equipment-specific steps (purifier, window AC, HVAC, none).

**Move:** commute window comparison (forecast mean PM2.5 for your usual window vs. alternatives, shown only if the difference is meaningful); transport options filtered by profile; trip combining; walk/cycle shown as *not suitable today* when rules say so, with reason.

**Impact:** per-action dual-axis cards; "this week if you do these" tally using formulas in §18; every number links to its formula and assumptions.

**Community:** seeded society ("Green Meadows Apartments, 120 homes"): shared daily briefing, pledges (no-burning, carpool), carpool board concept, buddy-check list for vulnerable residents (counts only), aggregate **estimated** vehicle-km avoided, **Copy briefing** (plain text for WhatsApp/notice board). Clearly labelled *Demo data*.

**Severe Smog Mode:** single column, ≥20 px base text, maximum contrast, three actions maximum, no charts, one primary button ("Show full plan"). Auto when effective level = Severe or an official alert flag is present; manual toggle always available.

## 13. Data model

All types are defined once in `src/domain/types.ts` and validated at boundaries with Zod.

```ts
type AgeGroup = 'u5' | '5-12' | '13-17' | '18-64' | '65+';
type Flag = 'asthma_copd' | 'heart' | 'pregnancy' | 'other_sensitivity';
interface Member { id: string; ageGroup: AgeGroup; flags: Flag[]; }          // no names

interface HouseholdProfile {
  schemaVersion: 1;
  location: { label: string; lat: number; lon: number; country?: string };   // lat/lon rounded to 2 dp
  members: Member[];
  housing: { tenure: 'own'|'rent'; type: 'apartment'|'house' };
  cooking: { fuel: 'lpg'|'electric'|'biomass'|'other'; hasExhaust: boolean };
  equipment: { purifier: boolean; windowAC: boolean; hvac: boolean };
  budget: 'free' | 'low' | 'flexible';
  travel: { modes: Mode[]; oneWayKm: number; tripsPerWeek: number;
            canShiftTime: boolean; canWorkRemotely: boolean; transitAvailable: boolean|'unknown';
            outdoorWorker: boolean };
  routine: { wake: HHMM; leave: HHMM; returnHome: HHMM; cooking: HHMM[]; bed: HHMM };
}

interface AirSnapshot {
  pm25: { now: number|null; hourly: HourlyPoint[] };      // µg/m³
  aqi?: { value: number; standard: 'US'|'IN' };
  trend: 'rising'|'steady'|'falling'|'unknown';
  observedAt: ISODate; fetchedAt: ISODate;
  source: { id: string; name: string; dataType: 'modelled'|'observed'|'sample'; resolutionNote: string };
  freshness: 'fresh'|'aging'|'stale'|'none';
  officialAlert?: { active: boolean; text?: string };
}

interface RiskAssessment {
  baseLevel: 0|1|2|3|4; effectiveLevel: 0|1|2|3|4;       // Clear..Severe
  radar: { memberId: string; slotId: SlotId; reasonCode: string };
  windows: SlotRisk[];                                       // per-slot forecast level
  ventilation: { verdict: 'closed'|'brief'|'open'; atHour?: number; reasonCode: string };
  flags: { severeMode: boolean; lowCostMode: boolean; staleData: boolean; noData: boolean };
}

interface Action {                    // catalog entry, static data
  id: string; category: 'indoor'|'personal'|'mobility'|'community';
  requires: Requirement[]; forbiddenAt?: LevelRange; minLevel?: number;
  cost: 'free'|'low'|'medium'|'high'; effort: 1|2|3;
  impact: ImpactSpec; evidence: 'high'|'medium'|'low'; templateKey: string;
}

interface ImpactStatement {
  exposure:  { direction: 'down'|'none'|'conditional'; magnitude?: string; label: 'Measured'|'Estimated'|'Recommended'; confidence: Conf; note: string };
  emissions: { direction: 'down'|'none'|'conditional'; value?: { vkm: number; co2eKg?: [number, number] }; label: ...; confidence: Conf; note: string };
  assumptions: string[]; doesNotChange: string;
}

interface Plan {
  source: 'ai'|'deterministic'; generatedAt: ISODate; headline: string;
  topActionIds: [string, string, string]; timeline: { slotId: SlotId; actionIds: string[]; note?: string }[];
  explanations: Record<string, string>; planConfidence: Conf; confidenceReason: string; assumptions: string[];
}
```

## 14. AI reasoning architecture

```
Profile + AirSnapshot ──► Normalize/validate (Zod)
                      ──► Risk engine (levels, radar, slot risks, ventilation)      [deterministic]
                      ──► Policy engine (filter catalog → approved candidates,
                                         mustInclude set, forbidden set)             [deterministic]
                      ──► Plan builder (complete valid plan, ranked by rules)        [deterministic]
                      ──► LLM overlay (select top 3 from candidates, reorder within
                                       slot, write explanations, assumptions)        [GenAI, optional]
                      ──► Validator (schema, IDs, mustInclude, forbidden, numbers,
                                     medical phrases, length, reading level)         [deterministic]
                      ──► Render  (on any failure → deterministic plan + "Standard plan" badge)
```

**Ranking (deterministic):** `priority = healthUrgency × feasibility × costFit`, shown to users as tags, not as a score. Health urgency comes from effective level and the vulnerable member. Feasibility comes from equipment, schedule flexibility and effort. Cost fit comes from the budget tier. Free-first when the budget is `free`, or when Low-Cost Mode is on.

**Where the AI genuinely adds value:** choosing the three actions that best fit *this* day's story from many valid candidates, ordering within slots around the real routine, and writing short, warm, personalised "why" text that references the household's situation (child's school run, evening cooking). The plan is useful without it, better with it.

## 15. Deterministic policy rules

Each rule has an ID. Every ID has at least one unit test and appears in the policy matrix.

| ID | Rule |
|---|---|
| P-01 | **Severe override.** Effective level 4 or an active official alert → Severe Mode on; outdoor exercise forbidden; outdoor trips only if essential. |
| P-02 | **Effective level** = base level from PM2.5 bands (config, region-specific) +1 if any sensitive member (under 5, 5–12, 65+, or any flag), capped at 4. Outdoor-worker flag changes exposure emphasis, not the level. |
| P-03 | **Stale data** (freshness *stale*) → no "go outdoors/open window/walk" recommendations; confidence capped at *low* for exposure-dependent actions; banner shown. |
| P-04 | **No data** → assume level 2 (Caution) as a conservative default, suppress ventilation and walking, show "using cautious defaults". |
| P-05 | **Window opening** (IN-02) allowed only if effective level ≤ 1 and data fresh. Never automatic. |
| P-06 | **Brief ventilation** at effective level 2: only in the forecast's lowest window, and only if that window is level ≤ 1; short duration; with a reason. |
| P-07 | Effective level ≥ 3 → IN-02 forbidden; IN-01 required. |
| P-08 | **Walking/cycling** (MO-07) only if effective level ≤ 1, daylight, data fresh. Otherwise shown as *not suitable today*. |
| P-09 | **Sensitive members:** at effective level ≥ 2, PE-03 (indoor play/exercise) required; outdoor exercise and prolonged outdoor waiting forbidden. |
| P-10 | **Budget:** `free` excludes cost ≥ low; `low` excludes cost ≥ medium; unless no free equivalent exists. Never require a purchase. |
| P-11 | **Equipment gating:** IN-05 requires purifier; IN-06 requires window AC or HVAC; IN-07 requires exhaust/chimney. If missing, IN-08 (low-smoke cooking) and IN-03/IN-04 substitute. |
| P-12 | **Cooking:** fuel-specific guidance. Biomass/kerosene raises priority of cooking actions. With no exhaust at high outdoor levels, favour shorter cooking, lids and batch cooking, children out of the kitchen; brief ventilation only under P-05/P-06. |
| P-13 | **Respirators (PE-02):** essential outdoor trips, effective level ≥ 2, adults and teens. Wording requires proper fit and a rating such as N95/FFP2. Under-5: no masks, limit time outdoors. Ages 5–12: only a child-sized respirator that fits, otherwise limit time outdoors. Never presented as a substitute for staying indoors. |
| P-14 | **Medical boundary.** No diagnosis, medication, dosing or treatment. PE-04 uses fixed text: follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe. |
| P-15 | **Emissions actions are level-independent.** Carpool, trip-combining and engine-off are offered at any level. Their exposure statement is conditional and stated honestly. Public transport at high levels carries a waiting-outdoors caveat and is paired with PE-02 where appropriate. |
| P-16 | **Commute shift (MO-01)** only if `canShiftTime` and the forecast difference meets the threshold (≥ 5 µg/m³ and ≥ 15%). Otherwise "no meaningful difference". |
| P-17 | **Remote work (MO-05)** only if `canWorkRemotely`. |
| P-18 | **Mode gating:** MO-03/MO-06 only if the user drives or rides; MO-02 only if `transitAvailable` is true or unknown (then phrased "if available"). |
| P-19 | **mustInclude:** safety-critical actions for the level (e.g. IN-01 at level ≥ 3, PE-03 under P-09) cannot be dropped, demoted out of the top 3 when urgent, or reworded away by the LLM. |
| P-20 | **Outdoor workers:** timing shifts and respirator guidance emphasised; never assumes the worker controls their schedule. |
| P-21 | Community actions appear only in Community mode (and a single prompt on Today if a community is joined). |

**Bands (defaults, in `src/domain/config/bands.ts`; verify and cite in `docs/DATA_SOURCES.md` at build time).** India default aligned with CPCB PM2.5 categories (≤30 Good; 31–60 Satisfactory; 61–90 Moderate; 91–120 Poor; ≥121 Very Poor/Severe). Mapped to levels 0–4 (Clear, Watch, Caution, Protect, Severe). A US-EPA-aligned config is selected outside India. WHO 2021 guideline values are cited in the Trust Panel's "about this reading".

## 16. LLM prompt strategy and output schema

- **Provider:** behind an interface. Default Gemini via the serverless API; model name from env. `LLM_PROVIDER=none` disables it.
- **Input to the model (JSON only):** effective level, trend, slot risks (levels, not coordinates), radar result, approved candidate action IDs with short catalog descriptions, `mustInclude` IDs, budget tier, abstract household descriptors (age groups, flags, equipment booleans, routine slot labels). **No coordinates, no free text, no names.**
- **System prompt rules:** choose only from candidate IDs; do not invent actions or numbers; do not give diagnoses, medication or treatment advice; keep each explanation under 200 characters; plain language (grade 6–8); reference household context but not identities; output JSON only.
- **Prompts live in** `src/ai/prompts/*.ts` with a `PROMPT_VERSION` constant that is part of the plan cache key.

```json
{
  "schemaVersion": 1,
  "headline": "string ≤ 90 chars",
  "topActionIds": ["id", "id", "id"],
  "timeline": [{ "slotId": "commute-out", "actionIds": ["id"], "note": "string ≤ 160 chars" }],
  "explanations": { "<actionId>": "string ≤ 200 chars" },
  "assumptions": ["string ≤ 140 chars"],
  "planConfidence": "high | medium | low",
  "confidenceReason": "string ≤ 160 chars"
}
```

## 17. Safety, validation, and fallback strategy

**Validator checks (all deterministic, all unit-tested):**
1. JSON parses and matches the Zod schema (strict, no extra keys).
2. Every action ID ∈ approved candidates; none ∈ forbidden set.
3. `mustInclude` ⊆ plan, and urgent ones are in the top 3 (P-19).
4. Numbers: any digit sequence in generated text must be in an allow-list built from engine facts (times, µg/m³ values, level names). Otherwise reject.
5. Banned-phrase scan: diagnosis, medication, dosing, cure and "saves the planet"-style claims.
6. Length limits and a simple reading-level heuristic (words per sentence).
7. `planConfidence` ≤ the engine's confidence ceiling (the model cannot raise it).

**On failure:** retry once with the error summary, then fall back to the deterministic plan, shown with a *Standard plan* badge. The fallback is never an error screen.

## 18. Exposure and emissions impact framework

**Two independent axes, always both shown.**

| Axis | Question | Example |
|---|---|---|
| **Exposure** | Does this reduce the pollution *people in this household breathe*? | Closing windows at high outdoor PM2.5, cleaner room, shifting commute |
| **Emissions** | Does this reduce the pollution *this household causes*? | Skipping or sharing a motor-vehicle trip, no burning, engine-off |

**Labels**

| Label | Meaning |
|---|---|
| **Measured** | Derived from an observed measurement the user supplied or an observed station reading. (Rare in MVP.) |
| **Estimated** | Computed by a documented formula from stated inputs and shown assumptions. |
| **Recommended** | Qualitative guidance consistent with public-health advice. No number is claimed. |

**Formulas (all in `src/domain/impact.ts`, all shown in-app)**

- **E1 – Vehicle-km avoided (Estimated).** `vkm = oneWayKm × 2 × tripsAvoidedPerWeek × (1 − 1/occupancy)` for carpooling; `oneWayKm × 2 × tripsAvoided` for a skipped trip. Inputs come from the user's profile.
- **E2 – CO₂e (secondary, Estimated, ranged).** `vkm × [factorLow, factorHigh]` by vehicle class, from `docs/DATA_SOURCES.md`. Shown as a range with the note: *"Climate impact, not local air quality."* No local PM or NOx totals are claimed.
- **X1 – Commute window forecast difference (Estimated).** `Δ = mean(PM2.5[usual window]) − mean(PM2.5[alternative window])` from the modelled hourly forecast. Shown only when the P-16 threshold is met. Confidence ≤ medium (modelled, coarse).
- **X2 – Qualitative exposure effects (Recommended).** Ventilation, cleaner room, purifier use, sealing, masks and cooking changes are given direction and conditions, not percentages.
- **C1 – Community aggregate (Estimated, demo data).** `Σ E1` across seeded pledges. Exposure is never summed across people.

**Confidence rule:** `confidence = min(evidenceTier, dataFreshnessTier, dataTypeTier)`, where freshness *fresh = high, aging = medium, stale/none = low*, and data type *observed = high, modelled = medium, sample = demo (labelled)*. Explanations also state what the action does **not** change (e.g. "A respirator lowers your exposure; it does not reduce emissions").

**Banned copy:** "You saved the planet", any unsourced percentage, any promised health outcome.

## 19. Data sources, assumptions, and limitations

| Need | Source | Notes |
|---|---|---|
| PM2.5, AQI, hourly (past and forecast) | **Open-Meteo Air Quality API** (CAMS-based model) | Keyless. **Modelled**, coarse resolution, can miss local peaks. Attribution required. |
| Weather (wind, temperature, humidity) | **Open-Meteo Forecast API** | Used for context and inversion-risk hint (cold, calm evenings). |
| Geocoding | **Open-Meteo Geocoding API** | City search, offline fallback list of ~20 major cities. |
| Optional observed data | OpenAQ (needs key) | Stretch goal behind the provider interface. |
| Sample data | Bundled JSON, four scenarios | Always available. Labelled *Sample*. |

**Assumptions:** user-reported profile is accurate; PM2.5 is the dominant decision variable (other pollutants are not modelled); one hourly series represents the household's location; default routine times apply if not edited; cost tiers are indicative. Endpoints, parameters and band thresholds are verified against current official documentation in Phase 1–2 and recorded in `docs/DATA_SOURCES.md` with access dates.

## 20. Security and privacy plan

- **Secrets:** server-side only; `.env.example` committed, `.env*` ignored; CI secret-pattern scan.
- **Input validation:** Zod on every API boundary; body size limit; allow-listed enum values.
- **No free text to LLM:** structurally eliminates prompt-injection from users. Model output is schema-validated and rendered as text (never `dangerouslySetInnerHTML`).
- **Headers:** strict CSP (`default-src 'self'`, `connect-src 'self'`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (geolocation only), set via `vercel.json`.
- **Rate limiting:** per-IP token bucket on `/api/plan` and `/api/air` (best-effort on serverless; documented).
- **Privacy by design:** no accounts, no names, no analytics. Profile stays in LocalStorage. Location rounded to 2 dp. LLM receives no coordinates and no identifiers. Export (JSON) and delete (all local data) in the menu. Plain-language privacy note shown in onboarding.
- **Supply chain:** `npm audit --audit-level=high` in CI, lockfile committed, minimal dependencies.
- **Responsible output:** medical boundary (P-14), "informational, not medical advice" footer, emergency line in PE-04.

## 21. Accessibility plan

Target **WCAG 2.2 AA**. Semantic landmarks and heading order; keyboard-operable everywhere with visible focus; risk level always conveyed by **text + icon + colour**; touch targets ≥ 44 px; text scales to 200%; `prefers-reduced-motion` and `prefers-color-scheme` honoured; live region announces plan updates; every card has a screen-reader summary; forms have labels, errors and descriptions; plain language (grade 6–8) enforced by a unit test over templates; i18n-ready strings (English at launch, Hindi/Telugu UI strings optional in Phase 9). Severe Smog Mode doubles as a high-legibility mode. Automated axe checks in Playwright, plus a manual keyboard and screen-reader pass in Phase 8.

## 22. Performance and efficiency plan

Budgets: initial JS ≤ 150 KB gzip; Lighthouse Performance ≥ 90 and Accessibility ≥ 95 (mobile, throttled); Today renders in < 3 s from cache. No chart libraries (inline SVG sparkline). Code-split by tab. Air data cached (client 15 min, server 10 min). Plans cached by `hash(profile) + hourBucket + dataSignature + PROMPT_VERSION`, so identical inputs never trigger a second LLM call. One LLM call per plan, small structured prompt. PWA service worker caches the shell and last-known data (clearly timestamped). Repo target < 3 MB (limit 10 MB): no binaries beyond tiny SVG/PNG icons, no build output, CI size guard.

## 23. Testing strategy

| Layer | Tooling | What |
|---|---|---|
| Unit | Vitest | Band boundaries, effective level, radar, ventilation, impact formulas, confidence, freshness. |
| **Policy matrix** | Vitest, table-driven | Enumerate level × persona × equipment × budget × freshness; assert forbidden actions never appear and mustInclude always do. Each rule P-01…P-21 covered. |
| Validator abuse | Vitest | Hallucinated IDs, forbidden actions, medical phrases, invented numbers, oversized strings, confidence inflation, extra keys, malformed JSON. |
| Contract | Vitest + fixtures | Provider response parsing, schema drift, missing hours, nulls, partial failures. |
| Golden personas | Vitest snapshots | Priya (4 scenarios), outdoor worker, elderly-only, free-budget student. |
| Content lint | Vitest | Banned phrases, reading level, every action has all impact fields. |
| E2E | Playwright | Onboard (or Priya preset) → Today → action detail → Severe scenario → offline/sample. |
| Accessibility | axe-core via Playwright | Zero serious/critical violations on every screen and in Severe Mode. |
| CI | GitHub Actions | lint, typecheck, unit, build, e2e, audit, size guard, secret scan. |

## 24. Error-handling and degradation strategy

| Failure | Behaviour |
|---|---|
| Primary air provider fails | Last cached reading (recomputed freshness: aging/stale) → honest offline fallback (freshness 'none', cautious Level 2 defaults, "Use demo data" action). Never silently substitute sample data. |
| Weather fails | Plan proceeds without inversion hint; noted in Trust Panel. |
| LLM times out/invalid/blocked | One retry, then deterministic plan with *Standard plan* badge. |
| Geolocation denied/unavailable | Manual city search, offline city list. |
| Offline | PWA shell + cached data + deterministic plan. Banner shows data age. |
| LocalStorage unavailable/corrupt | In-memory session profile, one-line notice, schema migration or safe reset. |
| Unknown exception | Error boundary per tab with recovery action. Never a blank screen. |

## 25. Repository structure

```
airwise/
├─ README.md  ARCHITECTURE.md  DECISIONS.md  AGENTS.md  LICENSE  .env.example  .gitignore
├─ api/                    # Vercel serverless: air.ts, plan.ts, health.ts, _lib/
├─ docs/                   # BUILD_PLAN.md, ANTIGRAVITY_PROMPTS.md, DATA_SOURCES.md, a11y-checklist.md, security-checklist.md
├─ public/                 # manifest, small icons, sample data (≤ 200 KB total)
├─ scripts/                # check-size.mjs, check-branches.mjs, scan-secrets.mjs
├─ src/
│  ├─ domain/              # pure TS: types, config/, bands, risk, radar, ventilation, policy, catalog/, plan-builder, impact, confidence, quickchecks
│  ├─ data/                # providers/, fallback-chain, cache, samples/, trust
│  ├─ ai/                  # client, prompts/, schema, validator, overlay, plan-cache
│  ├─ state/               # profile store, settings, scenario
│  ├─ ui/                  # components/, screens/ (today, indoor, move, impact, community, onboarding), severe-mode
│  ├─ i18n/                # en.json, keys
│  └─ styles/              # tokens.css, base.css
├─ tests/                  # unit/, policy/, validator/, contract/, golden/, e2e/
└─ .github/workflows/ci.yml
```

## 26. Development workflow for Antigravity

1. Save the **Shared Context Block** from `docs/ANTIGRAVITY_PROMPTS.md` as `AGENTS.md` in the repo root (and, if your Antigravity version supports workspace rules, as a rule too).
2. Run **one phase at a time**. Paste that phase's prompt. Require the agent to produce a plan first, then implement.
3. The agent must run lint, typecheck and tests, and report results, before declaring done.
4. **You review the diff and the acceptance checklist.** Do not start the next phase until the current one passes and is committed and pushed.
5. One branch (`main`). Small, meaningful commits (conventional style). Push after every phase and, ideally, after each meaningful sub-step.
6. After each phase, tick the checklist in `docs/BUILD_PLAN.md`.
7. Ask the agent to open the running app and test it in the browser at the end of Phases 4, 6, 7 and 8.

## 27. Phase-by-phase build plan

Full tasks, files, tests, manual checks, commit messages and Definition of Done live in [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md).

| # | Phase | Outcome | Gate |
|---|---|---|---|
| 0 | Foundations | Repo, CI, tokens, docs skeleton, size guard | CI green |
| 1 | Domain core | All rules, impact, radar, ventilation, matrix tests | Policy matrix green |
| 2 | Data layer | Providers, fallback chain, cache, sample scenarios, Trust model | Contract tests green |
| 3 | Onboarding and profile | 5 steps, Priya preset, export/delete | a11y checks green |
| 4 | Today + deterministic plan | **First usable product**, Severe Mode, Quick Checks, action detail | Works offline with no AI |
| 5 | AI overlay | LLM client, schema, validator, retry, fallback, cache | Abuse tests green |
| 6 | Indoor + Move | Ventilation Advisor, Commute Planner, Low-Cost Mode surfaced | e2e smoke green |
| 7 | Impact + Community | Impact tab, formulas, seeded community, share briefing | **Attempt 1 gate** |
| 8 | Hardening | Matrix expansion, e2e, axe, perf, security checklist | **Attempt 2 gate** |
| 9 | Demo + submission | Demo walkthrough, README final, size/branch checks | **Attempt 3 gate** |

## 28. Layer-by-layer prompts for each phase

Self-contained Antigravity prompts for Phases 0–9 are in [`docs/ANTIGRAVITY_PROMPTS.md`](./docs/ANTIGRAVITY_PROMPTS.md). Each is incremental and assumes the previous phase is complete and passing.

## 29. Acceptance criteria for every phase

Each phase has numbered, checkable criteria in [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md). **Global product acceptance** (all must be true for Attempt 3):

- [ ] Priya preset → Today in ≤ 3 taps and ≤ 10 s.
- [ ] All four demo scenarios render correct level, plan and Trust Panel.
- [ ] 100% of actions show Why, Exposure, Emissions, label, confidence and assumptions.
- [ ] No action violates any rule P-01…P-21 anywhere in the policy matrix.
- [ ] App is fully usable with `LLM_PROVIDER=none` and with the network off (sample/cached).
- [ ] axe: zero serious/critical issues; keyboard-only flow completes the journey.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- [ ] CI green: lint, types, unit, e2e, audit, size, secret scan.
- [ ] Repo < 10 MB (target < 3 MB), public, single branch, regular commit history.
- [ ] README explains vertical, approach, logic, how it works, assumptions.

## 30. Three-attempt submission strategy

| Attempt | Submit when | Contains | Rule |
|---|---|---|---|
| **1: Complete and safe** | After Phase 7 (Gate A) | Every mandatory capability, deterministic plan, AI overlay with fallback, Severe/Low-Cost modes, community on seeded data, core + matrix tests, README | Must be demoable end-to-end on a phone. Not a prototype. |
| **2: Evidence of quality** | After Phase 8 (Gate B) | Expanded tests, e2e, axe, Lighthouse, security checklist, bug fixes from your own review of Attempt 1 feedback | Strict improvement only. Re-run full suite. |
| **3: Polish and de-risk** | After Phase 9 (Gate C) | Copy and reading-level pass, demo assets, final README, Hindi/Telugu UI strings only if all gates are green, freeze | No new features. If in doubt, don't ship the change. |

Always keep a tagged known-good commit (`git tag attempt-N`) before submitting. Tags are not branches.

## 31. Demo script (90 seconds)

1. **0:00** Open the app → tap **Try Priya's household**. *"Priya has 30 seconds, an asthmatic child and no purifier."*
2. **0:10** Today shows the **Severe** demo scenario. *Moment 1 – Risk Radar:* "Aarav's 7:30 school run is today's biggest risk." Three actions. One sentence of why each.
3. **0:30** Tap an action (respirator for essential trips). *Moment 2 – Dual-axis card:* "Lowers your exposure ✔. Does not reduce emissions ✘." Label *Recommended*, confidence, assumptions.
4. **0:45** Indoor tab: Ventilation Advisor says **Keep windows closed**, with the reason; low-cost cooking steps because there is no exhaust.
5. **0:55** Move tab: carpool on two days → "≈ N vehicle-km avoided per week (Estimated)" with formula; walking shown as *not suitable today*.
6. **1:05** Switch scenario to **Stale data**. *Moment 3 – Trust Panel:* plan confidence drops, ventilation and walking are suppressed, banner explains why.
7. **1:15** Community → copy the society briefing. *"Individual choices, neighbourhood coordination."*
8. **1:25** Close with: deterministic safety rules, AI only for personalisation, honest impact.

## 32. Evaluation-criteria mapping & Measured Verification Metrics

| Criterion | Target | Measured in this Session | Verification Command |
|---|---|---|---|
| **Repository Size** | < 3 MB (Warning: 3 MB, Limit: 10 MB) | **2.57 MB** (26,99,000 bytes) [including `.git`] | `npm run check:size` |
| **Unit & Integration Tests** | 100% passing across domain, data, shell, screens | **416 passed** across **56 test files** | `npm test` |
| **Policy Matrix Invariants** | P-01 to P-22 zero violations + mutations | **9 passed** across **2 test files** | `npm run test:policy` |
| **Timezone Invariance** | Zero shifts across global runtime timezones | **PASS** across `UTC`, `Asia/Kolkata`, `America/Los_Angeles` | `npm run test:tz` |
| **Design System & UI Guard** | Zero undefined tokens, zero literal hex colors in components, zero non-token inline styles, zero emoji in UI, zero uppercase transforms, zero disallowed alerts | **0 errors** (all rules compliant) | `npm run check:ui` |
| **Documentation Link Integrity** | Zero broken relative links across README and docs/*.md | **PASS** (all links resolve) | `npm run check:links` |
| **Secret Leakage Guard** | Zero committed credentials or keys | **PASS** (0 secrets detected) | `npm run scan:secrets` |
| **Single-Branch Guard** | Exactly `main` only on origin remote | **PASS** (remote origin has only `main`) | `npm run check:branches` |
| **Production Build Size** | Clean bundle, optimized code splitting | Entry JS: **412.93 kB** (124.15 kB gzip); CSS: **75.39 kB** (11.40 kB gzip); Font: **34.00 kB** WOFF2 | `npm run build` |
| **Mobile Lighthouse Scores** | Score >= 90 across all categories | Performance: **96–98**, Accessibility: **100**, Best Practices: **100**, SEO: **100** | See [`docs/evidence/lighthouse.md`](./docs/evidence/lighthouse.md) |

## 33. Known limitations

Air data is modelled and coarse by default; local peaks may be missed. Only PM2.5 drives decisions. Indoor air quality is not measured. Impact magnitudes are intentionally limited. Community mode uses seeded demo data. Not medical advice. English-only generated text. Band thresholds are region defaults and may differ from local advisories. Rate limiting is best-effort on serverless.

## 34. Future roadmap

Observed station data via OpenAQ and local sensors; user-entered monitor readings (enabling *Measured* labels); Hindi/Telugu and other languages; school-run mode for schools; real community backend with privacy-preserving aggregation; clean-cooking switch planner; cautious guidance for filtration alternatives with evidence review; push alerts; clinician-reviewed content packs.

## 35. Setup and run instructions

```bash
git clone https://github.com/jagadiswarambati/airwise.git && cd airwise
npm ci
cp .env.example .env          # add GEMINI_API_KEY (optional; app runs completely offline without it)
npm run dev                   # Start Vite local development server
```

### Complete Test & Verification Commands
```bash
npm run lint                  # Run ESLint (0 errors, 0 warnings)
npm run typecheck             # TypeScript compiler validation (tsc --noEmit)
npm test                      # Run all 56 Vitest test suites (416 tests)
npm run test:policy           # Run policy matrix invariants (P-01 to P-22) and mutation tests
npm run test:tz               # Run multi-timezone slot invariance tests
npm run build                 # Build production bundles with tree shaking
npm run check:ui              # Enforce UI design system, token parity, and zero emoji
npm run check:links           # Verify all documentation relative links resolve
npm run check:size            # Enforce repository size budget (< 3 MB target, 10 MB limit)
npm run scan:secrets          # Scan repository for accidentally committed secrets
npm run check:branches        # Guard against unintended git branches on origin
```

Demo without keys or network: open the menu → **Demo scenarios**, or set `LLM_PROVIDER=none`.

## 36. Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `LLM_PROVIDER` | `gemini` or `none` | `none` |
| `GEMINI_API_KEY` | Server-side only | – |
| `GEMINI_MODEL` | Model name (verify current at build time) | set in `.env.example` |
| `ALLOWED_ORIGIN` | CORS origin for API | same-origin |
| `RATE_LIMIT_PER_MIN` | Per-IP limit on `/api/*` | `20` |
| `AIR_PRIMARY` | `open-meteo` | `open-meteo` |
| `AIR_CACHE_TTL_S` | Server cache TTL | `600` |
| `VITE_DEFAULT_SCENARIO` | `live`, `clear`, `moderate`, `severe`, `stale` | `live` |

No secret is ever prefixed `VITE_`.

## 37. License and credits

Source code licence: MIT. Air-quality and weather data by [Open-Meteo.com](https://open-meteo.com/) (attribution displayed in-app, per their terms), air-quality data derived from Copernicus Atmosphere Monitoring Service information. Health guidance informed by WHO air-quality guidelines and public-health advisories; content is informational and not medical advice. Built for Hack2skill PromptWars – Challenge 6.

---

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
| 10 | Accessibility regressions late | Medium | Medium | axe in CI from Phase 3, manual pass in Phase 8 |
| 11 | Serverless cold start / rate limit hurts demo | Medium | Medium | Deterministic plan renders first; AI overlay swaps in; preload on launch |
| 12 | Health advice challenged | Low | High | Medical boundary, fixed text, respirator fit caveats, informational disclaimer |
