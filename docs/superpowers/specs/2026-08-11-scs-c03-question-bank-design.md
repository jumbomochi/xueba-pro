# SCS-C03 Question Bank — Design

**Date:** 2026-08-11
**Status:** Approved by user (design conversation, 2026-08-11)

## Goal

Add the AWS Certified Security – Specialty (SCS-C03) exam to xueba-pro: certification
config plus a 160-question pre-generated bank meeting the established quality bar.

## Background

SCS-C03 was released 2025-12-02. Official structure (per the AWS exam guide):

| Domain | Weight |
|---|---|
| Detection | 16% |
| Incident Response | 14% |
| Infrastructure Security | 18% |
| Identity and Access Management | 20% |
| Data Protection | 18% |
| Security Foundations and Governance | 14% |

65 questions, 170 minutes, passing score 750 (standard specialty format).

User supplied five examtopics SCS-C03 sample questions as the calibration bar for
style and difficulty; adapted versions of them are to be included in the bank.

## Decisions (from design conversation)

1. **Bank size: 160 questions**, allocated proportionally to domain weights:
   - Identity and Access Management: 32
   - Infrastructure Security: 29
   - Data Protection: 29
   - Detection: 26
   - Incident Response: 22
   - Security Foundations and Governance: 22

   This gives every domain ≥ 2.4× the questions a 65-question weight-proportioned
   mock exam draws (`selectQuestionsByDomain` throws on insufficient headroom).

2. **Samples: calibration + adaptation.** The five examtopics samples are rewritten
   (fresh stems, reconstructed options — originals reference images) and included.
   The two HOTSPOT/ordering samples become "select the correct ordered sequence of
   steps" single-choice items, since the app schema only supports `single`/`multiple`.

3. **Authoring: direct in-session** via six parallel subagents (one per domain),
   not the `npm run generate` script. Rationale: bulk generation historically
   produced systematic defects (379/505 DevOps explanations rewritten; SAA
   letter-drift in 487/510).

## Question format

- Schema: existing `QuestionSchema` (`src/types/question.ts`) — no schema changes.
- `certificationId: "aws-scs"`, `difficulty: "professional"` throughout.
- `type`: ~80% `single`, ~20% `multiple` (matching real exam mix).
- `id`: first 12 hex chars of sha256(`"aws-scs:" + stem`).
- Stems: 100–180-word scenarios with concrete deciding constraints; qualifiers
  ("MOST secure", "LEAST operational overhead") whenever two options would
  otherwise both be defensible.
- Explanations address **every** option key with one precise failure reason each.
- Tags: 3–6 AWS service/concept tags per question.

## Quality gates (must pass before commit)

Mechanical validation script (scratchpad, not committed):

1. Zod schema validity for every question.
2. Even keyed-answer distribution across letters, checked per domain and overall
   (the app never shuffles options; target ~even split, e.g. 4/4/4/5 per 20).
3. Key:distractor word-length ratio ≈ 1.0 (keyed option must not be systematically
   longest).
4. Every option letter is addressed in its explanation; no "Option X" letter-drift
   (each "Option X (…)" parenthetical matches the option text at that letter).
5. Unique IDs matching the sha256 scheme; correct domain counts per allocation.

Then an independent adversarial answer-key review: fresh subagents (one per domain)
that only verify correctness of keys against current AWS behavior. Fixes for wrong
keys swap option *texts* onto the already-keyed letter rather than changing
`correctAnswers` (preserves distribution and localStorage progress validity).

Fact-currency watchlist: verify against 2024–2026 AWS changes (exam is post-Dec-2025
scope) — e.g. TGW security-group referencing, ALB mTLS, ACM exportable public certs,
GuardDuty/Security Hub/Inspector feature evolution, IAM Identity Center replacing
"AWS SSO" naming.

## Integration

- `data/certifications.json`: add `aws-scs` entry (code SCS-C03, 6 domains/weights
  above, 65 questions, 170 min, passing 750).
- `data/questions/aws-scs.json`: the 160-question bank.
- **No app code changes** — routes derive from `certifications.json` via
  `generateStaticParams`.

## Verification

- `npm run test`, `npm run lint`, `npm run build` all pass.
- Static build includes `/exam/aws-scs/*` routes.
- Headroom check: every domain count ≥ its share of a 65-question mock.

## Out of scope

- New question types (hotspot/ordering UI).
- Changes to generation script, schema, or app components.
- Banks for other exams.
