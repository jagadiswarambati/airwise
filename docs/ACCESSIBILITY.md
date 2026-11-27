# AirWise — Accessibility Specification

Purpose: a practical, testable accessibility spec for a phone-first web application (PWA/offline shell is not implemented) whose users may be stressed, older, using assistive tech, or on small cheap devices. Target: **WCAG 2.2 Level AA**. Automated and manual checks are in §14–15; acceptance per phase in §16.

## 1. Principles

1. Risk is never conveyed by colour alone: **text + icon + colour**, always.
2. The most important answer ("what should we do today?") is reachable first in reading order and by first focus.
3. Plain language (grade 6–8) is an accessibility requirement, not polish.
4. Severe Mode is the high-legibility mode: fewer elements, bigger text, one primary action.
5. Nothing relies on hover, drag, precise pointing, or timing.

## 2. Semantic HTML and landmarks

- One `<header>`, one `<nav aria-label="Main">` (the tab bar), one `<main>`, optional `<footer>` for the disclaimer.
- Heading order is strict: one `<h1>` per screen (screen name), `<h2>` for cards, `<h3>` inside cards. No skipped levels.
- Lists are `<ul>/<ol>`; the timeline is an ordered list; the tab bar is a list of links or buttons with `aria-current="page"` on the active item (or a proper tabs pattern with `role="tablist"` and arrow-key support, chosen once and used consistently).
- Buttons are `<button>`; navigation is `<a>`. No `div` buttons.
- `<html lang="en">`; any non-English fragment carries `lang`.
- Page `<title>` updates per tab.

## 3. Keyboard navigation

- Every function works with keyboard only: onboarding, tabs, Quick Checks, action detail, menu, scenario switcher, export/delete, community pledges, Copy briefing.
- Tab order follows visual order; no positive `tabindex`.
- Provide a "Skip to main content" link as the first focusable element (linking to `#main`, focusing `<main id="main">`).
- Tabs pattern: Left/Right arrows move between tabs if the tablist pattern is used; Home/End supported.
- Escape closes any dialog or sheet.
- No keyboard traps except intentional modal focus traps.

## 4. Focus management

- **Dialogs and sheets** (action detail, menu): on open, move focus to the dialog heading or first control; trap focus inside; Escape closes; on close, **return focus to the trigger**. Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Modals trap focus and close on Escape; background content uses aria-hidden.
- **Screen changes** (tab, onboarding step): move focus to the new `<h1>`/heading with `tabindex="-1"` and announce the change.
- **Validation errors:** on submit, focus the error summary; each field links to its message.
- **Severe Mode entry:** do not steal focus mid-task; announce once (§9) and place the primary action first.

## 5. Visible focus states

- Focus ring token `--focus-ring`: 3 px solid, offset 2 px, contrast ≥ 3:1 against adjacent colours in light, dark and Severe themes.
- Never `outline: none` without a replacement. Use `:focus-visible`.
- WCAG 2.2 "Focus Not Obscured" (2.4.11): sticky headers and the tab bar must not cover the focused element; use `scroll-padding` equal to their height.

## 6. Colour and contrast

- Text 4.5:1 (3:1 for large text ≥ 24 px, or ≥ 18.66 px bold); UI components and graphical objects 3:1.
- Define all colours as tokens in `src/styles/tokens.css` with tested pairs; a unit test computes the contrast ratio for every foreground/background pair in light, dark, and Severe themes. **Hard-coded hex values in components are not allowed**; design tokens from `src/styles/tokens.css` are enforced by `check:ui`.
- Level communication, each with its own text and icon: Clear (check), Watch (info), Caution (triangle), Protect (octagon-slash or shield), Severe (alert). The level word is always written ("Severe for your household").
- Sparkline: line plus labelled end points, with a text alternative (§10); never colour-only banding.
- Support `forced-colors` mode: borders and focus rings use system colours; icons do not disappear.

## 7. Touch targets and spacing

- Minimum 44×44 CSS px for all interactive elements (exceeds WCAG 2.2 AA 2.5.8 minimum of 24 px). At least 8 px between targets.
- Single-tap alternatives to any gesture; no drag (WCAG 2.5.7), no multi-finger, no long-press requirement.
- Bottom tab bar items are full-width touch areas; labels always visible with the icon.

## 8. Text scaling, reflow and zoom

- Use `rem`/relative units; the root font size is never fixed in px.
- Works at 200% text size without loss of content or function, and at 400% zoom / 320 CSS px width without two-dimensional scrolling (reflow, 1.4.10). Tables become stacked cards.
- Respect user text spacing overrides (1.4.12); no fixed-height containers for text.
- Base text 16 px; Severe Mode ≥ 20 px.

## 9. Severe Smog Mode accessibility

- Single column, ≥ 20 px text, maximum contrast theme, three actions maximum, no charts, one primary button ("Show full plan").
- Announce entry **once** with a polite status ("Severe air for your household. Showing the three most important actions."). Do not wrap the whole screen in `role="alert"` or `aria-live="assertive"` (polite live region is used).
- Order: headline, three actions, primary button, then secondary links.
- Manual toggle stays available in Menu and is labelled with its state ("Severe Mode: on").
- All of §3–8 still apply; Severe Mode is not exempt from focus and contrast rules.

## 10. Screen-reader support

- Each card has a concise accessible name and a one-sentence summary at the top (the level, the PM2.5 value with unit, the data type and age).
- Icons that carry meaning have text; decorative icons and emoji are `aria-hidden="true"` with the meaning present in text.
- Sparkline: `role="img"` with an `aria-label` summarising the trend ("PM2.5 rising from 110 to 180 µg/m³ over the next six hours, modelled"), plus an expandable "show hourly values" table.
- Badges (Modelled, Sample, Demo data, Standard plan) are text, not just styling.
- Action cards expose: name, why (one line), cost tag, confidence (as a word), and a button "Details".
- The Risk Radar reads as a sentence, not a decorative graphic.
- Numbers always have units spoken ("micrograms per cubic metre" via visible "µg/m³" with `abbr` or text expansion in the label).

## 11. Forms (onboarding and edit profile)

- Every control has a visible `<label>`; groups use `<fieldset>` and `<legend>` (age group, flags, equipment, modes).
- Required vs optional is stated in words; "skippable where safe" is explained.
- Helper text is linked with `aria-describedby`; errors use `aria-invalid="true"` and `aria-describedby` to the message; an error summary lists all issues with links.
- Use correct `type`, `inputmode`, `autocomplete` (where meaningful; the city search is `autocomplete="off"` with an accessible results list: `role="listbox"` pattern or a plain list of buttons).
- Time fields use native `type="time"` with labels.
- **Redundant entry (3.3.7):** values already given are pre-filled when navigating back; nothing is asked twice.
- Progress is shown as text ("Step 2 of 5: Who lives here"), not only a bar.
- No time limits. No CAPTCHA.
- The Priya preset button is clearly labelled as a demo shortcut.

## 12. Status and error announcements

- One polite live region (`role="status"`) at the app level for: plan updated, plan source changed (AI swapped in), data refreshed, copied briefing, scenario changed. Messages are short, and the same message is not repeated.
- Banners for stale data use `role="status"` unless the user must act immediately; reserve `role="alert"` for blocking errors.
- Loading states are text ("Loading air briefing") with `aria-busy` on the region; no spinner-only indicators.
- Offline and fallback notices state data age in words.
- AI swap-in must **not** move focus or reorder content under the user's cursor; if actions reorder, announce "Plan updated with personalised order".

## 13. Plain-language and content requirements

- Reading level: grade 6–8 (mean ≤ 16 words per sentence, avoid jargon). Enforced by the content-lint unit test over all templates and fixed texts and by the validator for AI text.
- Define PM2.5 once in the "about this reading" sheet; use "tiny dust and smoke particles" in plain copy.
- Action names are verbs ("Keep windows closed").
- No idioms, no emoji-only meaning, no culture-specific slang.
- Consistent terms: always "respirator (N95 or FFP2)", always "Severe for your household".
- Numbers: units always shown; times in 12 or 24-hour per user's device locale; windows written "around 7:00".
- Error messages say what happened and what to do next.
- i18n-ready: strings in keys; Hindi/Telugu deferred (A-16), but layout must not break with 40% longer text.

## 14. Reduced motion, dark mode, other preferences

- `prefers-reduced-motion: reduce`: remove transitions and smooth scroll; no auto-playing animation anywhere.
- `prefers-color-scheme`: light and dark tokens both pass contrast; Severe theme overrides both.
- `prefers-contrast: more` and `forced-colors` are honoured where feasible.
- Nothing flashes more than 3 times per second.

## 15. Testing

### Automated
- Automated checks: Vitest test suite (`npm test`) runs automated axe-core accessibility audits via `vitest-axe` in `tests/render/accessibility-axe.test.tsx` (auditing About, Today moderate & severe, each onboarding step 1–5, Indoor, Move, Impact, Community, Privacy, Terms, and open modal dialogs with zero violations). In addition, `tests/unit/tokens-contrast.test.ts` computes contrast ratios for every token pair against WCAG AA, `tests/unit/motion-reduction.test.ts` verifies complete animation disabling under `prefers-reduced-motion`, `tests/unit/keyboard-navigation.test.tsx` verifies Tab order progression and dialog Escape focus restoration, and `npm run check:ui` verifies UI token compliance.
- Lighthouse accessibility audit: score of 100 on mobile (see [`docs/evidence/lighthouse.md`](./evidence/lighthouse.md)).
- End-to-end browser automation (Playwright): planned, not implemented (decision A-41). Core user journeys are verified via Vitest render and integration tests.

### Manual checklist

| # | Check | Pass criteria |
|---|---|---|
| 1 | Keyboard only: onboarding → Today → action detail → Indoor → Move → Impact → Community → Menu → delete | All reachable; focus visible; no traps |
| 2 | Screen reader, desktop: NVDA + Firefox or Chrome (Windows), or VoiceOver + Safari (macOS) | Landmarks, headings, labels, live regions make sense; no double announcements |
| 3 | Screen reader, mobile: VoiceOver (iOS) and TalkBack (Android) | Tab bar, cards, sheets operable; swipe order logical |
| 4 | 200% text size (browser/OS) | No clipped text or lost controls |
| 5 | 400% zoom at 1280 px (≈ 320 px) | No horizontal scroll except for data tables replaced by cards |
| 6 | 360 px wide phone | Layout intact; targets ≥ 44 px |
| 7 | Reduced motion | No animation |
| 8 | Forced colors / high contrast | All content and focus visible |
| 9 | Severe Mode with screen reader | One announcement; three actions; primary button first |
| 10 | Stale scenario with screen reader | Banner announced once; suppressed actions are explained |
| 11 | Plain-language read-through | No sentence over 20 words in primary copy; no unexplained term |
| 12 | Colour-blind simulation (protan, deutan, tritan) | Levels distinguishable by text and icon |

Tracked in [`docs/a11y-report.md`](./a11y-report.md) (manual checklist with checks currently marked not yet run).

## 16. Acceptance criteria per phase

| Phase | Criteria |
|---|---|
| 0 | Tokens defined with contrast-tested pairs; focus ring token; `lang` set; base styles respect reduced motion; skip link in shell |
| 1A/1B | Templates pass the reading-level test; fixed texts exist; every action has a screen-reader-friendly name and summary string |
| 2 | Offline and data-quality notices have plain-language text and ARIA roles defined; no UI work otherwise |
| 3 | Form criteria in §11 met; keyboard-only completion under 90 s; error summary works |
| 4A | Landmarks, heading order, tab bar semantics; sparkline text alternative; risk level has text, icon and colour; UI checks pass on Today |
| 4B | Dialogs meet §4; Severe Mode meets §9; stale banner announced once; Quick Checks keyboard operable; verified in light, dark and Severe |
| 5 | AI swap-in does not move focus; status announcement present; "AI-personalised" vs "Standard plan" is text |
| 6 | Indoor and Move: verdicts have reasons in text; "not suitable today" has a reason; UI checks pass |
| 7 | Impact formulas readable as text, not images; Copy briefing announced; community counts have text; UI checks pass |
| 8 | Manual checklist in §15 established; Lighthouse accessibility 100; no hard-coded colours; automated render tests pass |
| 9 | Manual checklist tracked in docs/a11y-report.md; copy reading-level pass; verification documented |
