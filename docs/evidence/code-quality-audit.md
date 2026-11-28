# AirWise Code-Quality Evidence (Measured)

**Date:** 2026-11-28
**BASELINE_SHA:** e30e0a95ba73920fe0d3975d49e1ebf986727b5c
**Branch:** main
**Working tree:** clean (git status)

This document contains only measured tool output captured on the date above. No scores or subjective assessments are included.

## Preflight commands and results

- `git status` -> `On branch main ... nothing to commit, working tree clean`
- `npm ci` -> `added 244 packages, and audited 245 packages ... found 0 vulnerabilities`
- `npm run validate` -> passed (lint, typecheck, test, check:ui, check:css, check:links, check:size, check:traceability, scan:secrets, format:check)
- `npm run test:policy` -> `Test Files 2 passed (2); Tests 9 passed (9)`
- `npm run test:tz` -> passed across UTC, Asia/Kolkata, America/Los_Angeles
- `npm run build` -> `306 modules transformed`; built successfully

## Vitest summary

- `npm run test` (`vitest run`): `Test Files 70 passed (70)`; `Tests 558 passed (558)`
- `npm run test:policy`: `Test Files 2 passed (2)`; `Tests 9 passed (9)`

## Lint and typecheck

- `npm run lint` (`eslint .`): no errors reported in validate run
- `npm run typecheck` (`tsc --noEmit`): no errors reported in validate run

## CSS audit (npm run check:css)

- Total CSS files scanned: 15
- Total selector blocks: 634
- Defined `.aw-` classes: 366
- Allow-listed dynamic `.aw-` classes: 8
- `!important` declarations verified: 11 (all inside accessible motion reduction)
- Used-class audit: 539 referenced classes in src/, all have corresponding CSS rules

## UI checks (npm run check:ui)

- 0 undefined tokens, 0 literal colors in code, 0 non-custom-prop inline styles, 0 emojis in UI, 0 uppercase transforms, 0 disallowed alerts

## Links (npm run check:links)

- All relative links in README.md and docs/*.md resolve successfully

## Size (npm run check:size)

- Repository size: 2.95 MB (30,94,137 bytes including .git); within budget (< 3 MB)

## Traceability (npm run check:traceability)

- All 22 P-rules, 5 Impact fields, 9 Error types, and 27 referenced test files verified

## Secrets (npm run scan:secrets)

- No secrets detected in scanned files

## Format (npm run format:check)

- All matched files use Prettier code style

## File counts

- src/ files (ts/tsx/css): 201
- api/ files (ts): 12
- test files: 70 (per Vitest summary)

## Largest files under src/ and api/ (by line count)

1. src/styles/primitives.css - 773
2. src/styles/today.css - 571
3. src/styles/shell.css - 538
4. src/styles/legal.css - 451
5. src/styles/restored.css - 401
6. src/styles/tokens.css - 323
7. src/ai/validator.ts - 321
8. src/ui/onboarding/hooks/useOnboardingDraft.ts - 308
9. api/plan.ts - 307
10. src/ui/screens/AboutScreen.tsx - 296
11. src/domain/catalog/indoor.ts - 261
12. src/domain/templates.ts - 242
13. src/styles/community.css - 233
14. src/ui/screens/MoveScreen.tsx - 233
15. src/data/fallback-chain.ts - 226

## Type assertions (`as`) outside tests

- Count: 48 (grep: ` as [A-Za-z]` in src/ and api/, excluding `as const` and tests/)

## Branch check

- `npm run check:branches` is part of final verification; single-branch policy (main only).

## Files changed in this task

- docs/evidence/code-quality-audit.md (this file)
