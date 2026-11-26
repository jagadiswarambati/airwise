# AirWise — Submission Checklist

Purpose: the final gate before each of the three attempts. Tick items with evidence (command output, screenshot, or file path). Nothing is "done" without evidence. Phase detail is in `BUILD_PLAN.md`; tests in `TEST_PLAN.md`.

## 0. Blockers found in the 2026-11-21 repo review (must close before Attempt 1)

- [ ] B-1 AI overlay wired into Today (`getPersonalizedPlan` called, badge reflects reality) — prompt R1
- [ ] B-2 Real API handlers (`/api/plan`, `/api/air`, `/api/geocode`, `/api/health`) with Zod, body cap, rate limit, CORS — R1
- [ ] B-3 `vercel.json` with CSP and headers; client no longer calls Open-Meteo directly — R1
- [ ] B-4 Server builds prompts from catalog data only; no exact ages or client allow-lists in the AI request — R1
- [ ] B-5 Validator number check fixed (time forms, numeric comparison, NFKC) and abuse-tested — R1
- [ ] B-6 Time-zone-correct slots, radar and ventilation — R2
- [ ] B-7 Offline fallback: last real reading served as aging/stale; no silent sample substitution (A-32) — R2
- [ ] B-8 Policy matrix truly crossed with independent oracles — R3
- [ ] B-9 Impact tab and Community tab (Phase 7)
- [ ] B-10 Guards fixed (`check:branches`, secret-scan ignores, ESLint boundaries) — R3

## 1. Repository

- [ ] Repository is **public** (open it in a private window while logged out).
- [ ] **One branch only:** `git ls-remote --heads origin` shows exactly `main`. No PRs opened from other branches; no Dependabot or bots.
- [ ] Tags `attempt-1`, `attempt-2`, `attempt-3` exist as tags only, never branches.
- [ ] **Size:** repository (including `.git`) under 10 MB; target under 3 MB. Check with `du -sh .git` and `npm run check:size`. No `dist/`, `node_modules/`, videos, or images over 50 KB committed.
- [ ] Commit history is regular, small and conventional (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), one per phase at minimum.
- [ ] `LICENSE` (MIT), `.gitignore`, `.env.example` (blank values, `LLM_PROVIDER=none`) present.

## 2. Secrets

- [ ] `npm run scan:secrets` passes.
- [ ] `git log -p | grep -E "AIza|sk-|BEGIN .*PRIVATE"` returns nothing (history check).
- [ ] Built bundle contains no key patterns and no `GEMINI` string.
- [ ] No variable holding a secret is prefixed `VITE_`.
- [ ] `.env` is not tracked (`git ls-files | grep -E "^\.env"` shows only `.env.example`).

## 3. README completeness (what judges read first)

- [ ] Chosen vertical and problem statement.
- [ ] Approach and logic: deterministic engine, AI overlay, validator, fallback (with the diagram).
- [ ] How it works end to end (data → risk → policy → plan → overlay).
- [ ] Assumptions and known limitations (modelled data, PM2.5 only, demo community, not medical advice).
- [ ] Setup and run, including no-keys mode and `LLM_PROVIDER=none`.
- [ ] Environment variables table matches `.env.example`.
- [ ] Companion docs linked and **all exist** (ARCHITECTURE, DECISIONS, and the nine files in `docs/`).
- [ ] Amendments A-xx applied or referenced; README, ARCHITECTURE and DECISIONS do not contradict each other.
- [ ] Attribution for Open-Meteo and CAMS displayed in-app and in README.
- [ ] Evaluation-criteria mapping updated with real evidence (test counts, scores).
- [ ] Screenshots, if any, are small (under the size budget).

## 4. Code quality

- [ ] `npm run lint`, `npm run typecheck`, `npm run format:check` pass; no `any` without a comment; no `eslint-disable` without a reason.
- [ ] Layer boundaries hold and are enforced by lint (including nested imports); domain has no I/O.
- [ ] No dead code, unused exports, or stale TODOs; no commented-out blocks.
- [ ] Types defined once in `src/domain/types.ts`; Zod at boundaries.
- [ ] Small functions, clear names, comments explain *why* (rules cite P-xx).
- [ ] Clock and randomness injected into domain functions (determinism).

## 5. Security (see `SECURITY_PRIVACY.md` §18)

- [ ] Phase checklist complete through Phase 8.
- [ ] CSP and headers present on the deployed site (check response headers).
- [ ] `npm audit --audit-level=high` clean or waived with a note.
- [ ] API: oversize body 413, bad enum 400, rate limit 429, wrong origin 403 verified by tests.
- [ ] No request bodies or coordinates in logs.
- [ ] Export and delete verified; no `airwise_*` key survives delete.

## 6. Testing

- [ ] All CI gates in `TEST_PLAN.md` §12 green on `main`.
- [ ] `npm run test:policy` green; full `npm run test:matrix` run locally at Gate B and Gate C, with output saved.
- [ ] Validator abuse suite, contract tests, golden personas, content lint all present and green.
- [ ] Playwright e2e: Planned, not implemented (decision A-41).
- [ ] Traceability table maps every P-01…P-22 rule, error type and impact field to a test.
- [ ] Test count and coverage numbers recorded in README.

## 7. Accessibility (see `ACCESSIBILITY.md`)

- [ ] axe-core automation: Planned, not implemented (decision A-41). Accessibility is currently verified with Vitest render tests, check:ui, manual keyboard and screen-reader checks (`docs/a11y-report.md`), and Chrome Lighthouse ([`docs/evidence/lighthouse.md`](./evidence/lighthouse.md)).
- [ ] Keyboard-only run of the full journey completed.
- [ ] Screen-reader pass (desktop and mobile) recorded in `docs/a11y-report.md`.
- [ ] 200% text, 400% zoom, 360 px, reduced motion, and forced colours checked.
- [ ] No hard-coded colours in components; all contrast pairs tested.
- [ ] Lighthouse accessibility ≥ 95.

## 8. Performance

- [ ] Initial JS ≤ 150 KB gzip (bundle budget script output attached).
- [ ] Lighthouse mobile (throttled): Performance ≥ 90, Best Practices ≥ 95 (reports attached).
- [ ] Today renders under 3 s from cache; other tabs lazy-loaded.
- [ ] One LLM call per plan at most; plan cache verified (same inputs, no second call).
- [ ] No chart library; sparkline is inline SVG.

## 9. Error handling and degradation

- [ ] Each error in the taxonomy has a visible, plain-language state and a test.
- [ ] Primary provider failure → cached (aging/stale) → explicit demo option; never a silent sample (A-32).
- [ ] LLM off, invalid, or timed out → "Standard plan", no error screen.
- [ ] Geolocation denied, storage unavailable, offline all handled.
- [ ] Error boundaries per tab; no blank screens.

## 10. Demo readiness (see `DEMO_SCRIPT.md`)

- [ ] 90-second run rehearsed at least three times on the target phone.
- [ ] Priya preset reaches Today in ≤ 3 taps and ≤ 10 s.
- [ ] All four scenarios render the right level, plan and Trust Panel.
- [ ] Offline run rehearsed; backup screen recording saved.
- [ ] Deployed URL opens in a private window and works with no keys configured by the viewer.
- [ ] Live data may be clear: scenarios ready.

## 11. Three-attempt strategy

| Attempt | Submit when | Must contain | Rule |
|---|---|---|---|
| **1** | After Phase 7 (Gate A) | Every mandatory capability end to end; deterministic plan; AI overlay with fallback; Severe and Low-Cost modes; community on seeded data; core, matrix and validator tests; README | Demoable on a phone. All §0 blockers closed. Tag `attempt-1`. |
| **2** | After Phase 8 (Gate B) | Expanded tests, e2e, axe, Lighthouse, security checklist; fixes for issues found in Attempt 1 feedback | Strict improvement only; re-run everything. Tag `attempt-2`. |
| **3** | After Phase 9 (Gate C) | Copy and reading-level pass, demo assets, final README, freeze | No new features. If in doubt, don't ship the change. Tag `attempt-3`. |

Between attempts: write down what the previous score or feedback implies, fix only that, re-run all gates, and compare Lighthouse and test numbers to the previous tag.

## 12. Final quality gates (run on a clean clone)

```
git clone <repo-url> fresh && cd fresh
npm ci
npm run lint && npm run typecheck && npm run format:check
npm test && npm run test:policy
npm run build && npm run check:size && npm run scan:secrets && npm run check:branches
npm audit --audit-level=high
# e2e tests: planned, not implemented per decision A-41
```

- [ ] Every command passes on a clean clone with no `.env`.
- [ ] `npm run dev` works with no keys; the app is fully usable.
- [ ] `git status` is clean and the latest commit is pushed to `origin/main`.
- [ ] The tag for this attempt points at the commit you are submitting.
- [ ] The submitted URL, repository link and any form fields were re-read once before pressing submit.
