# AirWise: Agent Rules (read before every task)

## Product goal
AirWise is a GenAI-assisted household clean-air decision assistant (Hack2skill PromptWars, Challenge 6). It turns air data plus household reality into one prioritised, explainable daily plan, with honest dual-axis impact (Exposure and Emissions) and visible trust information. It must be useful with no purifier, no account, no AI and no network.

## Source-of-truth order
DECISIONS.md amendments (A-xx) > README.md > ARCHITECTURE.md > docs/*. If documents conflict or something is missing, STOP and ask. Never guess.

## Non-negotiable safety principles
1. Deterministic core, AI overlay. Safety, ranking and numbers live in pure TypeScript in src/domain. The LLM may only choose from approved candidate IDs, order within slots, write short explanations, and propose a confidence at or below the engine ceiling.
2. DO NOT invent actions, numbers, health advice, thresholds, emission factors, policy exceptions or data. Every number comes from a documented formula (docs/IMPACT_METHODOLOGY.md) or an engine fact. If a value is unknown, say so in the UI.
3. No diagnosis, medication, dosing, treatment, or personal risk scores. Fixed texts (PE-04, respirator caveat, combustion caveat) are never model-written and never reworded.
   PE-04: "Follow your clinician's plan; seek urgent care if breathing is difficult or symptoms are severe."
   PE-02 caveat: "Some respirators make breathing harder. Ask your clinician if unsure." No masks for under-5s.
4. Policy rules P-01 to P-22 (README section 15 plus A-04, A-08, A-11, A-25, P-22) are inviolable. Each has unit tests and matrix coverage. Never add an exception.
5. Exposure and Emissions are independent. Never imply one from the other. Labels: Measured (unused in MVP), Estimated (formula), Recommended (qualitative). Banned: "saves the planet", unsourced percentages, promised health outcomes.
6. Stale or missing data lowers confidence and suppresses uncertain advice (P-03, P-04). Modelled data is always labelled Modelled. Sample data is always labelled Sample or Demo data. Never present sample data as live.
7. No free text to the LLM. No coordinates, location labels, names, exact ages or raw profile to the LLM.

## Architecture and layering
- src/domain: pure TS. No React, no browser APIs, no fetch, no storage, no Date.now()/Math.random() without injection. Imports nothing from data, ai, ui, state.
- src/data and src/ai import domain. src/ui imports domain, data, ai types and state. api/ imports domain and src/data/providers and src/ai (schema, validator, prompts) only.
- Types are defined once in src/domain/types.ts. Zod at every boundary (API request/response, provider response, storage read).

## Coding standards
- TypeScript strict. No `any` without a comment. No non-null assertions without a reason.
- Small pure functions, clear names, comments explain why and cite rule IDs (P-xx).
- No new runtime dependency without a one-line justification added to DECISIONS.md.
- Colours come from design tokens (src/styles/tokens.css); no hard-coded hex in components.
- Model and provider text is rendered as plain text. Never dangerouslySetInnerHTML.
- Error handling uses the taxonomy: DataUnavailable, DataStale, ProviderSchemaError, LlmUnavailable, LlmInvalid, GeolocationDenied, StorageUnavailable, RateLimited, ValidationError. No blank screens.

## Testing standards
- Domain tests need no mocks. Policy matrix enumerates programmatically and uses INDEPENDENT oracles (not the policy's own output). Every rule has a unit test and a matrix invariant.
- Provider contract tests use recorded fixtures. The LLM is mocked with good, malformed, malicious and partial fixtures.
- A phase is not done with failing, skipped or weakened tests. Never delete or loosen a test to make it pass; fix the code or ask.

## Accessibility standards (WCAG 2.2 AA; see docs/ACCESSIBILITY.md)
- Semantic landmarks and heading order; keyboard operable; visible focus; focus trap and return in dialogs.
- Risk level always as text + icon + colour. Touch targets >= 44 px. Works at 200% text and 360 px width.
- Plain language, grade 6 to 8. Reduced motion and dark mode honoured. Status via one polite live region.

## Security standards (see docs/SECURITY_PRIVACY.md)
- Secrets server-side only; no secret with a VITE_ prefix; keys never in URLs, logs or bundles.
- Validate all inputs (Zod, size caps, enums). Same-origin API; connect-src 'self'. Rate limit /api/*. No request-body logging.
- Location rounded to 2 dp. Profile stays in LocalStorage. Export and delete must work.

## Commit and repository standards
- Single branch: main. NEVER create branches, forks, PRs, or tags (except `attempt-N` when explicitly told).
- Conventional commits (feat, fix, test, docs, chore), one commit per phase with the exact message given.
- Repo under 10 MB (target 3 MB). No binaries over 50 KB, no build output, no .env.
- Before every commit run: npm run lint, typecheck, test, test:policy, build, check:size, scan:secrets, check:branches.

## Working method
1. Write a short plan first (files to touch, tests to add). Then implement.
2. Do only the scope given. If you find an out-of-scope bug, list it in your report; do not fix it silently.
3. Before declaring completion, REPORT: files changed, command outputs with pass/fail counts, each acceptance criterion with evidence, manual verification results, deviations and open questions. Do not commit if any check fails.
