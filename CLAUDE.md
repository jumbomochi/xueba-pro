# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xueba-pro is an AI-powered practice exam generator for AWS professional certification exams (SAP, SAA, DevOps, etc.). It uses Claude to generate exam questions and provides practice mode with instant explanations and timed mock exam simulations. No backend server — runs entirely client-side as a static site.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with static export (`output: 'export'`)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui (new-york style)
- **Testing:** Vitest 4 (unit) + React Testing Library (component) + Playwright (E2E)
- **Validation:** Zod v4 (imported as `zod/v4`)
- **AI:** Anthropic Claude API — build-time generation script + browser SDK for on-demand
- **Runtime:** Node.js 25+, React 19

## Common Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build static export to out/
npm run start        # Serve static build (requires build first)
npm run lint         # ESLint
npm run test         # Run Vitest unit/component tests
npm run test:watch   # Run Vitest in watch mode
npm run test:e2e     # Run Playwright E2E tests (starts dev server automatically)
npx vitest run src/lib/__tests__/scoring.test.ts  # Run a single test file
npm run generate     # Generate question bank via Claude API (requires ANTHROPIC_API_KEY env var)
```

## Architecture

### Data Flow

Pre-generated questions live in `data/questions/{certId}.json`. Certification configs live in `data/certifications.json`. These are static JSON files imported at build time via `src/lib/data.ts` (which uses dynamic imports for code splitting). On-demand question generation calls Claude directly from the browser using the user's API key (stored in localStorage).

### State Management

Exam session state (current question, answers, timer) uses React Context (`src/contexts/exam-context.tsx`) + `useReducer` (`src/lib/exam-reducer.ts`). No external state library. All persistent data (progress history, API key) lives in localStorage via `src/lib/storage.ts`.

### Key Directories

- `src/app/` — Next.js App Router pages (dynamic routes use `generateStaticParams`)
- `src/components/` — React components (QuestionCard, ExamTimer, ExplanationPanel, etc.)
- `src/components/ui/` — shadcn/ui base components (do not edit directly)
- `src/lib/` — Business logic (scoring, question selection, storage, data loading, exam reducer)
- `src/contexts/` — React Context providers for exam session state
- `src/types/` — Zod schemas and TypeScript types (Question, Certification, ExamSession)
- `data/` — Static JSON question banks and certification configs
- `scripts/` — Build-time question generation script
- `e2e/` — Playwright E2E tests

### Page Routes and Static Generation

All dynamic routes (`/exam/[certId]/*`) use `generateStaticParams` for static export. Client-side pages that use hooks/context are split into a thin server wrapper (page.tsx with `generateStaticParams`) and a client component (e.g., `practice-client.tsx`).

- `/` — Certification selector
- `/exam/[certId]` — Exam dashboard (practice vs mock)
- `/exam/[certId]/practice` — Practice mode (one question, immediate feedback)
- `/exam/[certId]/mock` — Timed mock exam
- `/exam/[certId]/mock/results` — Score breakdown and review
- `/settings` — API key management and data clearing

### Key API Notes

- `isPassing(correct, total, passingScore)` takes raw counts, not percentages
- `selectQuestionsByDomain` throws if a domain has insufficient questions
- Zod schemas import from `"zod/v4"` — this is Zod v4's module path
- Next.js 15+: `params` is a `Promise` in server components — use `await params`

## Design Decisions

- **Static export only** — no server-side features. Deploys to any static hosting.
- **No auth** — all user data in localStorage. Auth may be added later.
- **Hybrid question generation** — pre-generated bank for instant access + on-demand for variety.
- **User owns their API key** — for on-demand generation, the key stays in localStorage and is only sent directly to Anthropic's API.
- **Server/client split for dynamic routes** — required because `generateStaticParams` cannot be exported from `"use client"` files.
