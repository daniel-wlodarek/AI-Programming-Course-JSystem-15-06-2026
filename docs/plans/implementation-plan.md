# Detailed Multi-Agent Work Plan: Hardware Service Decision Copilot PoC

## 0. Locked Decisions

- App location: `app/`.
- Stack: Next.js 16 App Router, TypeScript, Vercel AI SDK, AI SDK React/UI, OpenRouter, Tailwind, Vitest, Testing Library, Playwright.
- Design source: current `docs/design-guidelines.md`, current assets, current wireframes.
- Image scope: exactly one image in the initial intake form only. Chat is text-only.
- Unit/integration tests: mock external LLM API.
- E2E tests: use real OpenRouter API, real frontend, real backend, no endpoint mocking.
- E2E assertions: deterministic UI assertions only; do not assert exact AI decision correctness.
- E2E visual testing: no visual snapshots, no screenshot-based blocking tests.
- Every implementation step: TDD first, verify, commit.
- Only these agents implement: `@frontend-nextjs-developer`, `@be-developer`, `@qa-engineer`.

## 1. Coordination Rules

| Area | Owner | Files |
|---|---|---|
| Backend contracts, validation, AI, APIs | `@be-developer` | `app/src/shared/**`, `app/src/server/**`, `app/src/app/api/**` |
| Frontend UI and client state | `@frontend-nextjs-developer` | `app/src/features/**`, `app/src/components/**`, `app/src/app/page.tsx`, styles |
| E2E and QA fixtures | `@qa-engineer` | `app/tests/e2e/**`, `app/tests/fixtures/**`, Playwright config |
| App scaffold/tooling | `@frontend-nextjs-developer` first, backend may extend after | `app/package.json`, configs |

Conflict rules:

- Do not edit `.env`; only `.env.example`.
- Do not touch unrelated existing dirty files unless the task explicitly requires it.
- If `frontend-nextjs-developer` config says `frontend/`, override it in every prompt: this project uses `app/`.
- If PRD/ADR conflicts with wireframes, PRD/ADR wins. Specifically: no image upload in chat.

## 2. Dependency Matrix

| ID | Agent | Task | Depends on | Parallel? | Commit |
|---|---|---|---|---|---|
| P0 | orchestrator | Confirm clean baseline / protect existing dirty files | none | no | none |
| T1 | frontend | Scaffold Next.js app and tooling | P0 | no | `Frontend: scaffold Next.js app` |
| T2 | backend | Shared types, env contract, validation | T1 | no | `Backend: add shared contracts and validation` |
| T3 | backend | Policy loader, prompts, AI adapter, structured decision validation | T2 | with T5 | `Backend: add AI pipeline core` |
| T4 | frontend | Design shell, Polish copy, intake form tests and UI | T2 | with T3 | `Frontend: add intake form` |
| T5 | backend | Image processing and `/api/assessment` | T3 | no | `Backend: add assessment API` |
| T6 | frontend | Submit flow, processing/error state, decision card | T4, T5 | no | `Frontend: connect assessment flow` |
| T7 | backend | `/api/chat` streaming API | T3, T5 | with T6 after API contracts stable | `Backend: add chat API` |
| T8 | frontend | Chat UI using AI SDK React | T6, T7 | no | `Frontend: add chat experience` |
| T9 | QA | Real OpenRouter E2E fixtures and critical tests | T8 | no | `QA: add real API e2e coverage` |
| T10 | backend/frontend | Fix QA defects, one commit per defect group | T9 | no | `Backend:` / `Frontend:` |
| T11 | QA | Final full verification | T10 | no | optional `QA:` only if files changed |

## 3. Agent Prompts

### T1 Prompt - Scaffold

Agent: `@frontend-nextjs-developer`

Read only:

- `AGENTS.md`
- `app/README.md`
- `docs/ADR/000-main-architecture.md` sections 3-5, 8, 11
- `docs/ADR/002-frontend-session-ui.md` sections 2-3, 8
- `docs/design-guidelines.md`

Task:

- Work in `app/`, not `frontend/`.
- Scaffold Next.js 16 with TypeScript, App Router, `src/`, Tailwind, ESLint, npm.
- Add Vitest, Testing Library, Playwright, AI SDK packages, `zod`, `sharp`, and icon/UI dependencies needed by the ADRs.
- Add initial app shell only; no business feature yet.
- Add minimal tests that prove the test runner works.
- Run `npm test`, `npm run lint`, `npm run build`, and start the app once.
- Commit: `Frontend: scaffold Next.js app`.

### T2 Prompt - Shared Contracts and Validation

Agent: `@be-developer`

Read only:

- `AGENTS.md`
- `docs/PRD-Product-Requirements-Document.md` sections 6, 8, 11
- `docs/ADR/000-main-architecture.md` sections 6-8
- `docs/ADR/003-api-validation-image-handling.md` sections 3-5, 8
- `.env.example`

Task:

- Write failing tests first.
- Add shared enums/types for request type, equipment categories, decision enum, `AssessmentInput`, `ImageAnalysis`, `DecisionResult`, `ActiveSession`.
- Add server validation for assessment fields and chat context.
- Extend `.env.example` with `OPENROUTER_CHAT_MODEL`, `OPENROUTER_VISION_MODEL`, optional attribution vars.
- Validate required OpenRouter envs in server code.
- Do not read `.env`.
- Run tests/lint/build.
- Commit: `Backend: add shared contracts and validation`.

### T3 Prompt - AI Pipeline Core

Agent: `@be-developer`

Read only:

- `docs/ADR/001-ai-decision-pipeline.md`
- `docs/ADR/000-main-architecture.md` sections 3, 6, 8-9
- `docs/policies/polityka-zwrotow.md`
- `docs/policies/polityka-reklamacji.md`

Task:

- Write failing tests for policy selection, prompt branch selection, decision schema validation, invalid model output, and off-topic prompt rules.
- Implement server-only policy loader.
- Implement return/complaint image prompt builders.
- Implement decision and chat prompt builders.
- Implement OpenRouter adapter boundary using Vercel AI SDK.
- Implement deterministic mock adapter for unit/integration tests only.
- Enforce separate model roles: vision uses `OPENROUTER_VISION_MODEL`; decision/chat use `OPENROUTER_CHAT_MODEL`.
- No API routes yet.
- Run tests/lint/build.
- Commit: `Backend: add AI pipeline core`.

### T4 Prompt - Intake Form

Agent: `@frontend-nextjs-developer`

Read only:

- `docs/PRD-Product-Requirements-Document.md` AC-01 through AC-11 and section 9.1
- `docs/ADR/002-frontend-session-ui.md`
- `docs/design-guidelines.md`
- `assets/Wireframe-2-wstepna-decyzja-czat.png` as the form wireframe reference

Task:

- Write component tests first.
- Implement Polish copy constants.
- Implement request type selector with exactly `Reklamacja` and `Zwrot`.
- Implement exact category list from PRD.
- Implement model field, purchase date field, reason textarea, single image upload.
- Complaint reason required; return reason optional.
- Future date blocked.
- JPEG/PNG/WebP only, max 10 MB client validation.
- One image only; selecting another replaces or blocks consistently and is tested.
- Use current dark design tokens.
- No backend connection yet except typed callback.
- Run tests/lint/build.
- Commit: `Frontend: add intake form`.

### T5 Prompt - Assessment API

Agent: `@be-developer`

Read only:

- `docs/PRD-Product-Requirements-Document.md` AC-01 through AC-22, AC-29 through AC-31
- `docs/ADR/003-api-validation-image-handling.md`
- `docs/ADR/001-ai-decision-pipeline.md` sections 3-5

Task:

- Write route/integration tests first.
- Implement image validation and Sharp compression: JPEG/PNG/WebP, max 10 MB before compression, metadata stripped, longest edge max 1600 px.
- Implement `POST /api/assessment`.
- On success return `AssessmentSuccessResponse`.
- On validation failure return Polish field errors.
- On AI failure return retryable Polish service error and no decision.
- Never persist original image bytes.
- Tests must prove invalid requests do not call OpenRouter.
- Run tests/lint/build/start.
- Commit: `Backend: add assessment API`.

### T6 Prompt - Frontend Assessment Flow

Agent: `@frontend-nextjs-developer`

Read only:

- `docs/PRD-Product-Requirements-Document.md` AC-20 through AC-22, AC-27 through AC-31
- `docs/ADR/002-frontend-session-ui.md` sections 3-6
- `docs/ADR/003-api-validation-image-handling.md` response contracts
- `assets/Wireframe-1-formularz-zgloszeniowy.png` as the initial decision chat reference

Task:

- Write tests first.
- Connect intake form to `/api/assessment`.
- Add processing state: `Analizujemy zdjęcie i przygotowujemy ocenę...`.
- Add retryable assessment error state.
- Store active session only in browser memory.
- Render decision card from structured `DecisionResult`.
- Required display order: greeting, decision, justification, next steps, disclaimer.
- Status label must be visually distinct.
- Run tests/lint/build/start.
- Commit: `Frontend: connect assessment flow`.

### T7 Prompt - Chat API

Agent: `@be-developer`

Read only:

- `docs/PRD-Product-Requirements-Document.md` AC-23 through AC-26
- `docs/ADR/001-ai-decision-pipeline.md` chat sections
- `docs/ADR/003-api-validation-image-handling.md` `POST /api/chat`

Task:

- Write failing tests first.
- Implement `POST /api/chat` with AI SDK-compatible streaming.
- Validate active session, image analysis, initial decision enum, latest user message.
- Reject image bytes/data URLs in chat.
- Use matching original policy only.
- Provider failure creates retryable chat error.
- Off-topic prompt must decline and redirect to case.
- Run tests/lint/build/start.
- Commit: `Backend: add chat API`.

### T8 Prompt - Chat UI

Agent: `@frontend-nextjs-developer`

Read only:

- `docs/PRD-Product-Requirements-Document.md` sections 4.7, 9.3, 11
- `docs/ADR/002-frontend-session-ui.md`
- `docs/ADR/001-ai-decision-pipeline.md` chat context rules
- `assets/Wireframe-3-rewizja-rekomendacji-czat.png` as chat revision reference, but do not implement chat image upload

Task:

- Write tests first.
- Use AI SDK React/UI primitives for chat state/streaming.
- Render initial assistant message and follow-up messages.
- Send full non-binary `ActiveSession` with each message.
- Disable composer during streaming.
- Add retry on failed chat turn.
- Add `Rozpocznij nowe zgłoszenie`, clearing form/session/messages.
- Support revised recommendation display when model text indicates update.
- Run tests/lint/build/start.
- Commit: `Frontend: add chat experience`.

### T9 Prompt - Real API E2E

Agent: `@qa-engineer`

Read only:

- `docs/PRD-Product-Requirements-Document.md` AC list
- `docs/ADR/002-frontend-session-ui.md` state machine
- `docs/ADR/003-api-validation-image-handling.md` API contracts
- `docs/design-guidelines.md`

Task:

- Use real app server and real OpenRouter API. No route mocking.
- Add Playwright fixtures: clean product image, damaged product image, invalid file.
- Add env preflight. If OpenRouter env vars are missing, fail clearly with setup instructions.
- Do not assert exact AI correctness.
- Assert UI-level evidence:
  - assistant bubble exists,
  - response length >= 50 chars,
  - at least one keyword exists.
- Keyword list:
  - general: `decyzja`, `ocena`, `wstępna`, `niewiążąca`, `serwis`
  - return: `zwrot`, `zwrócić`, `towar`, `14 dni`
  - complaint: `reklamacja`, `usterka`, `naprawa`, `wymiana`
  - rejection/negative: `odrzuc`, `nie kwalifikuje`, `uszkodzenie`, `mechaniczne`
  - conditional: `warunk`, `diagnoz`, `pomniejszenie`
- No visual snapshots.
- Commit: `QA: add real API e2e coverage`.

Required E2E scenarios:

- E2E-01: valid return submission reaches chat and shows decision card.
- E2E-02: valid complaint submission reaches chat and shows AI decision response.
- E2E-03: complaint without reason is blocked before submit.
- E2E-04: unsupported file type shows accepted format error.
- E2E-05: service/chat response is visible and long enough after user follow-up.
- E2E-06: off-topic user message gets a case-scoped assistant response.
- E2E-07: `Rozpocznij nowe zgłoszenie` clears session and returns to empty form.

### T10 Prompt - Defect Fix Loop

Agent: assigned by defect type

Task:

- One defect group per task.
- Reproduce failing test first.
- Add/adjust test before fix.
- Fix minimally.
- Run targeted test plus full relevant suite.
- Commit with `Backend:` or `Frontend:` prefix.

### T11 Prompt - Final QA Gate

Agent: `@qa-engineer`

Task:

- Run full app verification:
  - `npm test`
  - `npm run lint`
  - `npm run build`
  - Playwright E2E with real OpenRouter env
  - start app and complete one manual smoke
- Confirm:
  - no chat image upload,
  - all visible product copy is Polish,
  - `.env` was not read or committed,
  - no fabricated decision on AI failure,
  - git status contains only expected committed work and known pre-existing user changes.
- Produce final QA report.

## 4. E2E Rules

E2E tests must use real OpenRouter. They should not check whether the AI made the legally correct decision. They should check that the app produced a plausible, visible AI response and preserved the UX contract.

Pass criteria for AI response:

- Chat screen appears.
- Assistant message exists.
- Text length is at least 50 characters.
- Mandatory disclaimer appears for decision messages: text matching `wstępna` and `niewiążąca` or equivalent.
- At least one keyword from the relevant list appears.
- No raw JSON, stack trace, or provider error is visible.

Failure criteria:

- Missing env vars.
- No assistant response.
- Response too short.
- UI stuck in loading state.
- English core product copy visible.
- Chat allows image upload.
- App fabricates decision after provider failure.

## 5. Acceptance Gate

The PoC is complete only when:

- All critical PRD flows are implemented.
- Backend, frontend, and E2E test suites pass.
- Real OpenRouter E2E passes with deterministic UI assertions.
- App starts locally.
- Every phase has a focused commit.
- No implementation agent had to make product or architecture decisions not specified in this plan.
