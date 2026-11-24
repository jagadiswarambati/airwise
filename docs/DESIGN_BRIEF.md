# AirWise — Design Brief & Interface Specification

## 1. Overview
AirWise is a phone-first clean-air decision assistant for households. It turns particulate air data and household reality into an actionable daily plan with honest dual-axis impact (Exposure and Emissions).

## 2. Core Principles
1. Decision over data: Prioritise action guidance over raw metrics.
2. Honest dual-axis impact: Distinguish between personal exposure reduction and collective emission prevention.
3. No alert fatigue: Reserve urgent styling for actionable hazards.
4. Calm, high-legibility severe mode: Direct, bold guidance with high contrast and larger typography.

## 3. Design Tokens & Theme Palettes
Defined in `src/styles/tokens.css` with 100% token parity across Light, Dark, and Severe themes:
- Neutral surfaces: `--paper`, `--surface`, `--line`, `--line-strong`
- Typography ink: `--ink` (high contrast >= 4.5:1), `--ink-2` (muted text)
- Accent: `--accent` (#166534), `--on-accent` (#ffffff)
- Risk Haze Ramp:
  - Level 0 (Clear): `--haze-0-bg`, `--haze-0-ink`
  - Level 1 (Watch): `--haze-1-bg`, `--haze-1-ink`
  - Level 2 (Caution): `--haze-2-bg`, `--haze-2-ink`
  - Level 3 (Protect): `--haze-3-bg`, `--haze-3-ink`
  - Level 4 (Severe): `--haze-4-bg`, `--haze-4-ink`
- Dual-Axis Impact Tokens:
  - Exposure: `--exposure-bg`, `--exposure-ink`, `--exposure-border`
  - Emissions: `--emissions-bg`, `--emissions-ink`, `--emissions-border`
- Dynamic Sky Tints: `--sky-day`, `--sky-dusk`, `--sky-night`

## 4. Typography
- Font Family: Atkinson Hyperlegible Next (self-hosted WOFF2, Latin subset).
- Fallback Stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- Weights: 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold for display headings).
- Base font size: 16px (1rem); Severe Mode scales base text to >= 20px (1.25rem).

## 5. Spacing Scale & Touch Targets
- Base spacing unit: 4px (`--space-1` = 0.25rem through `--space-6` = 2rem).
- Touch Target Minimum: `--target-min: 44px` across all interactive controls.
- Focus Ring: `--focus-ring: 3px solid var(--accent); offset: 2px`.

## 6. Iconography System
- Standard 24px grid with 1.75px stroke width using `currentColor`.
- Zero emoji in the UI interface.
- Semantic icons: `check`, `info`, `warning`, `protect`, `severe`, `car`, `home`, `chart`, `people`, `menu`, `close`, `copy`, `chevron`, `wind`.

## 7. Component Primitives
- `Button`: Primary, Secondary, Quiet variants with guaranteed 44px touch target.
- `Chip`: Compact interactive tag for filters and quick checks.
- `Badge`: Metadata labels for Data Type, Freshness, and Plan Source.
- `Banner`: Informational announcements using appropriate semantic ARIA roles.
- `Disclosure`: Native details/summary progressive disclosure.

## 8. Shell & Layout
- Top navigation with active route indication (`aria-current="page"`).
- Responsive two-column grid at >= 1100px; single column on mobile (< 1100px).
- Bottom navigation bar on mobile viewports.
- Keyboard accessible with skip-to-content link and Escape key dialog dismissal.

## 9. Calm Severe Smog Mode
- Visual presentation: `data-theme="severe"`.
- Layout: Single focused column with base text >= 1.25rem.
- Content: Exactly one level headline, PM2.5 concentration, and maximum 3 actions (mandatory actions prioritized).
- Controls: Primary "Show full plan" button and visible "Turn off severe view" button.
- Accessibility: Container does NOT have `role="alert"` or `aria-live="assertive"`; entrance announced once via LiveRegion.

## 10. Accessibility Standards (WCAG 2.2 Level AA)
- Contrast ratio >= 4.5:1 for body and muted text; >= 3:1 for UI borders and controls.
- Status announcements dispatched via a single polite LiveRegion (`role="status"`).
- Dialogs feature modal focus traps and return focus to triggering elements upon dismissal.

## 11. Public Trust & Provenance Pages
- Public routes: `#/about`, `#/privacy`, `#/terms`.
- Complete disclosures of data sources, LocalStorage keys, and algorithmic boundaries.
- Transparent reporting of Open-Meteo and Copernicus attribution.

## 12. Privacy Architecture
- Privacy-by-design: Zero cookies, zero third-party analytics trackers, and zero required user accounts.
- Local storage isolation under the `airwise_` namespace prefix.
- Coarse coordinate truncation (~1.1 km resolution) to safeguard household location privacy.

## 13. Signature Atmosphere & Haze Band
- **LevelHero**: Full-width signature element integrating the sky strip and waking day chart.
- **HazeBand**: Inline SVG bar chart depicting hourly forecasts across waking hours with 3-hour ticks, now indicator, routine markers (Leave, Return, Cook), and radar slot highlight.
- **Atmosphere**: Lightweight weather strip utilizing pure CSS transforms and opacities (celestial sun/moon disc, subtle drifting haze bands, ambient specks, and wind streaks). Completely static when reduced motion is preferred or animated sky is disabled.
