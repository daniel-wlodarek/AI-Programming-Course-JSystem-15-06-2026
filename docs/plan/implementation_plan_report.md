# Hardware Service Decision Copilot - Implementation Report

Date: 2026-06-18  
Source plan: `docs/plans/implementation-plan.md`  
Application path: `app/`  
Branch: `feature/hardware-service-decision-copilot-prd`

## Summary

The full Hardware Service Decision Copilot PoC was implemented in `app/` as a Next.js 16 App Router application using TypeScript, Vercel AI SDK, AI SDK React, OpenRouter, Tailwind CSS, Vitest, Testing Library, Sharp, Zod, and Playwright.

The implemented flow supports one initial image upload for assessment, structured AI image analysis, structured preliminary service decision, and text-only follow-up chat. All user-facing product copy is in Polish. Chat image upload is not implemented and image data URLs are rejected by the chat API.

The final acceptance gate passed after `app/.env` was provided locally and real OpenRouter E2E tests were run.

## Implemented Scope

### T1 - App Scaffold

- Created the Next.js 16 application in `app/`.
- Added TypeScript, App Router, Tailwind CSS, ESLint, Vitest, Testing Library, Playwright, AI SDK packages, Zod, Sharp, and Lucide icons.
- Added initial app shell, Polish metadata, logo/favicon assets, and baseline smoke test.

Commit: `543df7f Frontend: scaffold Next.js app`

### T2 - Shared Contracts and Validation

- Added shared enums and contracts for request type, equipment category, decisions, confidence, assessment input, image analysis, decision result, active session, chat messages, and error responses.
- Added server validation for assessment fields and chat context.
- Added OpenRouter environment contract for API key, chat model, vision model, base URL, and optional attribution headers.
- Extended `.env.example`.

Commit: `0a60529 Backend: add shared contracts and validation`

### T3 - AI Pipeline Core

- Added policy loader and local policy document copies for build-safe server access.
- Added image-analysis, decision, and chat prompt builders.
- Added structured output schemas and validation.
- Added OpenRouter AI adapter boundary using Vercel AI SDK.
- Added deterministic mock adapter for unit/integration tests.
- Enforced separate model routing:
  - `OPENROUTER_VISION_MODEL` for image analysis.
  - `OPENROUTER_CHAT_MODEL` for structured decision and chat.

Commit: `50d5d23 Backend: add AI pipeline core`

### T4 - Intake Form

- Implemented Polish intake form UI.
- Added exact request types: `Reklamacja`, `Zwrot`.
- Added PRD equipment categories, equipment model/name, purchase date, reason, and single image upload.
- Enforced complaint reason, future-date blocking, accepted image formats, 10 MB client limit, and single-image behavior.

Commit: `5283e9a Frontend: add intake form`

### T5 - Assessment API

- Implemented image validation and processing with Sharp.
- Accepted JPEG, PNG, and WebP.
- Enforced max 10 MB before compression.
- Stripped metadata and resized longest edge to max 1600 px.
- Implemented `POST /api/assessment`.
- Returned structured active session on success.
- Returned Polish field errors on validation failure.
- Returned retryable Polish AI service errors without fabricating a decision.
- Tests prove invalid requests do not call the AI adapter.

Commit: `5518978 Backend: add assessment API`

### T6 - Frontend Assessment Flow

- Connected intake form to `/api/assessment`.
- Added processing state: `Analizujemy zdjęcie i przygotowujemy ocenę...`.
- Added retryable error UI and back-to-form flow.
- Stored active session only in browser memory.
- Rendered structured decision card with greeting, decision, justification, next steps, and disclaimer.
- Added visually distinct status label.

Commit: `3fd24ab Frontend: connect assessment flow`

### T7 - Chat API

- Implemented `POST /api/chat` with AI SDK-compatible streaming response.
- Validated active session, image analysis, initial decision enum, and latest user message.
- Rejected image bytes/data URLs in chat.
- Used the original matching policy for chat.
- Added retryable chat error handling.
- Included off-topic prompt rules that redirect back to the active case.

Commit: `a99b707 Backend: add chat API`

### T8 - Chat UI

- Implemented chat UI with AI SDK React `useChat` and `DefaultChatTransport`.
- Rendered initial decision and follow-up messages.
- Sent full non-binary active session with each message.
- Disabled composer during streaming.
- Added retry for failed chat turns.
- Added `Rozpocznij nowe zgłoszenie` to clear session and return to an empty form.
- Added revised recommendation label when model text indicates an update.

Commit: `a5e5d60 Frontend: add chat experience`

### T9 - Real OpenRouter E2E

- Added Playwright E2E fixtures:
  - clean product image,
  - damaged product image,
  - invalid file.
- Added seven critical E2E scenarios:
  - valid return reaches chat and shows decision card,
  - valid complaint reaches chat and shows AI decision response,
  - complaint without reason is blocked before submit,
  - unsupported file type shows accepted format error,
  - follow-up chat response is visible and long enough,
  - off-topic message gets case-scoped assistant response,
  - new request clears session and returns to empty form.
- E2E uses real frontend, real backend, and real OpenRouter API.
- No route mocking is used.
- No visual snapshots are used.

Commit: `b06a786 QA: add real API e2e coverage`

### QA Follow-up Fixes

- Removed unrelated `NO_COLOR` warning from E2E child processes.
- Added Playwright env loading from `app/.env` via Next's `@next/env`, per user request.
- Updated E2E preflight message to point to `app/.env`.
- Fixed streaming E2E timing by waiting until the assistant streaming indicator disappears before asserting response length and keywords.

Commits:

- `0d8bb77 QA: silence e2e color env warning`
- `1f3e011 QA: load e2e env from app env file`
- `e20d9fc QA: wait for streamed chat responses`

## Environment Configuration

The application and real E2E require these values:

```bash
OPENROUTER_API_KEY=...
OPENROUTER_CHAT_MODEL=openai/gpt-5.4-mini
OPENROUTER_VISION_MODEL=openai/gpt-5.4
```

For local E2E, the expected file is:

```bash
app/.env
```

`app/.env` is ignored and must not be committed. The committed template remains `app/.env.example`.

Optional supported values:

```bash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_URL=http://localhost:3000
OPENROUTER_APP_TITLE=Hardware Service Decision Copilot
```

## Verification Evidence

Final verification after the last E2E fix:

```bash
npm test
```

Result: 17 test files passed, 53 tests passed.

```bash
npm run lint
```

Result: passed.

```bash
npm run build
```

Result: passed with Next.js 16.2.9 and `.env` loaded.

```bash
npm run start -- --hostname 127.0.0.1 --port 3000
curl -I http://127.0.0.1:3000
```

Result: production server started and returned HTTP 200.

```bash
npm run e2e
```

Result: 7 Playwright E2E tests passed against the real app and real OpenRouter API.

Note: Playwright E2E had to be run outside the sandbox because Chromium launch is blocked by local macOS process restrictions inside the sandbox (`SIGTRAP` / `EPERM`).

## Final State

- The tracked worktree was clean after the final commit.
- Branch was ahead of origin by 14 commits after implementation and QA fixes.
- No push was performed.
- Ignored local artifacts included `app/.env`, `.next/`, `node_modules/`, and Playwright `test-results/`.

## Acceptance Gate Status

Complete.

All critical PRD flows are implemented, backend/frontend/E2E suites passed, real OpenRouter E2E passed with deterministic UI assertions, the app starts locally, and each implementation/QA phase has a focused commit.
