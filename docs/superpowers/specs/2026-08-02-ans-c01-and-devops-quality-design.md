# ANS-C01 Exam Addition + DevOps Question Bank Quality Audit — Design

**Date:** 2026-08-02
**Status:** Approved by user

## Goal

1. Add the AWS Certified Advanced Networking – Specialty (ANS-C01) exam to xueba-pro with ~20 high-quality questions per domain (~80 total).
2. Audit and improve the quality of the existing DevOps Engineer – Professional (DOP-C02) question bank (505 questions), which already exceeds the per-domain count target.

User-supplied sample questions (5 for ANS-C01, 10 for DOP-C02) define the quality bar: long realistic scenario stems, distractors that fail for one precise technical reason, qualifier-driven asks ("MOST secure", "LEAST management overhead"), and multi-select variants ("Choose two/three").

## Part 1: ANS-C01 certification setup

### Certification config

Append to `data/certifications.json`:

```json
{
  "id": "aws-ans",
  "name": "AWS Certified Advanced Networking - Specialty",
  "code": "ANS-C01",
  "domains": [
    { "name": "Network Design", "weight": 30 },
    { "name": "Network Implementation", "weight": 26 },
    { "name": "Network Management and Operation", "weight": 20 },
    { "name": "Network Security, Compliance, and Governance", "weight": 24 }
  ],
  "totalQuestions": 65,
  "timeMinutes": 170,
  "passingScore": 750
}
```

These match the real ANS-C01 exam (65 questions, 170 minutes, 750/1000 scaled passing score, official domain weights).

No route changes needed: `/exam/[certId]/*` pages derive `generateStaticParams` from `certifications.json`.

### Cert-level helper refactor

The check `code.startsWith("SAP") || startsWith("DOP") || startsWith("AIP")` is duplicated in three files and has already broken once (AIP-C01 badge fix, commit 1a30786). Replace with a single helper:

- New file `src/lib/cert-level.ts` exporting `getCertLevel(code: string): "associate" | "professional" | "specialty"`.
  - Code prefix `SAP`, `DOP`, or `AIP` → `"professional"`; prefix `ANS` → `"specialty"`; otherwise `"associate"`. Future certs extend these prefix lists in one place.
  - Also export `getQuestionDifficulty(code): "associate" | "professional"` — maps `specialty` → `"professional"` (the `Question.difficulty` Zod enum stays unchanged; specialty exams are professional-depth).
- Consumers updated to use the helper:
  - `src/components/certification-card.tsx` — badge shows "Specialty" (default variant, same as Professional) for specialty certs.
  - `src/lib/generate-client.ts` — on-demand generation difficulty.
  - `scripts/generate-questions.ts` — build-time generation difficulty.
- Unit tests for the helper in `src/lib/__tests__/`.

## Part 2: Author ~80 ANS-C01 questions (20 per domain)

Questions are authored directly by Claude in this session (not via the generation script), written to `data/questions/aws-ans.json`, conforming to the existing `Question` Zod schema (`id` = first 12 hex chars of sha256 of `"aws-ans:" + stem`, matching the script's ID scheme).

### Style calibration (from user samples)

- Scenario stems ~100–180 words with concrete requirements (protocols, ports, Regions, scale numbers, constraints).
- Ask line: "Which solution will meet these requirements?" with qualifiers where appropriate ("MOST secure manner", "LEAST operational overhead", "MOST cost-effective").
- Distractors plausible but wrong for one specific, explainable reason (wrong listener type for mTLS passthrough, wrong CloudWatch metric name, missing route/IGW detail, service that doesn't support the feature).
- Mix: ~85% single-answer (4 options A–D), ~15% multiple-select (5 options A–E, "Choose two"), matching the existing banks' ratio.
- `difficulty: "professional"`, detailed `explanation` covering why the correct answer works **and why each distractor fails**, relevant `tags`.
- The user's 5 sample questions are cleaned up (OCR typos fixed: "duster" → "cluster", "VPAssorted"/"VPCreate" run-ons, "dally" → "daily", etc.), given full explanations, and included in the bank, counting toward their domains' 20.

### Topic coverage plan

- **Network Design (20):** edge services (CloudFront, Global Accelerator), load balancer selection (ALB vs NLB, TLS passthrough vs termination), DNS architectures (Route 53 public/private zones, resolver endpoints, routing policies), hybrid connectivity design (Direct Connect resiliency models, LAG, VIF types, Site-to-Site VPN, ECMP), inter-VPC connectivity (Transit Gateway, PrivateLink, peering trade-offs), multi-account/multi-Region design, IPv6 planning, IPAM.
- **Network Implementation (20):** BGP configuration and path selection (AS_PATH, local pref, MED, communities), DX/VPN implementation, Transit Gateway route tables and attachments, Route 53 Resolver rules and DNSSEC, VPC subnets/route tables/gateways implementation, EKS/ECS networking (CNI, ingress), Gateway Load Balancer insertion.
- **Network Management and Operation (20):** monitoring and analysis (CloudWatch network metrics, VPC Flow Logs, Traffic Mirroring, Reachability Analyzer, Network Access Analyzer, Transit Gateway Network Manager), automation (IaC for network resources), operational troubleshooting (MTU/jumbo frames, packet loss, route conflicts, DNS resolution failures), optimizing connectivity performance and cost.
- **Network Security, Compliance, and Governance (20):** traffic inspection (AWS Network Firewall, Gateway Load Balancer appliances), perimeter protection (WAF, Shield, DDoS), security groups vs NACLs, TLS/mTLS and ACM (including private CA), Route 53 Resolver DNS Firewall, VPC endpoint policies, centralized egress, compliance monitoring/logging (Flow Logs to central account, CloudTrail network events).

## Part 3: DOP-C02 quality audit

Structural checks already pass (verified: 0 duplicate IDs, 0 duplicate stems, 0 correct-answer keys missing from options; 470 single/35 multiple; 483×4-option/22×5-option). The audit targets content quality, benchmarked against the user's 10 samples.

### Process

1. Fan out reviewer subagents over `data/questions/aws-devops.json` in batches (~50 questions per reviewer), each flagging:
   - **Factual errors** — the keyed answer is wrong, or an "incorrect" distractor is actually valid.
   - **Ambiguity** — two options are defensibly correct, or the stem underspecifies the deciding constraint.
   - **Giveaway distractors** — options dismissible without domain knowledge (absurd, self-contradictory, or repeating the stem).
   - **Shallow stems** — no realistic scenario or deciding constraints, far below the sample benchmark.
   - **Weak explanations** — do not address why distractors fail.
2. Claude verifies each flag (adversarial second pass — flags are fixed only when confirmed), then fixes flagged questions in place: rewrite stems/options/explanations, or replace the question entirely if unsalvageable.
3. **ID stability:** questions that are fixed keep their existing `id` (even though stems change) so localStorage practice-progress history is not orphaned. Only replaced (new) questions get new IDs.
4. The user's 10 DOP-C02 samples are checked against the bank; any not already represented are cleaned up, given explanations, and added.

### Non-goals

- Not rewriting all 505 questions to sample length wholesale — only confirmed-flagged questions change.
- No changes to SAA/SAP/AIP banks.

## Validation

- All modified/new banks pass the Zod `QuestionSchema` (script check across every question).
- `npm run lint`, `npm run test`, `npm run build` all pass.
- Manual spot-check: `/exam/aws-ans` dashboard renders, practice and mock modes work, Specialty badge shows on the home card.

## Out of scope

- Additional DevOps questions beyond the samples (bank already at 505).
- Question generation script changes beyond the cert-level helper adoption.
- Schema changes to `Question` (difficulty enum stays associate/professional).
