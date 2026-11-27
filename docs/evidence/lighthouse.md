# AirWise — Lighthouse Audit Evidence (Mobile)

Audit Date: 2026-11-27 (Headless Lighthouse 13.6.0 run against local Vite preview `http://localhost:4173`, evaluated on working tree over base commit `b37e089` prior to final cleanup commit)  
Device Emulation: Mobile (390×844 viewport, 3× DPR, simulated mobile throttling)  
Target URLs: `#/about`, `#/today`, `#/community` (`#/today` and `#/community` evaluated with `PRIYA_PRESET` seeded in `localStorage` and `moderate` scenario)

---

## 1. Summary Scorecard

| Route | Performance | Accessibility | Best Practices | SEO | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `#/about` | **85** | **96** | **92** | **100** | CLS 0.231; `(Takes 2 minutes)` span opacity 4.35:1 contrast; `/api/air` 404 in static preview |
| `#/today` | **93** | **100** | **96** | **100** | Zero console errors; TBT 300 ms |
| `#/community` | **87** | **100** | **96** | **100** | Zero console errors; CLS 0.231 |

---

## 2. Core Web Vitals & Loading Performance

| Metric | Target | `#/about` | `#/today` | `#/community` |
| :--- | :---: | :---: | :---: | :---: |
| **First Contentful Paint (FCP)** | < 1.8 s | 0.8 s | 0.8 s | 0.8 s |
| **Largest Contentful Paint (LCP)** | < 2.5 s | 2.3 s | 1.0 s | 1.3 s |
| **Total Blocking Time (TBT)** | < 200 ms | 130 ms | 300 ms | 130 ms |
| **Cumulative Layout Shift (CLS)** | < 0.1 | 0.231 | 0.000 | 0.231 |
| **Speed Index (SI)** | < 3.4 s | 0.8 s | 0.8 s | 0.8 s |

### Build & Optimization Measurements (`npm run build`)
1. **Self-Hosted Font**: Self-hosted `Atkinson Hyperlegible Next` variable font in WOFF2 format (`34.00 kB`).
2. **Chunking & Tree-Shaking**: Vite code splitting isolates sub-screens into lazy chunks (`IndoorScreen`, `MoveScreen`, `CommunityScreen`, `ImpactScreen`, `AboutScreen`, `PrivacyScreen`, `TermsScreen`); measured entry bundle `dist/assets/index-*.js` is `433.39 kB` (`130.68 kB` gzip) and CSS `dist/assets/index-*.css` is `69.76 kB` (`10.86 kB` gzip).
3. **No Heavy CSS Frameworks**: Hand-crafted CSS using custom property tokens without runtime style injection or CSS-in-JS overhead.

---

## 3. Accessibility Findings (96–100)

- **`#/today` and `#/community` scored 100 / 100** on Lighthouse mobile accessibility.
- **`#/about` scored 96 / 100**: Lighthouse flagged two `<span class="text-xs opacity-80">(Takes 2 minutes)</span>` elements inside primary CTA buttons at **4.35:1** contrast (`#124b6c` over `#38bdf8`, just under the 4.5:1 WCAG AA threshold for normal text).
- Vitest `vitest-axe` render audits (`tests/render/accessibility-axe.test.tsx`) verify zero axe violations across all screens and modal states.

---

## 4. Best Practices & Console / CSP Notes (92–96)

- **Zero Third-Party Media or Trackers**: Atmosphere visuals are pure CSS (`media-src 'self'`, zero `<video>` elements, zero external media requests).
- **Local Static Preview Note**: `vite preview` serves static `dist/` assets with `vercel.json` security headers and does not mount `/api/*` serverless handlers, so `#/about` logs a single 404 network response for `/api/air` when testing locally against static preview (the app falls back to sample/offline air data cleanly).
- **CSP Telemetry**: Chromium DevTools logs one informational `kEvalViolation` on initial boot caused by Zod v4's `try { return new Function(""), true } catch { return false }` capability check, which fails closed without throwing.

---

## 5. SEO Audit (100 / 100)

All three routes (`#/about`, `#/today`, `#/community`) scored **100 / 100** on Lighthouse SEO with dynamic document titles, viewport scaling, meta description, and crawlable hash links.
