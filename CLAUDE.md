# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xueba-pro is an AI-powered practice exam generator for AWS professional certification exams (SAP, SAA, DevOps, etc.). It uses Claude to generate exam questions and provides practice mode with instant explanations and timed mock exam simulations. No backend server — runs entirely client-side as a static site.

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with static export (`output: 'export'`)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest (unit) + React Testing Library (component) + Playwright (E2E)
- **AI:** Anthropic Claude API — build-time question generation script + browser SDK for on-demand generation

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static export
npm run lint         # ESLint
npm run test         # Run Vitest unit/component tests
npm run test:e2e     # Run Playwright E2E tests
npx vitest run src/lib/__tests__/scoring.test.ts  # Run a single test file
npm run generate     # Generate question bank via Claude API (requires ANTHROPIC_API_KEY env var)
```

## Architecture

### Data Flow

Pre-generated questions live in `data/questions/{certId}.json`. Certification configs live in `data/certifications.json`. These are static JSON files imported at build time. On-demand question generation calls Claude directly from the browser using the user's API key (stored in localStorage).

### State Management

Exam session state (current question, answers, timer) uses React Context + `useReducer`. No external state library. All persistent data (progress history, API key, preferences) lives in localStorage.

### Key Directories

- `src/app/` — Next.js App Router pages
- `src/components/` — React components (QuestionCard, ExamTimer, ExplanationPanel, etc.)
- `src/lib/` — Business logic (scoring, timer, question shuffling, domain weighting)
- `src/contexts/` — React Context providers for exam session state
- `src/types/` — TypeScript interfaces (Question, Certification, ExamSession)
- `data/` — Static JSON question banks and certification configs
- `scripts/` — Build-time question generation script (`generate-questions.ts`)

### Question Generation

The `scripts/generate-questions.ts` script reads certification configs and generates questions proportional to each domain's exam weight. It validates output against the Question schema and writes to `data/questions/`. The script is idempotent — re-running grows the bank without duplicates.

Client-side on-demand generation uses the Anthropic JS SDK browser build. Questions are generated 5-10 at a time and cached in localStorage.

### Page Routes

- `/` — Certification selector
- `/exam/[certId]` — Exam dashboard (practice vs mock)
- `/exam/[certId]/practice` — Practice mode (one question, immediate feedback)
- `/exam/[certId]/mock` — Timed mock exam
- `/exam/[certId]/mock/results` — Score breakdown and review

## Design Decisions

- **Static export only** — no server-side features. The app deploys to any static hosting.
- **No auth** — all user data in localStorage. Auth may be added later.
- **Hybrid question generation** — pre-generated bank for instant access + on-demand for variety.
- **User owns their API key** — for on-demand generation, the API key stays in localStorage and is only sent directly to Anthropic's API.
