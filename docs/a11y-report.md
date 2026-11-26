# AirWise — Accessibility Manual Verification Checklist & Audit Report

**Specification:** [`docs/ACCESSIBILITY.md`](./ACCESSIBILITY.md)  
**Standard Target:** WCAG 2.2 Level AA  
**Status:** In Progress — manual verification checklist established; pending recorded manual test runs.

> [!NOTE]
> This checklist tracks manual assistive-technology and device-level audits specified in `docs/ACCESSIBILITY.md` §15. Per project integrity rules, every manual check is honestly marked **Not yet run** until formally conducted and recorded by a human tester. No results are fabricated. Automated unit/render tests and Lighthouse audits are tracked separately in [`docs/evidence/lighthouse.md`](./evidence/lighthouse.md).

---

## 1. Manual Verification Checklist

| # | Check Description | Scope & Scenarios | Target Criteria | Status | Tester & Date | Observations & Issues |
|---|---|---|---|:---:|---|---|
| 1 | Keyboard-Only Navigation | Onboarding → Today → Action Detail → Indoor → Move → Impact → Community → Menu → Delete All | Full functionality reachable via Tab/Shift+Tab/Enter/Space; visible focus rings; focus trapped in modals; Escape closes; no keyboard traps | Not yet run | Pending | — |
| 2 | Screen Reader (Desktop) | NVDA / Chrome (Windows) & VoiceOver / Safari (macOS) across all routes | Semantic landmarks (`header`, `nav`, `main`, `footer`), strict heading hierarchy, explicit form labels, single polite live region announcements | Not yet run | Pending | — |
| 3 | Screen Reader (Mobile) | TalkBack (Android) & VoiceOver (iOS) on mobile devices | Bottom navigation, card summaries, modal sheets operable via touch exploration; swipe order logical | Not yet run | Pending | — |
| 4 | 200% Text Scaling | Browser zoom / OS text size set to 200% | No text clipped; containers reflow; interactive targets remain operational | Not yet run | Pending | — |
| 5 | 400% Zoom (Reflow) | 1280 px viewport zoomed to 400% (≈ 320 CSS px) | Single-column reflow (WCAG 1.4.10); no horizontal scrolling for text content | Not yet run | Pending | — |
| 6 | Small Viewport / Touch Targets | 360 px viewport width | Touch targets maintain ≥ 44×44 CSS px (`--target-min`); ≥ 8 px separation | Not yet run | Pending | — |
| 7 | Reduced Motion Preference | `prefers-reduced-motion: reduce` enabled | All decorative atmospheric animations, transitions, and smooth scrolling disabled; static presentation | Not yet run | Pending | — |
| 8 | Forced Colours / High Contrast | Windows High Contrast / CSS `forced-colors: active` | System colors applied to text, borders, and focus rings; icons remain visible and legible | Not yet run | Pending | — |
| 9 | Severe Smog Mode | Severe air level or manual toggle active | Large text (≥ 20 px); maximum contrast; single announcement; top 3 actions prioritized | Not yet run | Pending | — |
| 10 | Stale Scenario Handling | Stale / offline demo scenario | Polite status banner announced once; suppressed actions explained with clear reasons | Not yet run | Pending | — |
| 11 | Plain-Language Audit | Primary copy and advice text | Grade 6–8 readability; mean ≤ 16 words per sentence; no unexplained medical jargon | Not yet run | Pending | — |
| 12 | Colour-Blind Simulation | Protanopia, Deuteranopia, Tritanopia filters | Risk levels clearly distinguished by text labels and icons, never colour alone | Not yet run | Pending | — |

---

## 2. Methodology & Evidence Reference
- Automated checks:
  - Contrast ratios and CSS token pairs verified by `npm test` (`tests/unit/tokens.test.ts`).
  - Heading hierarchy, alert role restrictions, and visual tokens verified by `npm run check:ui`.
  - Automated mobile Lighthouse audit summary documented in [`docs/evidence/lighthouse.md`](./evidence/lighthouse.md).
- End-to-end browser automation (Playwright and axe-core) is planned, not implemented (see decision A-41).
