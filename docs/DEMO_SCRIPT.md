# AirWise — 90-Second Judge Demo Script

Purpose: an exact, rehearsable walkthrough on a phone (or a 390 px browser window). It follows README §31 with the amendments: no personal names (A-03), the Priya preset also selects the Severe scenario (A-28), and every claim obeys `IMPACT_METHODOLOGY.md` §8.

**Prerequisites:** Impact and Community tabs exist (Gate A). Deterministic plan works with `LLM_PROVIDER=none`. The app is installed or open on the Today screen with **no profile stored** (delete all data first).

## 1. The three memorable moments (protect these)

1. **Risk Radar:** "Today's biggest risk is the school run" — the app names who and when.
2. **Dual-axis card:** "Lowers your exposure ✔ — does not reduce emissions ✘", with label, confidence and assumptions.
3. **Trust Panel on stale data:** confidence visibly drops, walking and ventilation disappear, and the banner says why.

## 2. Timed script

| Time | Click / action | Say (narration) | Expected on screen |
|---|---|---|---|
| 0:00–0:08 | Open the app. Tap **Try Priya's household** (Menu, or on the first onboarding screen). | "Meet a typical household: a working parent, an asthmatic child, a grandparent, no purifier, a tight budget, thirty seconds each morning." | Profile loads; Today opens in **Severe Mode** (single column, large text, three actions). Time to Today ≤ 10 s. |
| 0:08–0:22 | Stay on Today. Point to the headline, then the Risk Radar. | "Severe for *this* household. PM2.5 is the primary number; AQI is secondary. **Moment one:** the Risk Radar says the child's morning school run is today's highest-risk moment." | Headline "Severe for your household"; air card with µg/m³, "Modelled", data age; Radar line; three actions with a one-line why each. |
| 0:22–0:36 | Tap **Show full plan**, then the respirator action (PE-02) → detail sheet. | "**Moment two:** every action shows two separate effects. A fitted respirator lowers exposure on essential trips. It does not reduce emissions. Label: Recommended. Confidence and assumptions are right there." | Sheet shows Exposure ✔ and Emissions ✘, label, confidence, assumptions, "What it does not change", fixed respirator caveat. Close with Escape; focus returns to the card. |
| 0:36–0:46 | Tap **Indoor**. | "No purifier, so the Ventilation Advisor says keep windows closed, with the reason. Cooking has no exhaust, so it gives low-smoke steps. Free first: this is Low-Cost Protection Mode." | Verdict "Keep closed" with reason; low-smoke cooking steps; Low-Cost indicator. |
| 0:46–0:56 | Tap **Move**. | "Walking is shown as *not suitable today*, with the reason. Carpooling two days avoids about N vehicle-km a week. That's an estimate from your own inputs, and it shows the formula." | MO-07 "not suitable today"; E1 estimate with "Estimated" label, formula link. No CO₂e unless enabled. |
| 0:56–1:08 | Menu → scenario → **Stale data**. (If rehearsed offline: turn on airplane mode before this beat.) | "**Moment three:** the data is a day old, so AirWise lowers its confidence. Ventilation and walking disappear. Offline, with no AI, you still get a complete plan, badged *Standard plan*." | Stale banner; confidence "Low" with reason in the Trust Panel; no walking or window-opening; badge "Standard plan". |
| 1:08–1:20 | Tap **Community** → **Copy briefing**. | "Individual choices, neighbourhood coordination. Demo data, counts only: a society can paste today's briefing into a notice group." | Community tab labelled Demo data; pledges; aggregate vehicle-km "Estimated, Demo data"; "Copied" announced; no personal data in the text. |
| 1:20–1:30 | Return to Today. | "This isn't an AQI dashboard. Safety rules are deterministic code. AI only personalises inside an approved set and is thrown away if it fails validation. Every number shows its formula, and the app tells you how much to trust it." | Today with trust summary visible. End. |

Total: 90 seconds. If you run long, cut the Move beat to one sentence.

## 3. Scenario map (what each demonstrates)

| Scenario | Where | Shows |
|---|---|---|
| Severe | Priya preset default | Severe Mode, Radar, mustInclude actions first |
| Stale | Menu → scenario | Confidence drop, suppression of outdoor and ventilation advice (P-03) |
| Low-cost household | Priya (low budget, no purifier) | Free-first ranking, substitutes for missing equipment (P-10, P-11) |
| Community | Community tab | Seeded briefing and aggregate (C1) |
| No AI / no network | Offline plus `LLM_PROVIDER=none` | Deterministic fallback, "Standard plan", cached or sample data labelled |

## 4. Fallback demonstration (30 s add-on for Q&A)

1. Turn on airplane mode, reload. The shell loads from the service worker.
2. The banner states the data age. The plan is intact and badged *Standard plan*.
3. Say: "No network and no model, and the plan is still complete."
Only claim "cached data" if a live snapshot was fetched earlier on this device. If not, select a demo scenario and say it is sample data.

## 5. Pre-demo checklist (5 minutes before)

- [ ] Fresh browser profile; Delete all data; app loads on onboarding.
- [ ] Phone at 100% battery, Do Not Disturb on, screen brightness high.
- [ ] Scenarios switch correctly (Severe, Stale) and the Priya preset lands on Severe.
- [ ] Impact and Community tabs load; Copy briefing works (clipboard permission granted).
- [ ] Airplane-mode rehearsal done once; service worker is registered.
- [ ] Both AI states checked: with a valid key the badge shows "AI-personalised"; without, "Standard plan". Know which you are showing.
- [ ] A backup screen recording of the full run is on the device.
- [ ] Live data may be clean on judging day: **say so**, and use scenarios ("live data is clear today, so I'll load a real winter smog scenario").

## 6. Recovery lines

| Problem | Say / do |
|---|---|
| Live API slow or down | "That's the fallback chain working," and use a scenario |
| AI badge says Standard plan | "The AI overlay failed validation or is off, so the safe deterministic plan is shown. That's the design." |
| Wrong tab or stuck dialog | Escape, then continue from the tab bar |
| A judge asks about a health claim | "AirWise is informational; it never diagnoses, doses or promises outcomes. The medical text is fixed." |

## 7. Likely judge questions (short answers)

- **Why not just let an LLM chat?** Free text is an injection and safety surface; Quick Checks are deterministic and testable.
- **Where does the AI add value?** It picks the best three from approved actions for today's story, orders by the family's routine, and writes warm, specific explanations.
- **Is the data real?** Modelled (CAMS via Open-Meteo), coarse resolution, labelled as such; sample data is labelled Sample.
- **What do emissions numbers mean?** Vehicle-km avoided from your inputs; no local air-quality claim.
- **Privacy?** No account, profile stays in the browser, rounded location, nothing identifying to the model.
- **What's not built?** See README §33 (modelled data, PM2.5 only, community is demo data, English only).

## 8. Claims check (read once before presenting)

Do not say: "saves lives", "protects your child", "real-time sensor data", "reduces pollution in your area", any percentage, any health outcome. Do say: "lowers your exposure", "estimated", "modelled", "recommended".
