# DEA-C01 Question Bank — Design

**Date:** 2026-08-14
**Status:** Complete — 199-question bank built and verified 2026-08-15

## Goal

Add the AWS Certified Data Engineer – Associate (DEA-C01) exam to xueba-pro. This
document records the official exam structure and the authoring decisions. The first
increment is a small benchmark seed (8 questions) for calibration review; the full
bank follows once the seed is accepted.

## Background

Official structure, per the AWS exam guide **Version 1.1 (published 2025-12-12)** —
the current live version:

| Domain | Weight |
|---|---|
| Data Ingestion and Transformation | 34% |
| Data Store Management | 26% |
| Data Operations and Support | 22% |
| Data Security and Governance | 18% |

65 questions (50 scored, 15 unscored), 130 minutes, passing score 720 on a 100–1,000
scale. Response types are multiple choice and multiple response.

Task statements per domain:

- **D1:** 1.1 Perform data ingestion · 1.2 Transform and process data · 1.3
  Orchestrate data pipelines · 1.4 Apply programming concepts
- **D2:** 2.1 Choose a data store · 2.2 Understand data cataloging systems · 2.3
  Manage the lifecycle of data · 2.4 Design data models and schema evolution
- **D3:** 3.1 Automate data processing by using AWS services · 3.2 Analyze data by
  using AWS services · 3.3 Maintain and monitor data pipelines · 3.4 Ensure data
  quality
- **D4:** 4.1 Apply authentication mechanisms · 4.2 Apply authorization mechanisms ·
  4.3 Ensure data encryption and masking · 4.4 Prepare logs for audit · 4.5
  Understand data privacy and governance

### Version 1.1 scope changes to author against

Version 1.1 consolidated the v1.0 "knowledge of" / "skills in" lists into single skill
lists and added generative-AI and vector content:

- Skill 1.2.10: integrate large language models for data processing
- Skill 2.1.7: manage open table formats (Apache Iceberg)
- Skill 2.1.8: describe vector index types (HNSW, IVF)
- Skill 2.2.6: create and manage business data catalogs (Amazon SageMaker Catalog)
- Skill 2.4.6: describe vectorization concepts (Amazon Bedrock knowledge bases)
- Skill 4.1.7: domains, domain units, and projects for SageMaker Unified Studio
- Skill 4.5.6: manage data access through SageMaker Catalog projects
- Skill 4.5.7: describe governance data frameworks and data sharing patterns

Services **added** to the in-scope list: Amazon Aurora, Amazon Q, Amazon Bedrock,
Amazon Kendra, AWS Data Exchange, Amazon S3 Tables. Services **removed** from
in-scope: AWS Cloud9, AWS CodeCommit, AWS Schema Conversion Tool (schema conversion
is now DMS Schema Conversion, per Skill 2.4.3). Do not write questions keyed on AWS
SCT, Cloud9, or CodeCommit.

## Decisions

1. **18 hand-authored anchor questions.** Eight recalibrated seed items (Kinesis
   enhanced fan-out, Glue small files and job bookmarks, Iceberg row-level DELETE and
   time travel, pgvector HNSW vs IVFFlat, Athena partition projection, EMR Spark skew,
   Lake Formation data filters, Macie + Glue PII redaction) plus ten items adapted
   from the user's real exam samples. Adapted samples are rewritten rather than copied,
   and one distractor was replaced because it named AWS CodeCommit, which v1.1 removed
   from the in-scope list.

2. **Full bank target: 200 questions**, allocated proportionally to domain weights:
   - Data Ingestion and Transformation: 68
   - Data Store Management: 52
   - Data Operations and Support: 44
   - Data Security and Governance: 36

   Every domain then has ≥ 3× the questions a 65-question weight-proportioned mock
   exam draws (`selectQuestionsByDomain` throws when a domain lacks headroom).

3. **`difficulty: "associate"`** throughout — `getCertLevel("DEA-C01")` in
   `src/lib/cert-level.ts` returns `associate` because DEA is not in
   `PROFESSIONAL_PREFIXES` or `SPECIALTY_PREFIXES`. This is correct and needs no
   change to `cert-level.ts`.

4. **Authoring: direct in-session**, not `npm run generate`. Bulk generation
   historically produced systematic defects (379/505 DevOps explanations rewritten;
   SAA letter-drift in 487/510).

## Question format

- Schema: existing `QuestionSchema` (`src/types/question.ts`) — no schema changes.
- `certificationId: "aws-dea"`, `difficulty: "associate"`.
- `type`: ~80% `single` (4 options, 1 answer), ~20% `multiple` (5 options, 2 answers,
  stem ends "(Choose two.)").
- `id`: first 12 hex chars of sha256(`"aws-dea:" + stem`).
- Explanations address **every** option key with one precise failure reason each,
  using the literal forms `X is correct` / `X is wrong because` so gates can grep them.
- Tags: 3–6 AWS service/concept tags per question.

### Stem calibration — corrected 2026-08-14 against real exam samples

The user supplied ten real DEA-C01 samples. They forced a significant recalibration:

**Stems are 35–90 words, not the 100–180 used by the SAP/SCS professional banks.**
DEA is an associate exam and its items are markedly terser — the shortest sample is a
35-word stem. The first seed pass was written at professional length and was rewritten.

Other conventions taken from the samples:

- Options run 5–45 words and are parallel in form. Bare service names ("A. AWS Step
  Functions") are a legitimate option style when the question is a service choice.
- Multi-sentence imperative options are idiomatic: "Use Amazon S3 for data storage.
  Use Amazon Athena for data analysis."
- Closing sentence uses fixed forms: "Which solution will meet these requirements?",
  "…with the LEAST operational overhead?", "…with the LEAST operational effort?",
  "Which AWS service or feature will meet these requirements MOST cost-effectively?",
  "Which combination of AWS services will …? (Choose two.)"
- The samples carry no explanations (examtopics-style). Per-option explanations are a
  xueba-pro addition and remain the standard here.

The binding contract handed to authoring agents lives at
`$CLAUDE_JOB_DIR/tmp/CALIBRATION.md` during a build.

## Quality gates (must pass before commit)

Mechanical validation script (scratchpad, not committed):

1. Zod schema validity for every question; `type` matches `correctAnswers` arity.
2. Even keyed-answer distribution across letters (the app never shuffles options).
3. Key:distractor word-length ratio ≈ 1.0 — checked in **both** directions, since a
   systematically *shorter* keyed option is as exploitable as a longer one. The seed
   pass initially came in at 0.81 and was corrected to 1.07.
4. Every option letter addressed in its explanation; no "Option X" letter-drift.
5. Unique IDs matching the sha256 scheme; correct domain counts per allocation.

Then an independent adversarial answer-key review verifying keys against current AWS
behavior. Fixes for wrong keys swap option *texts* onto the already-keyed letter
rather than changing `correctAnswers`, which preserves letter distribution and
localStorage progress validity.

Fact-currency watchlist for this exam: Amazon Kinesis Data Firehose renamed Amazon
Data Firehose; Amazon QuickSight now branded Amazon Quick; SageMaker Unified Studio
and SageMaker Catalog replacing Amazon DataZone naming; Glue 5.0 defaults; S3 Tables
as managed Iceberg; AWS SCT superseded by DMS Schema Conversion.

## Integration

- `data/certifications.json`: `aws-dea` entry (DEA-C01, four domains above, 65
  questions, 130 min, passing 720).
- `data/questions/aws-dea.json`: the bank.
- `src/lib/data.ts`: dynamic import entry for `aws-dea`.
- `src/lib/__tests__/validate-questions.test.ts`: bank registered in `banks`.
- No other app code changes — routes derive from `certifications.json` via
  `generateStaticParams`.

## Outcome

Final bank: **199 questions** — 68 / 52 / 43 / 36 across the four domains, 160
`single` and 39 `multiple`. Mock mode is viable with 3.0–3.1× headroom in every
domain (a 65-question mock draws 22/17/14/12).

Authoring ran as four parallel domain subagents against `CALIBRATION.md`, plus 18
hand-authored anchors. One cross-domain near-duplicate was dropped at merge, and one
more was caught later by review (see below), landing at 199 rather than the planned
200. No filler question was written to round the number up.

### Adversarial key review results

Four independent per-domain reviewers checked all keys. **Zero wrong answer keys.**
Seven findings, all in the justifications for *wrong* options — the failure class the
mechanical gates cannot detect:

1. "Redshift Spectrum cannot use an external Hive metastore" — false; `CREATE EXTERNAL
   SCHEMA ... FROM HIVE METASTORE` is supported.
2. "Cannot prune on date alone" for a nested partition — false; Athena pushes filters
   on any partition column. The real cost is partition metadata retrieval.
3. Firehose sources enumerated as Direct PUT / KDS / MSK — stale since database CDC
   sources became generally available.
4. "Glue Standard workers have less memory than G types" — false against G.1X; both
   are 1 DPU / 16 GB. Standard packs two executors onto one DPU and 50 GB of disk.
5. Secrets Manager **managed rotation** applies only to secrets a service creates and
   owns; the stem was tightened to the RDS master-user-password integration.
6. A Redshift dynamic data masking policy attached to *both* roles would mask for
   both; the option now attaches it to the analyst role only.
7. A duplicate QuickSight/SPICE question was removed.

### Length-bias correction

The first merged bank had the keyed option as the longest option in only 3.7% of
single-answer questions against a 25% chance rate — "eliminate the longest option"
would have been right 96% of the time. Fixed by trimming 42 over-long distractors
(never by padding keys, which would reintroduce the opposite tell). Final
distribution by key length rank: 20.6% / 26.9% / 18.8% / 33.8%.

**Note for future banks:** the earlier SAP/SCS guidance to avoid keys being longest
caused authoring agents to overshoot into a *reverse* bias. The instruction should
target ~25% longest, not "never longest".

### Source of truth

After the merge, `data/questions/aws-dea.json` is the source of truth. Re-running the
merge script from the per-domain agent files would discard the review fixes and the
length rebalancing.

## Out of scope

- New question types (the exam guide implies only multiple choice/response, which the
  schema already covers).
- Changes to the generation script, schema, or app components.
- Banks for other exams.
