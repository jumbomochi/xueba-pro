# xueba-pro Design Document

**Date:** 2026-02-22
**Status:** Approved

## Overview

xueba-pro is an AI-powered practice exam generator for AWS professional certification exams. It generates exam questions using Claude and provides both practice mode (with immediate feedback) and timed mock exam simulations.

## Requirements

- **Platform:** Web application (Next.js, static export)
- **Content:** AI-generated questions via Claude API
- **Exam scope:** Multiple AWS certifications (SAP, SAA, DevOps, etc.)
- **Core features:** Practice mode with explanations, timed mock exams
- **Auth:** None initially — localStorage for all persistence
- **AI strategy:** Pre-generated question bank + on-demand client-side generation

## Tech Stack

- **Framework:** Next.js 14+ (App Router), static export
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest + React Testing Library + Playwright
- **AI:** Anthropic Claude API (build script + browser SDK)
- **Deployment:** Vercel / any static hosting

## Data Model

### Question

```typescript
interface Question {
  id: string;
  certificationId: string;
  domain: string;
  difficulty: "associate" | "professional";
  type: "single" | "multiple";
  stem: string;
  options: { key: string; text: string }[];
  correctAnswers: string[];
  explanation: string;
  tags: string[];
}
```

### Certification

```typescript
interface Certification {
  id: string;
  name: string;
  code: string;
  domains: { name: string; weight: number }[];
  totalQuestions: number;
  timeMinutes: number;
  passingScore: number;
}
```

### Storage

- Pre-generated questions: `data/questions/{certificationId}.json`
- Certification configs: `data/certifications.json`
- User data: localStorage (API key, progress, cached on-demand questions)

## Page Structure

| Route | Purpose |
|-------|---------|
| `/` | Home — certification selector grid |
| `/exam/[certId]` | Exam dashboard — choose practice or mock, domain breakdown |
| `/exam/[certId]/practice` | Practice mode — one question, immediate feedback |
| `/exam/[certId]/mock` | Mock exam — timed full-length simulation |
| `/exam/[certId]/mock/results` | Results — score, per-domain breakdown, review |
| `/settings` | API key management, clear progress, preferences |

## Core Components

- **QuestionCard** — renders question with selectable options (single/multi-select)
- **ExplanationPanel** — correct answer + detailed explanation (practice mode)
- **ExamTimer** — countdown timer with pause/resume (mock mode)
- **ProgressBar** — question progress indicator (e.g., 23/75)
- **DomainChart** — per-domain performance visualization
- **CertificationCard** — cert selector card on home page

## State Management

- React Context + `useReducer` for exam session state
- localStorage for persisted data (history, API key, preferences)
- No external state management library

## AI Question Generation

### Pre-generation (build-time)

Script at `scripts/generate-questions.ts`:
- Reads certification configs (domains, weights, exam style)
- Generates questions proportional to domain weights
- Uses structured prompts with exam-specific context
- Validates output against Question schema
- Writes to `data/questions/{certId}.json`
- Idempotent — grows bank without duplicates

### On-demand (client-side)

- User provides Claude API key (stored in localStorage)
- Anthropic JS SDK browser build calls Claude directly
- Generates 5-10 questions per request for selected domain
- Results cached in localStorage

### Prompt Strategy

- System prompt as certification exam question writer
- Includes domain name, difficulty, format requirements
- Scenario-based questions for professional-level certs
- Explanations reference AWS documentation concepts
- JSON output via structured tool use

## UI/UX

- Dark/light mode (system preference default)
- Mobile-responsive design
- Distraction-free exam mode
- Color-coded feedback (green=correct, red=incorrect, blue=explanation)

## Testing

- **Unit:** Vitest — scoring logic, timer, domain weighting, question shuffling
- **Component:** React Testing Library — QuestionCard, form state
- **E2E:** Playwright — practice session flow, mock exam flow
- **Validation:** Schema checks on pre-generated questions at build time

## Deployment

- Static export via `output: 'export'` in next.config
- Zero-server deployment to Vercel, Netlify, GitHub Pages, or Cloudflare Pages
