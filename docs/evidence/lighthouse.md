# AirWise — Lighthouse Audit Evidence (Mobile)

Audit Date: 2026-11-27  
Base Commit SHA: `f38c491` (evaluated on local Vite preview `http://localhost:4173` build including the `fix(a11y)` CTA contrast and `fix(security)` Zod `jitless: true` changes prior to commit)  
Tool & Emulation: Headless Lighthouse 13.6.0, Mobile (390×844 viewport, 3× DPR, simulated mobile throttling)  
Target URLs: `/` (onboarding start screen), `#/about`, `#/today`, `#/community` (`#/today` and `#/community` evaluated with `PRIYA_PRESET` seeded in `localStorage` and `moderate` scenario)

---

## 1. Summary Scorecard

| Route | Performance | Accessibility | Best Practices | SEO | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/` (Onboarding) | **100** | **100** | **96** | **100** | `errors-in-console`: `/api/air` 404 under static `vite preview` |
| `#/about` | **62** | **100** | **96** | **100** | LCP `3.8 s`, TBT `1,840 ms`, CLS `0`; `/api/air` 404 under static `vite preview` |
| `#/today` | **100** | **100** | **100** | **100** | Zero console errors, zero inspector issues |
| `#/community` | **89** | **100** | **100** | **100** | CLS `0.231` (footer shift); zero console errors |

---

## 2. Core Web Vitals & Loading Performance

| Metric | Target | `/` (Onboarding) | `#/about` | `#/today` | `#/community` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **First Contentful Paint (FCP)** | < 1.8 s | 0.8 s | 0.8 s | 0.8 s | 0.8 s |
| **Largest Contentful Paint (LCP)** | < 2.5 s | 0.8 s | 3.8 s | 1.0 s | 1.3 s |
| **Total Blocking Time (TBT)** | < 200 ms | 60 ms | 1,840 ms | 20 ms | 20 ms |
| **Cumulative Layout Shift (CLS)** | < 0.1 | 0.000 | 0.000 | 0.000 | 0.231 |
| **Speed Index (SI)** | < 3.4 s | 0.8 s | 1.8 s | 0.8 s | 0.8 s |

### Build Measurements (`npm run build`)
1. **Self-Hosted Font**: `AtkinsonHyperlegibleNext-Variable-*.woff2` (`34.00 kB`).
2. **Entry Bundle & Code Splitting**: Entry JS `dist/assets/index-*.js` is `433.41 kB` (`131.12 kB` gzip); CSS `dist/assets/index-*.css` is `69.76 kB` (`10.86 kB` gzip). Lazy route chunks isolate secondary screens.

---

## 3. Accessibility Audit (100 / 100 across all 4 routes)

- **All four audited routes (`/`, `#/about`, `#/today`, `#/community`) scored 100 / 100** on Lighthouse mobile accessibility (`color-contrast` passed across all elements after removing `.opacity-80` from CTA subtext spans and setting `.form-input::placeholder` `opacity: 1`).
- **Informational (weight-0) notice**: `#/today` and `#/community` note `label-content-name-mismatch` on descriptive `aria-label` buttons whose accessible name expands on the visible label rather than containing an identical substring; zero weighted accessibility audits failed.
- **Vitest + Axe Verification**: `tests/render/accessibility-axe.test.tsx` passes with zero violations across all screens and modals, and `tests/unit/tokens-contrast.test.ts` verifies alpha-blended contrast ratios (`>= 4.5:1`).

---

## 4. Best Practices & Strict CSP Verification (96–100)

- **Zero CSP Violations & Zero Inspector Issues**: `inspector-issues` scored `1` (pass) on all four Lighthouse runs and CDP `Audits.issueAdded` emitted zero `ContentSecurityPolicyIssue` events after configuring `z.config({ jitless: true })` in `src/lib/zodConfig.ts` while keeping `script-src 'self'` and `media-src 'self'` strict in `vercel.json`.
- **Static Preview Note (`96` on `/` and `#/about`)**: `vite preview` serves static `dist/` assets with `vercel.json` headers without mounting `/api/*` serverless handlers, so unseeded routes log one expected `404` for `/api/air?lat=28.61&lon=77.21` (`errors-in-console`) before falling back cleanly.

---

## 5. SEO Audit (100 / 100)

All four audited routes (`/`, `#/about`, `#/today`, `#/community`) scored **100 / 100** on Lighthouse SEO.
