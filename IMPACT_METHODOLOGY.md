# AirWise — Impact Methodology

Purpose: the only authority for what AirWise may say about the effect of an action, which numbers it may show, and how those numbers are computed. `src/domain/impact.ts` implements this document; the UI renders only what the engine returns. Rules referenced (P-xx) are in README §15; amendments (A-xx) are in `DECISIONS.md`.

## 1. Principles

1. **Two independent axes, always both shown.** *Exposure* (what people in this household breathe) and *Emissions* (what this household causes). Neither implies the other.
2. **No number without a formula.** A number appears only if it comes from a formula in §5 with validated inputs and visible assumptions. Otherwise the statement is qualitative.
3. **No outcome promises.** AirWise never states or implies a health outcome, a percentage reduction, or a planetary benefit.
4. **Honest about uncertainty.** Modelled data, self-reported inputs and coarse resolution are disclosed in the statement itself, not only in a footer.
5. **Say what it does not change.** Every action carries a `doesNotChange` sentence.

## 2. The two axes

| Axis | Question | Typical actions | Never claim |
|---|---|---|---|
| Exposure | Does this plausibly lower the pollution people here breathe? | Closing windows, cleaner room, shifting the commute, respirator | A health result, a dose, or that city air improved |
| Emissions | Does this reduce pollution this household would otherwise cause? | Skipping or sharing a motor trip, no burning, engine off | A local PM2.5 or NOx change, or that exposure fell |

An action may be `none` on one axis. That is a valid and expected answer ("A respirator lowers your exposure; it does not reduce emissions").

**Direction enum.** `down` | `none` | `conditional`. (The current repo uses `reduces` for `down`; treat them as identical and do not rename in repair phases.) `conditional` means the effect depends on a stated condition that the statement must name (for example "only if this replaces a motor trip").

## 3. Labels

| Label | Allowed when | MVP use |
|---|---|---|
| **Measured** | A user-supplied or observed station reading underlies the statement | **Unused.** All Open-Meteo data is modelled. Content lint fails any UI string containing "Measured" in the MVP. |
| **Estimated** | A formula in §5 produced a number from stated inputs | E1, X1, C1 (E2 only if `SHOW_CO2E`) |
| **Recommended** | Qualitative guidance consistent with public-health advice; no number | All X2 statements and every non-formula claim |

**Demo data** is a data-type marker, not a label. It appears as a separate badge on sample scenarios and the seeded community, in addition to the label.

## 4. Confidence rules

Confidence values: `high` > `medium` > `low`.

**Tiers**

| Input | high | medium | low |
|---|---|---|---|
| Evidence tier (catalog) | Strong, consistent public-health guidance | Reasonable guidance, mixed or indirect evidence | Weak or conditional |
| Data freshness | fresh | aging | stale, none |
| Data type | observed | modelled; sample (A-05) | – |
| Input tier (self-reported profile numbers) | – | self-reported | missing or defaulted |

**Exposure statements that rely on air data:** `confidence = min(evidenceTier, freshnessTier, dataTypeTier)`. With Open-Meteo this is never above `medium`.

**Emissions statements from profile inputs (A-31):** `confidence = min(evidenceTier, inputTier)`. Air-data freshness does not apply because no air data is used. Self-reported distances cap this at `medium`.

**Plan confidence ceiling:** `min(freshnessTier, dataTypeTier)`; `stale` or `none` forces `low` (P-03, P-04). The model may not exceed the ceiling (validator check 7). The confidence reason is always shown in the Trust Panel in plain words.

**Downgrades:** missing hours in the series, a missing current hour, a defaulted routine, or `unknown` transit each lower the relevant confidence by one tier and add an assumption.

## 5. Formula specifications

All formulas live in `src/domain/impact.ts`, are pure, and are shown in-app with their inputs.

### E1 — Vehicle-km avoided (Estimated)

- **Inputs:** `oneWayKm` (0 < x ≤ 100), `tripsPerWeek` (round trips, integer 0–14, per A-20), `tripsAvoided` (integer 0 ≤ x ≤ `tripsPerWeek`), `occupancy` (default 2, integer 2–5), mode must be motorised (`car`, `two_wheeler`, `auto_rickshaw`).
- **Skipped or remote trip:** `vkm = oneWayKm × 2 × tripsAvoided`.
- **Carpool:** `vkm = oneWayKm × 2 × tripsAvoided × (1 − 1/occupancy)`.
- **Combined trips (MO-04), engine off (MO-06):** no number; qualitative only (`Recommended`).
- **Output:** vehicle-km per week, rounded to one decimal; range `[0, 2 × oneWayKm × tripsPerWeek]`.
- **Display:** "about N vehicle-km avoided per week (Estimated)", with the formula and inputs one tap away.
- **Assumptions (always shown):** distances and trips are as you entered; occupancy is 2 unless changed; trips replaced are motor trips of the entered mode.
- **Uncertainty:** distance and frequency are self-reported; no routing is used.
- **Suppress when:** inputs invalid or missing, mode not motorised, or `tripsAvoided = 0`.

### E2 — CO₂e (secondary, Estimated, ranged; behind `SHOW_CO2E`, A-21)

- `co2e = vkm × [factorLow, factorHigh]` by vehicle class, from factors recorded in `DATA_SOURCES.md` §13 with source and access date.
- Disabled until factors are sourced. Always shown as a range with the note "Climate impact, not local air quality."
- Never shown without E1 beside it; never shown as "pollution avoided".

### X1 — Commute window forecast difference (Estimated)

- **Inputs:** modelled hourly PM2.5 series; the user's usual window `[leave, leave + duration]` (and return window); candidate shifts of up to ±2 hours in 1-hour steps, only if `canShiftTime` (P-16).
- **Formula:** `Δ = mean(PM2.5 over usual window) − mean(PM2.5 over alternative window)`; relative `r = Δ / mean(usual)`.
- **Coverage rule:** each window needs at least two non-null points and at least 50% of its hours; otherwise suppress.
- **Threshold (P-16):** show only if `Δ ≥ 5 µg/m³` and `r ≥ 15%`. Otherwise show "no meaningful difference". Ties choose the smaller shift.
- **Output:** two window means (integers, µg/m³) and the difference.
- **Display:** "Forecast average outdoor PM2.5 is about X µg/m³ vs Y µg/m³ (modelled)." Windows are written "around HH:00" (A-23).
- **Confidence:** `min(evidence, freshness, modelled)`, so at most `medium`.
- **Uncertainty:** coarse grid, 3-hourly source resolution for the global domain, local peaks missed.
- **Never claim:** a personal dose, or that the shift changes emissions (it may if it reduces idling, stated only as a condition on MO-01).

### X2 — Qualitative exposure effects (Recommended)

Ventilation, cleaner room, purifier use, sealing, respirators and cooking changes give a direction and the conditions under which it holds. No percentages, no µg/m³ change, no health outcome. The per-action sentences are in §6.

### C1 — Community aggregate (Estimated, Demo data)

- `C1 = Σ E1(pledge)` over pledges. The seeded society's per-pledge inputs are fixed constants labelled demo (average one-way distance, trips per week, occupancy), stored with the seed data, not derived from real people.
- The user's own pledge adds its own E1 from their profile.
- Output: "about N vehicle-km avoided per week if all pledges are kept (Estimated, Demo data)".
- Rules: see §9.

### R1 — Radar ranking (ranking, not a health estimate)

- `score(member, slot) = vulnerabilityWeight(member) × slotForecastLevel(slot) × outdoorFactor(slot, mode)`.
- `vulnerabilityWeight(member) = max(ageWeight, flagWeights)` (no summing, A-27). Defaults in `config/radar-weights.ts`: under-5 1.0, 65+ 0.9, 5–12 0.8, 13–17 0.5, 18–64 0.4; asthma/COPD 1.0, heart 0.9, pregnancy 0.8, other sensitivity 0.7.
- `outdoorFactor` defaults: indoors 0.1; car 0.4; bus or metro (waiting outdoors) 0.7; two-wheeler, auto-rickshaw, walk, cycle 1.0.
- The highest score wins; ties go to the earlier slot. Output is a member role label plus slot ("Child 5–12, morning commute"). It is described as "where exposure is likely highest", never as a health risk. Weights are design defaults and must be shown in the "how this works" sheet.

## 6. What each action changes and does not change

Direction: E = exposure, M = emissions. `D` = down, `N` = none, `C` = conditional. All labels are *Recommended* unless noted; E1 and X1 are *Estimated* where they apply.

| ID | E | M | Does not change |
|---|---|---|---|
| IN-01 Keep windows closed | D | N | Indoor sources keep adding pollution; it does not clean the outdoor air. |
| IN-02 Brief ventilation | C (only in the cleanest forecast window) | N | It does not remove indoor sources and can let outdoor pollution in. |
| IN-03 One cleaner room | D (in that room) | N | The rest of the home is unchanged; no outdoor effect. |
| IN-04 Seal gaps | D (modest, conditional on leaks) | N | It does not filter air; never offered with combustion heating or biomass cooking without exhaust (P-22). |
| IN-05 Run purifier correctly | D (in the room, if sized and filtered correctly) | N | It does not remove gases or fix outdoor air; it uses electricity. |
| IN-06 AC/HVAC on recirculate | C (depends on the unit and its filter) | N | It does not clean air unless the unit filters it. |
| IN-07 Cook with exhaust | D (during cooking) | N | It does not cut fuel use. |
| IN-08 Low-smoke cooking | D | C (minor, only if less fuel is burned) | It does not make combustion clean. |
| IN-09 No indoor smoke | D | D | It does not change outdoor air. |
| IN-10 Damp-wipe instead of dry sweep | D (less dust resuspension) | N | It does not address outdoor PM2.5. |
| PE-01 Limit outdoor time for sensitive members | D | N | It does not reduce the pollution itself. |
| PE-02 Fitted respirator (essential trips) | D (only with a good fit) | N | It does not reduce emissions, is not a substitute for staying indoors, and is not for under-5s. |
| PE-03 Indoor play and exercise | D | N | It does not change the air indoors beyond what the home already offers. |
| PE-04 Check on elders; follow clinician plan | D (protective, support) | N | It gives no medical advice; fixed text only. |
| MO-01 Shift commute to a cleaner window | C (Estimated via X1, only if P-16 met) | C (only if less idling) | It does not change how much the household drives. |
| MO-02 Public transport | C (waiting outdoors may add exposure; caveat) | D (conditional on replacing a motor trip) | It does not lower exposure at stops. |
| MO-03 Carpool | N | D (Estimated via E1) | It does not lower in-vehicle exposure. |
| MO-04 Combine trips | N | D (qualitative) | No number is claimed. |
| MO-05 Work remotely on the worst day | D (fewer outdoor minutes) | D (Estimated via E1) | It does not change indoor sources. |
| MO-06 Engine off while waiting | C (less nearby exhaust while waiting) | D (qualitative) | No number is claimed. |
| MO-07 Walk short trips | C (breathing harder raises intake; only offered when level ≤ 1, daylight, fresh data) | C (only if replacing a motor trip) | It is not a general health recommendation. |
| CM-01 No-burning pledge | N (for you directly) | D (qualitative) | One household does not change the city's air. |
| CM-02 Carpool board (deferred, A-17) | N | D | Deferred. |
| CM-03 Buddy check | D (support only) | N | Counts only; no personal data. |
| CM-04 Share daily briefing | N | N | Coordination only. |

## 7. Uncertainty handling

- Show ranges or "about" for any estimate; never false precision (vkm one decimal, µg/m³ integers, windows to the hour).
- Always disclose the data type ("modelled, about 25 km grid"; verify the value in `DATA_SOURCES.md`).
- If an input needed for a number is missing, show the qualitative statement instead, never a default number.
- No extrapolation: not from one week to a year, not from a household to a city.
- Aggregates never mix labels: Estimated and Recommended statements are not added together.

## 8. Banned claims

Content lint and the validator reject these (case-insensitive), plus any unsourced `%` or number:

- "saves the planet", "cleaner city because of you", "you reduced pollution by N%".
- Any promised health outcome: "protects your child from asthma attacks", "prevents", "cures", "detoxifies".
- "N95 makes the air safe", "100% safe", "guaranteed".
- Exposure reduction presented as emissions reduction, or the reverse.
- "Real-time", "measured" or "your street's air" for modelled data.
- Local PM2.5 or NOx totals from E1 or E2.
- Per-person health risk scores, "your risk is X%".
- Any diagnosis, medication or dosing language.

## 9. Community aggregate rules

1. Only sum emissions estimates (C1). **Exposure is never summed across people.**
2. Every aggregate shows "Demo data" and the seeded assumptions.
3. Counts are shown as pledged households, never names or addresses. The buddy-check line is a count only.
4. The aggregate never exceeds what the seeded inputs allow; it is recomputed, not typed.
5. The shareable briefing includes the level, the three top actions, counts, and the disclaimer; it contains no profile data, ages, locations finer than the city label, or health flags.
6. No claim about the society's or city's air changing.

## 9a. Required fields on every action (checked by tests)

`exposure {direction, label, confidence, note}`, `emissions {direction, label, confidence, note}`, `assumptions[≥1]`, `doesNotChange`, `evidence`, and a `templateKey`. Numbers only where a formula ID is attached.

## 10. Correct and incorrect statements

| Context | Correct | Incorrect |
|---|---|---|
| Closing windows | "Lowers the outdoor air coming in. Does not clean the air from cooking." (Recommended) | "Cuts indoor PM2.5 by 50%." |
| Carpool | "About 14.4 vehicle-km avoided per week if you carpool 2 days (Estimated). Does not change what you breathe." | "Carpooling cuts air pollution in your neighbourhood." |
| Commute shift | "Forecast average outdoor PM2.5 is about 142 vs 118 µg/m³ in the 9:00 window (modelled)." | "Leaving at 9 means you inhale 17% less." |
| Respirator | "Lowers your exposure on essential trips if it fits well. Does not reduce emissions." | "An N95 keeps your child safe." |
| Walking | "Not suitable today: air is Protect level." | "Walking is healthy, go for it." |
| Stale data | "Air data is 26 hours old. Treat advice with low confidence." | "Air is probably fine." |
| Community | "About 38 vehicle-km avoided per week if all pledges are kept (Estimated, Demo data)." | "Green Meadows cut pollution this week." |
| CO₂e | "Roughly 2–4 kg CO₂e (climate impact, not local air quality)." | "Saves 3 kg of pollution." |

## 11. Test mapping

Unit tests per formula (valid, boundary, invalid, suppressed); content lint for banned claims and "Measured"; matrix invariant 9 (completeness); validator abuse fixtures for invented numbers; golden personas for Priya's E1 and X1. See `TEST_PLAN.md`.
