# AirWise — Antigravity Agent Guidelines & Shared Rules

This document governs all agent work on the **AirWise** codebase. Every Antigravity agent working on this repository must strictly adhere to these rules.

---

## 1. Core Principles

1. **Deterministic Core, AI Overlay**:
   - All safety, ranking, and numbers live in pure TypeScript inside `src/domain/`.
   - The LLM only personalizes explanations, chooses top 3 from approved candidate actions, and orders within slots.
   - The app must remain 100% usable and safe with `LLM_PROVIDER=none` or offline.

2. **Strict Layer Boundaries**:
   - `src/domain/`: Pure TypeScript only. Must NEVER import from React, browser APIs (`window`, `localStorage`, `navigator`), network/fetch, file system, `src/data/`, `src/ai/`, `src/ui/`, or `src/state/`.
   - `src/data/`: Data providers, caches, sample data, and trust models. Imports `src/domain/`. Never imports `src/ui/`.
   - `src/ai/`: Prompts, LLM client, schemas, validators, and overlay. Imports `src/domain/`. Never imports `src/ui/`.
   - `src/ui/`: Views, components, tabs. Imports `src/domain/`, `src/data/`, `src/ai/` types, and `src/state/`.
   - `src/state/`: Local storage, profile management.

3. **Medical & Public Health Boundaries**:
   - NEVER make diagnoses, recommend medications, suggest dosages, or promise medical cures.
   - Any health guidance must use verified public-health framing (WHO, CPCB, EPA).
   - Emergency medical caveat (`PE-04`) must remain verbatim: "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe."
   - Respirator guidance (`PE-02`) must note fit and include: "Some respirators make breathing harder. Ask your clinician if unsure."
   - No masks for children under 5 (choking and suffocation hazard); limit outdoor time instead.

4. **Honest Dual-Axis Impact**:
   - Every action MUST present both **Exposure** (what you breathe) and **Emissions** (what you cause).
   - Exposure reduction NEVER implies emissions reduction (and vice versa).
   - Labels: `Measured` (only for verified user/sensor measurements, unused in MVP), `Estimated` (derived from documented formulas), `Recommended` (qualitative advice).
   - Formulas must be transparent: E1 (vkm avoided), X1 (commute forecast delta), C1 (community vkm avoided).
   - Banned phrases: "You saved the planet", unsourced percentage reductions, guaranteed health outcomes.

5. **Combustion Safety (P-22)**:
   - NEVER recommend sealing gaps or draft-proofing (`IN-04`) if the household uses unvented combustion heating (`homeHeating === 'combustion'`) or biomass cooking without exhaust.
   - Always attach a carbon monoxide safety warning to window closing (`IN-01`) for combustion households.

6. **Privacy by Architecture**:
   - No user accounts or backend database in MVP.
   - Household profile lives in `localStorage`.
   - LLM receives only coarse enums, age groups, sensitive flags category, and candidate IDs.
   - NEVER send coordinates, exact street addresses, or personal names to the LLM.

---

## 2. Policy Invariants (P-01 to P-22)

- **P-01**: Effective Level 4 or official alert triggers Severe Smog Mode. Outdoor exercise is forbidden.
- **P-02**: Effective level = base level + 1 if any member is sensitive (`u5`, `5-12`, `65+`, or sensitivity flags), capped at 4.
- **P-03 / P-04**: Stale data or no data suppresses outdoor recommendations (walking, cycling, opening windows). Uses cautious defaults.
- **P-05 / P-06 / P-07**: Windows open only if effective level <= 1 and fresh; brief window at level 2 only if forecast window <= 1; windows closed at level >= 3.
- **P-08**: Walking / cycling (`MO-07`) only if level <= 1, daylight, and fresh data.
- **P-09 / A-04**: Sensitive members at level >= 3 require `PE-03` (indoor play) and forbid outdoor exercise. At level 2, `PE-01` and `PE-03` are high-priority candidates.
- **P-10**: Budget gating: `free` budget excludes costs >= low; `low` budget excludes costs >= medium. Never require purchases.
- **P-11**: Equipment gating: Purifiers (`IN-05`), AC/HVAC (`IN-06`), and kitchen exhaust (`IN-07`) require owned equipment.
- **P-12**: Low-smoke cooking (`IN-08`) substitutes when exhaust is absent.
- **P-13**: Respirators for essential trips at level >= 2; never for under-5; fit checks for ages 5-12.
- **P-14**: Medical boundary preserved with fixed disclaimer texts.
- **P-15**: Emissions actions (carpooling, trip combining, engine off) offered at any level.
- **P-16**: Commute shift (`MO-01`) requires `canShiftTime` and delta >= 5 µg/m³ AND >= 15%.
- **P-17**: Remote work (`MO-05`) requires `canWorkRemotely`.
- **P-18 / A-25**: Public transit (`MO-02`) gated on availability; excluded for sensitive members at level >= 3 due to outdoor waiting risk.
- **P-19 / A-11**: Mandatory actions (`mustInclude`) cannot be removed or weakened.
- **P-20**: Outdoor workers: emphasize respirators and shift protection; do not assume schedule control.
- **P-21**: Community actions (`CM-01`..`CM-04`) only appear when community mode is active.
- **P-22**: Combustion safety enforced.

---

## 3. Development Workflow

- **Branching**: Single branch (`main`). Never create feature branches.
- **Commit Format**: Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- **Verification Gates**: Every phase must pass:
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm test`
  4. `npm run build`
  5. `npm run check:size` (< 3 MB target, 10 MB hard limit)
  6. `npm run check:branches` (only `main`)
  7. `npm run scan:secrets`

