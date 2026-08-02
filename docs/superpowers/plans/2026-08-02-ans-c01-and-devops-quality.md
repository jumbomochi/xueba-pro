# ANS-C01 Exam + DevOps Quality Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the AWS Certified Advanced Networking – Specialty (ANS-C01) exam with 80 authored questions (20/domain), and audit/fix the existing 505-question DOP-C02 bank against the user's quality benchmark.

**Architecture:** Static-export Next.js app; certifications and question banks are static JSON imported via `src/lib/data.ts`. New cert level logic is centralized in a new `src/lib/cert-level.ts` helper. Questions are authored as draft JSON (no IDs) and appended to the bank by a scratchpad script that computes sha256-based IDs and enforces style/structure invariants. The DevOps audit fans out reviewer subagents over question batches, verifies flags adversarially, then fixes confirmed flags in place (IDs preserved).

**Tech Stack:** Next.js 16 (static export), TypeScript strict, Zod v4 (`zod/v4`), Vitest 4, Node 25.

## Global Constraints

- Zod imports MUST use `"zod/v4"`.
- `Question.difficulty` enum stays `["associate", "professional"]` — no schema changes. ANS questions use `"professional"`.
- ANS question IDs: `sha256("aws-ans:" + stem)` hex, first 12 chars (same scheme as `scripts/generate-questions.ts:16-21`).
- Fixed DevOps questions KEEP their existing `id` (localStorage progress references them). Only brand-new questions get new IDs.
- Question style bar (from user samples): scenario stem ~100–180 words with concrete constraints; single best answer defensible against every distractor; each distractor wrong for one precise, explainable reason; explanation addresses the correct answer AND every distractor; qualifier phrasing ("MOST secure", "LEAST operational overhead") when two options are otherwise close.
- Mix per ANS domain: 17 single-answer (4 options A–D) + 3 multiple-select (5 options A–E, stem ends "(Choose two.)" or "(Choose three.)").
- Scratchpad dir for temp files: use the session scratchpad, referred to below as `$SCRATCH`.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: `getCertLevel` helper (TDD)

**Files:**
- Create: `src/lib/cert-level.ts`
- Test: `src/lib/__tests__/cert-level.test.ts`

**Interfaces:**
- Produces: `getCertLevel(code: string): "associate" | "professional" | "specialty"` and `getQuestionDifficulty(code: string): "associate" | "professional"` — consumed by Task 2.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/cert-level.test.ts
import { describe, it, expect } from "vitest";
import { getCertLevel, getQuestionDifficulty } from "@/lib/cert-level";

describe("getCertLevel", () => {
  it("classifies professional codes", () => {
    expect(getCertLevel("SAP-C02")).toBe("professional");
    expect(getCertLevel("DOP-C02")).toBe("professional");
    expect(getCertLevel("AIP-C01")).toBe("professional");
  });

  it("classifies specialty codes", () => {
    expect(getCertLevel("ANS-C01")).toBe("specialty");
  });

  it("defaults to associate", () => {
    expect(getCertLevel("SAA-C03")).toBe("associate");
    expect(getCertLevel("DVA-C02")).toBe("associate");
  });
});

describe("getQuestionDifficulty", () => {
  it("maps professional and specialty to professional difficulty", () => {
    expect(getQuestionDifficulty("SAP-C02")).toBe("professional");
    expect(getQuestionDifficulty("ANS-C01")).toBe("professional");
  });

  it("maps associate to associate difficulty", () => {
    expect(getQuestionDifficulty("SAA-C03")).toBe("associate");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/cert-level.test.ts`
Expected: FAIL — cannot resolve `@/lib/cert-level`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/cert-level.ts
export type CertLevel = "associate" | "professional" | "specialty";

const PROFESSIONAL_PREFIXES = ["SAP", "DOP", "AIP"];
const SPECIALTY_PREFIXES = ["ANS"];

export function getCertLevel(code: string): CertLevel {
  if (PROFESSIONAL_PREFIXES.some((p) => code.startsWith(p))) return "professional";
  if (SPECIALTY_PREFIXES.some((p) => code.startsWith(p))) return "specialty";
  return "associate";
}

export function getQuestionDifficulty(code: string): "associate" | "professional" {
  return getCertLevel(code) === "associate" ? "associate" : "professional";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/cert-level.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cert-level.ts src/lib/__tests__/cert-level.test.ts
git commit -m "feat: add getCertLevel helper centralizing cert code classification"
```

---

### Task 2: Adopt the helper in the three duplicated call sites

**Files:**
- Modify: `src/components/certification-card.tsx:10-20`
- Modify: `src/lib/generate-client.ts:30-33`
- Modify: `scripts/generate-questions.ts:28-31`

**Interfaces:**
- Consumes: `getCertLevel`, `getQuestionDifficulty` from Task 1.

- [ ] **Step 1: Update certification-card.tsx**

Replace lines 10–20 region so the badge derives from `getCertLevel`:

```tsx
import { getCertLevel } from "@/lib/cert-level";
import type { Certification } from "@/types/certification";

const LEVEL_LABELS = {
  associate: "Associate",
  professional: "Professional",
  specialty: "Specialty",
} as const;

export function CertificationCard({ certification }: CertificationCardProps) {
  const level = getCertLevel(certification.code);

  return (
    <Link href={`/exam/${certification.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={level === "associate" ? "secondary" : "default"}>
              {LEVEL_LABELS[level]}
            </Badge>
```

(Keep the rest of the file unchanged.)

- [ ] **Step 2: Update generate-client.ts**

Replace lines 30–33:

```typescript
import { getQuestionDifficulty } from "./cert-level";
// ...
const difficulty = getQuestionDifficulty(cert.code);
```

- [ ] **Step 3: Update scripts/generate-questions.ts**

Replace lines 28–31:

```typescript
import { getQuestionDifficulty } from "../src/lib/cert-level";
// ...
const difficulty = getQuestionDifficulty(cert.code);
```

- [ ] **Step 4: Run full test suite and lint**

Run: `npm run test && npm run lint`
Expected: all tests PASS, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/certification-card.tsx src/lib/generate-client.ts scripts/generate-questions.ts
git commit -m "refactor: use getCertLevel helper in card badge and question generators"
```

---

### Task 3: Authoring pipeline + Network Design questions (20)

**Files:**
- Create: `$SCRATCH/append-ans.mjs` (authoring pipeline script)
- Create: `$SCRATCH/drafts-network-design.json` (20 question drafts)
- Create: `data/questions/aws-ans.json` (generated by script)
- Modify: `src/lib/__tests__/validate-questions.test.ts` (register aws-ans bank)

**Interfaces:**
- Produces: `append-ans.mjs` — `node $SCRATCH/append-ans.mjs <drafts.json>` appends validated drafts to `data/questions/aws-ans.json`. Reused verbatim by Tasks 4–6. Draft object shape: `{ domain, type, stem, options, correctAnswers, explanation, tags }` (no `id`, no `certificationId`, no `difficulty` — script adds them).

- [ ] **Step 1: Write the pipeline script**

```javascript
// $SCRATCH/append-ans.mjs
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";

const BANK = "data/questions/aws-ans.json";
const VALID_DOMAINS = new Set([
  "Network Design",
  "Network Implementation",
  "Network Management and Operation",
  "Network Security, Compliance, and Governance",
]);

const drafts = JSON.parse(readFileSync(process.argv[2], "utf-8"));
const bank = existsSync(BANK) ? JSON.parse(readFileSync(BANK, "utf-8")) : [];
const ids = new Set(bank.map((q) => q.id));
const stems = new Set(bank.map((q) => q.stem));

for (const [i, d] of drafts.entries()) {
  const ctx = `draft[${i}]`;
  if (!VALID_DOMAINS.has(d.domain)) throw new Error(`${ctx}: bad domain ${d.domain}`);
  if (stems.has(d.stem)) throw new Error(`${ctx}: duplicate stem`);
  const keys = d.options.map((o) => o.key);
  const expected = ["A", "B", "C", "D", "E"].slice(0, d.options.length);
  if (JSON.stringify(keys) !== JSON.stringify(expected)) throw new Error(`${ctx}: keys ${keys}`);
  if (d.type === "single") {
    if (d.options.length !== 4) throw new Error(`${ctx}: single needs 4 options`);
    if (d.correctAnswers.length !== 1) throw new Error(`${ctx}: single needs 1 answer`);
  } else if (d.type === "multiple") {
    if (d.options.length !== 5) throw new Error(`${ctx}: multiple needs 5 options`);
    if (d.correctAnswers.length < 2) throw new Error(`${ctx}: multiple needs 2+ answers`);
    if (!/\(Choose (two|three)\.\)$/.test(d.stem)) throw new Error(`${ctx}: multiple stem must end with (Choose two.) or (Choose three.)`);
  } else throw new Error(`${ctx}: bad type ${d.type}`);
  for (const a of d.correctAnswers) if (!keys.includes(a)) throw new Error(`${ctx}: answer ${a} not in options`);
  if (d.stem.length < 400) throw new Error(`${ctx}: stem too short (${d.stem.length}) — below sample benchmark`);
  if (d.explanation.length < 300) throw new Error(`${ctx}: explanation too short (${d.explanation.length})`);
  if (!Array.isArray(d.tags) || d.tags.length === 0) throw new Error(`${ctx}: tags required`);

  const id = createHash("sha256").update(`aws-ans:${d.stem}`).digest("hex").slice(0, 12);
  if (ids.has(id)) throw new Error(`${ctx}: duplicate id ${id}`);
  ids.add(id);
  stems.add(d.stem);
  bank.push({
    id,
    certificationId: "aws-ans",
    domain: d.domain,
    difficulty: "professional",
    type: d.type,
    stem: d.stem,
    options: d.options,
    correctAnswers: d.correctAnswers,
    explanation: d.explanation,
    tags: d.tags,
  });
}

writeFileSync(BANK, JSON.stringify(bank, null, 2));
const byDomain = {};
for (const q of bank) byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
console.log(`Wrote ${bank.length} total`, byDomain);
```

- [ ] **Step 2: Author 20 Network Design drafts**

Write `$SCRATCH/drafts-network-design.json` containing 20 drafts (17 single + 3 multiple-select). Slots 1–4 are the user's cleaned samples (Appendix A, samples A1–A4, verbatim stems/options with typo fixes, keyed answers as listed; author full explanations per the Global Constraints style bar). Slots 5–20 are new questions, one per topic, each testing the stated decision point:

5. Direct Connect maximum-resiliency design — two DX locations × two connections each; trap: LAG at one location is not location-redundant.
6. Site-to-Site VPN as DX backup — BGP route preference so VPN is standby (shorter AS_PATH on DX / longer prepend on VPN); trap: static routes over both.
7. Multi-Region TGW peering design for inter-Region private traffic; trap: inter-Region VPC peering doesn't scale to N VPCs, CIDR overlap constraints.
8. CloudFront origin cloaking — restrict ALB origin to CloudFront using managed prefix list + custom header verified by WAF; trap: SG allowing 0.0.0.0/0 or only prefix list without header check.
9. Route 53 routing policy selection — latency-based vs geolocation for compliance-driven (data residency) routing; trap: latency ≠ jurisdiction.
10. Route 53 private hosted zone associated with VPCs in another account — CLI two-step authorize/associate; trap: console-only or RAM-sharing the zone.
11. Hybrid DNS — on-prem resolves VPC records via inbound resolver endpoint, VPC resolves on-prem via outbound endpoint + forwarding rule; trap: swapping the two.
12. Dual-stack IPv6 design — egress-only internet gateway for private-subnet IPv6 egress; trap: NAT gateway for IPv6.
13. Connecting VPCs with overlapping CIDRs for one client-server API — PrivateLink; trap: peering/TGW (both reject overlap).
14. VPC IPAM across an Organization — delegated admin, top-level pool per Region, auto-allocation to accounts; trap: spreadsheet/manual or per-account IPAM. (multiple-select, Choose two: delegate IPAM admin + share pools via RAM.)
15. Load balancer selection for third-party firewall appliance fleet — Gateway Load Balancer with GENEVE; trap: NLB with source/dest check disabled.
16. Centralized egress inspection — TGW appliance-mode attachment to inspection VPC with AWS Network Firewall, spoke default route to TGW; trap: NFW endpoint per spoke costs more. (multiple-select, Choose two: TGW route config + appliance mode.)
17. Global Accelerator vs CloudFront for TCP (non-HTTP) gaming/MQTT workload needing static anycast IPs; trap: CloudFront is HTTP-only.
18. Shared VPC via AWS RAM for centrally-managed subnets across accounts; trap: participant accounts can't modify route tables — test who-owns-what.
19. EC2 network performance design — cluster placement group + ENA + jumbo frames (MTU 9001) for east-west HPC; trap: jumbo frames capped at 1500 over IGW/peering paths (8500 on TGW).
20. Remote admin access design without inbound ports — SSM Session Manager with interface endpoints in a no-IGW VPC; trap: bastion + SG or Client VPN when "no inbound listeners" is required. (multiple-select, Choose two: endpoints needed — ssm, ssmmessages, ec2messages.)

- [ ] **Step 3: Run the pipeline**

Run: `node $SCRATCH/append-ans.mjs $SCRATCH/drafts-network-design.json`
Expected: `Wrote 20 total { 'Network Design': 20 }`. Fix any validation errors and re-run (script rejects the whole batch atomically on error — it writes only at the end).

- [ ] **Step 4: Register the bank in the validation test**

In `src/lib/__tests__/validate-questions.test.ts`, add:

```typescript
import awsAns from "../../../data/questions/aws-ans.json";
// in banks array:
  { name: "aws-ans", questions: awsAns },
```

- [ ] **Step 5: Run validation tests**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts`
Expected: PASS including the new aws-ans describe block.

- [ ] **Step 6: Adversarial answer-key review**

Dispatch one reviewer subagent with the 20 authored questions (paste full JSON in the prompt). Reviewer instructions: "For each question, independently determine the correct answer(s) from the stem alone, then compare with the keyed answer. Flag any question where (a) your answer differs, (b) two options are defensibly correct, or (c) a distractor is dismissible without AWS networking knowledge. Return JSON: `[{id, verdict: 'ok'|'flag', reason}]`." Fix every confirmed flag in `data/questions/aws-ans.json` directly (keep the same `id` unless the stem changes, in which case recompute per the ID scheme), re-run Step 5.

- [ ] **Step 7: Commit**

```bash
git add data/questions/aws-ans.json src/lib/__tests__/validate-questions.test.ts
git commit -m "feat: add ANS-C01 Network Design question bank (20 questions)"
```

---

### Task 4: Network Implementation questions (20)

**Files:**
- Create: `$SCRATCH/drafts-network-implementation.json`
- Modify: `data/questions/aws-ans.json` (via pipeline script)

**Interfaces:**
- Consumes: `$SCRATCH/append-ans.mjs` from Task 3 (same invocation).

- [ ] **Step 1: Author 20 drafts** (17 single + 3 multiple), `domain: "Network Implementation"`, one per topic:

1. Influence OUTBOUND path over two DX connections — higher local preference via BGP communities; trap: AS_PATH prepending (controls inbound).
2. Influence INBOUND traffic from AWS over preferred DX — advertise with 7224:7300 community (high preference) / prepend on backup; trap: local pref (controls outbound).
3. Enable ECMP across multiple Site-to-Site VPN tunnels on TGW — VPN attachments with same ASN + ECMP enabled aggregate beyond 1.25 Gbps; trap: single tunnel bonding, VGW (no ECMP).
4. TGW route-table segmentation — prod and dev attachments in isolated route tables, shared services propagated to both; trap: single default route table full mesh.
5. TGW appliance mode on inspection VPC attachment for symmetric flows; trap: relying on default AZ-affinity behavior breaking stateful inspection.
6. Route 53 Resolver forwarding rule for `corp.example.com` to on-prem DNS via outbound endpoint, shared to Org via RAM; trap: per-VPC /etc/resolv.conf or conditional forwarders on instances.
7. Enable DNSSEC signing on a Route 53 public zone — KSK with KMS, add DS record at parent registrar; trap: forgetting the DS record / DNSSEC validation vs signing confusion.
8. Private NAT gateway to reach on-prem network that overlaps with VPC secondary CIDR; trap: public NAT gateway (needs IGW), no-NAT routing.
9. Transit VIF to DX gateway attached to TGW for many-VPC hybrid connectivity; trap: private VIF to VGW per VPC (VIF limits), public VIF.
10. Enable DNS resolution over VPC peering — both peering DNS options + resolver behavior for private hosted zones; trap: assuming PHZ association is transitive over peering.
11. EKS pod density — VPC CNI custom networking with secondary CIDR (100.64.0.0/16) to relieve RFC1918 exhaustion; trap: bigger instance type alone, overlay CNI swap.
12. AWS Load Balancer Controller ingress — `target-type: ip` for Fargate pods (instance mode impossible); trap: NodePort/instance mode on Fargate.
13. GWLB implementation — GENEVE port 6081 listeners on appliances, GWLB endpoints in consumer subnets, route table insertion for ingress inspection; trap: TLS listener on GWLB (multiple-select, Choose two: appliance GENEVE + GWLBe route).
14. BYOIP v4 onboarding — ROA authorizing Amazon ASNs + RDAP self-attestation before advertising; trap: skipping ROA.
15. Enable MACsec on a 10 Gbps dedicated connection — CKN/CAK on the connection at a MACsec-capable location; trap: MACsec on VIFs or hosted connections.
16. VGW route propagation — enable propagation on private subnet route tables so on-prem prefixes appear automatically; trap: static routes that go stale.
17. NLB with one Elastic IP per AZ for firewall allowlisting by customers; trap: ALB (no static IPs), GA when the requirement is regional EIPs.
18. CloudFront to a custom origin that virtual-hosts by Host header — forward Host via origin request policy vs setting custom origin domain; trap: caching signature mismatch on S3 (multiple-select, Choose two).
19. VPC sharing implementation — owner creates subnets/RTs/NACLs and shares subnets via RAM; participants create instances/SGs but cannot modify routes; trap: participant editing route tables.
20. Multicast between EC2 instances — TGW multicast domain with IGMP; trap: assuming VPC supports native multicast or using peering (multiple-select, Choose two: create domain + register members).

- [ ] **Step 2: Run pipeline** — `node $SCRATCH/append-ans.mjs $SCRATCH/drafts-network-implementation.json`
Expected: `Wrote 40 total` with 20 per domain so far.

- [ ] **Step 3: Run validation tests** — `npx vitest run src/lib/__tests__/validate-questions.test.ts` → PASS.

- [ ] **Step 4: Adversarial answer-key review** — same reviewer-subagent protocol as Task 3 Step 6, over the 20 new questions; fix confirmed flags, re-run tests.

- [ ] **Step 5: Commit**

```bash
git add data/questions/aws-ans.json
git commit -m "feat: add ANS-C01 Network Implementation question bank (20 questions)"
```

---

### Task 5: Network Management and Operation questions (20)

**Files:**
- Create: `$SCRATCH/drafts-network-management.json`
- Modify: `data/questions/aws-ans.json` (via pipeline script)

**Interfaces:**
- Consumes: `$SCRATCH/append-ans.mjs` from Task 3.

- [ ] **Step 1: Author 20 drafts** (17 single + 3 multiple), `domain: "Network Management and Operation"`. Slot 1 is the user's cleaned sample A5 (Appendix A) with authored explanation. Slots 2–20, one per topic:

2. VPC Flow Logs custom format with `tcp-flags`, `pkt-srcaddr`/`pkt-dstaddr` to see true endpoints through NAT/TGW; trap: default format lacks these fields.
3. Payload-level inspection of suspicious traffic — Traffic Mirroring to an analysis appliance; trap: Flow Logs (metadata only, no payload).
4. Reachability Analyzer to find which hop (NACL vs route table vs SG) blocks a path between two ENIs; trap: manual SG audit or ping (ICMP blocked ≠ path broken).
5. Network Access Analyzer to audit an Org for unintended internet-reachable paths at scale; trap: Reachability Analyzer (point-to-point only).
6. Intermittent large-payload failures over VPN while small packets work — MTU/PMTUD blackhole; fix: lower MTU/MSS clamping, allow ICMP "Frag Needed"; trap: bandwidth upgrade.
7. Alarm on VPN tunnel health — CloudWatch `TunnelState` metric per tunnel + SNS; trap: alarm on instance metrics or DX metrics for a VPN.
8. TGW Network Manager Route Analyzer to diagnose asymmetric/blackholed routes across TGW peerings in a global network; trap: per-VPC route table eyeballing.
9. NLB targets flap unhealthy only in one AZ — cross-zone off + no registered targets in that AZ; fix: enable cross-zone or add targets per AZ; trap: health-check tuning alone.
10. Stateful appliance drops return traffic — asymmetric routing through two NAT/firewall instances; fix: appliance mode / symmetric routes; trap: increasing timeouts.
11. Route 53 Resolver query logging to find which instance queries a malicious domain; trap: VPC Flow Logs (no DNS names), CloudTrail.
12. Interface endpoint reachable by IP but service DNS still resolves to public IP — enable Private DNS on the endpoint / enableDnsHostnames+enableDnsSupport prerequisites; trap: hosts-file hacks.
13. NAT gateway `ErrorPortAllocation` > 0 under load — port exhaustion to one destination; fix: add NAT gateways in more subnets/split traffic or additional IPs; trap: bigger instance (NAT GW isn't an instance).
14. Detect and remediate manual drift on network CloudFormation stacks — drift detection + stack policy/automation; trap: assuming CFN blocks console edits (multiple-select, Choose two).
15. DX LAG operational guardrail — set minimum links so a degraded LAG fails fast instead of silently carrying traffic; trap: leaving minimum links at 0 and relying on alarms.
16. Reduce origin load / improve cache hit ratio on CloudFront — normalize cache key via cache policy (drop irrelevant query strings/headers); trap: forwarding all headers "to be safe".
17. Distinguish `HTTPCode_Target_5XX` (backend errors) from `HTTPCode_ELB_5XX_Count` (LB-generated, e.g., 503 no healthy targets) when triaging; trap: treating all 5xx as app bugs.
18. Cut NAT gateway data-processing costs for heavy S3/DynamoDB traffic — gateway VPC endpoints (free) in route tables; trap: interface endpoints for S3 by default (hourly + per-GB), bigger NAT.
19. Detect BGP session flapping on DX — alarm on `VirtualInterfaceBgpPeerState`/connection state changes + logs; trap: ping-based monitors through the tunnel (multiple-select, Choose two: CloudWatch metric alarm + EventBridge/Health events).
20. Instances resolve DNS against a decommissioned on-prem server — DHCP options set still lists it; fix: new options set + lease renewal; trap: editing resolv.conf per instance.

- [ ] **Step 2: Run pipeline** — `node $SCRATCH/append-ans.mjs $SCRATCH/drafts-network-management.json`
Expected: `Wrote 60 total`, 20 in this domain.

- [ ] **Step 3: Run validation tests** — PASS.

- [ ] **Step 4: Adversarial answer-key review** — same protocol; fix confirmed flags, re-run tests.

- [ ] **Step 5: Commit**

```bash
git add data/questions/aws-ans.json
git commit -m "feat: add ANS-C01 Network Management and Operation question bank (20 questions)"
```

---

### Task 6: Network Security, Compliance, and Governance questions (20)

**Files:**
- Create: `$SCRATCH/drafts-network-security.json`
- Modify: `data/questions/aws-ans.json` (via pipeline script)

**Interfaces:**
- Consumes: `$SCRATCH/append-ans.mjs` from Task 3.

- [ ] **Step 1: Author 20 drafts** (17 single + 3 multiple), `domain: "Network Security, Compliance, and Governance"`, one per topic:

1. Egress domain allowlisting for private subnets — AWS Network Firewall stateful rule group with allowed FQDNs (TLS SNI/HTTP host); trap: SGs (no FQDN support), NACLs.
2. Centralized inspection architecture — NFW in a dedicated inspection VPC with TGW, spoke→TGW→inspection→egress route walk; trap: routes that bypass the firewall subnet.
3. Cross-VPC SG references — SG-referencing works over VPC peering in the same Region; trap: assuming it works over TGW or inter-Region.
4. Return-traffic failure with NACLs — stateless NACLs need ephemeral port range (1024-65535) outbound/inbound rules; trap: mirroring only port 443 both ways.
5. mTLS with no decryption at the edge (regulated workload) — NLB TCP passthrough, terminate mTLS on targets; contrast with ALB mTLS verify mode (ALB terminates TLS); pick per "must not decrypt" constraint.
6. Internal service certs at scale — ACM Private CA issuing certs, exportable for on-instance mTLS; trap: public ACM certs (not exportable), self-signed sprawl.
7. Block DNS exfiltration/malware domains VPC-wide — Route 53 Resolver DNS Firewall with managed domain lists; trap: NFW only sees traffic after resolution, SG can't filter DNS by name.
8. Lock a VPC interface endpoint to the Organization — endpoint policy with `aws:PrincipalOrgID` condition; trap: SG on the endpoint (no principal awareness).
9. Ensure S3 bucket only reachable through a specific VPC — gateway endpoint + bucket policy `aws:sourceVpce` deny; trap: `aws:SourceIp` with private CIDRs (doesn't match through gateway endpoint).
10. Prevent any account in an OU from attaching an IGW — SCP denying `ec2:AttachInternetGateway`/`CreateInternetGateway`; trap: Config rule (detective, not preventive).
11. Centralize VPC Flow Logs from all accounts into a security account — deliver to central S3 bucket with bucket policy (or Firehose); trap: per-account buckets + replication overhead (multiple-select, Choose two: create flow logs org-wide + central bucket policy).
12. Absorb an HTTP request flood on an ALB — WAF rate-based rule; when to add Shield Advanced (L3/L4 + cost protection + SRT); pick per stated attack type.
13. Enforce TLS 1.2+ with modern ciphers on an ALB — set the `ELBSecurityPolicy-TLS13-1-2-*` security policy on the HTTPS listener; trap: SG rules or app-level config.
14. GuardDuty finds `Backdoor:EC2/C&CActivity` — automated response: EventBridge rule → Lambda/SSM to quarantine SG + snapshot for forensics; trap: terminating instantly (loses evidence).
15. Enforce a baseline SG posture across all accounts — AWS Firewall Manager common security group policy (delegated admin); trap: Config aggregator alone (no enforcement) (multiple-select, Choose two: delegate FMS admin + create SG policy).
16. Eliminate SSH inbound entirely for compliance — Session Manager + IAM + endpoint access logging to CloudTrail/S3; trap: SG restricted to office IP still counts as inbound 22.
17. Protect content at the edge for paid subscribers — CloudFront signed URLs/cookies with key groups; trap: S3 presigned URLs when the requirement is CDN-cached content.
18. IPv6 private-subnet posture — egress-only IGW gives outbound-only for IPv6 (NAT GW doesn't do IPv6); trap: security by NAT assumption carried to IPv6.
19. TLS inspection of egress for DLP compliance — Network Firewall TLS inspection configuration (decrypt-inspect-re-encrypt) with private CA cert; trap: SNI-only filtering when payload inspection is required.
20. IDS/IPS with third-party appliances for all inter-VPC traffic — GWLB + appliance fleet, TGW appliance mode, endpoints in inspection VPC (multiple-select, Choose two).

- [ ] **Step 2: Run pipeline** — `node $SCRATCH/append-ans.mjs $SCRATCH/drafts-network-security.json`
Expected: `Wrote 80 total`, 20 per each of the 4 domains.

- [ ] **Step 3: Run validation tests** — PASS.

- [ ] **Step 4: Adversarial answer-key review** — same protocol; fix confirmed flags, re-run tests.

- [ ] **Step 5: Commit**

```bash
git add data/questions/aws-ans.json
git commit -m "feat: add ANS-C01 Network Security, Compliance, and Governance question bank (20 questions)"
```

---

### Task 7: Wire ANS-C01 into the app

**Files:**
- Modify: `data/certifications.json`
- Modify: `src/lib/data.ts:13-18`

**Interfaces:**
- Consumes: `data/questions/aws-ans.json` from Tasks 3–6 (must exist with 80 questions before this task — the app would otherwise show an exam with no questions).

- [ ] **Step 1: Append the cert config**

Add as the last element of the `data/certifications.json` array:

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

- [ ] **Step 2: Register the question import**

In `src/lib/data.ts`, add to `questionImports`:

```typescript
  "aws-ans": () => import("../../data/questions/aws-ans.json") as Promise<{ default: Question[] }>,
```

- [ ] **Step 3: Full verification**

Run: `npm run test && npm run lint && npm run build`
Expected: all PASS; build output includes `/exam/aws-ans`, `/exam/aws-ans/practice`, `/exam/aws-ans/mock`, `/exam/aws-ans/mock/results` routes.

- [ ] **Step 4: Smoke-check the built site**

Run: `ls out/exam/aws-ans/ && grep -o "Specialty" out/index.html | head -1`
Expected: practice/mock directories exist; "Specialty" badge text present on the home page.

- [ ] **Step 5: Commit**

```bash
git add data/certifications.json src/lib/data.ts
git commit -m "feat: add AWS Advanced Networking Specialty (ANS-C01) exam"
```

---

### Task 8: DevOps audit — reviewer fan-out

> **Orchestration task — execute inline in the main session** (it dispatches reviewer subagents; do not delegate the orchestration itself to a subagent).

**Files:**
- Create: `$SCRATCH/devops-batches/batch-{00..10}.json` (via split script below)
- Create: `$SCRATCH/devops-flags.json` (merged reviewer output)

**Interfaces:**
- Produces: `$SCRATCH/devops-flags.json` — array of `{ id, category, detail }`, `category ∈ factual | ambiguous | giveaway | shallow | weak-explanation`. Consumed by Task 9.

- [ ] **Step 1: Split the bank into batches**

```javascript
// $SCRATCH/split-devops.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs";
const q = JSON.parse(readFileSync("data/questions/aws-devops.json", "utf-8"));
mkdirSync(process.env.SCRATCH + "/devops-batches", { recursive: true });
const SIZE = 50;
for (let i = 0; i * SIZE < q.length; i++) {
  writeFileSync(
    `${process.env.SCRATCH}/devops-batches/batch-${String(i).padStart(2, "0")}.json`,
    JSON.stringify(q.slice(i * SIZE, (i + 1) * SIZE), null, 2)
  );
}
console.log(Math.ceil(q.length / SIZE), "batches");
```

Run: `SCRATCH=$SCRATCH node $SCRATCH/split-devops.mjs` → Expected: `11 batches`.

- [ ] **Step 2: Dispatch reviewer subagents (all 11 concurrently)**

One subagent per batch file. Prompt template (fill in the batch path):

> Read `<batch path>`. It contains 50 AWS DevOps Professional (DOP-C02) practice exam questions. You are an expert AWS DevOps exam item reviewer. For EACH question, independently solve it from the stem before looking at the keyed `correctAnswers`. Then flag it if ANY of these hold:
> - `factual` — the keyed answer is technically wrong, or a distractor is actually a valid solution.
> - `ambiguous` — two or more options are defensibly correct, or the stem lacks the constraint that decides between them.
> - `giveaway` — a distractor can be eliminated without AWS knowledge (absurd, self-contradictory, grammatically mismatched with the stem).
> - `shallow` — the stem is a bare definition lookup with no scenario or constraints (well below professional level).
> - `weak-explanation` — the explanation does not say why each incorrect option fails.
>
> Be strict about `factual` and `ambiguous`; be conservative about `shallow` and `weak-explanation` (flag only clear cases). Return ONLY a JSON array: `[{"id": "...", "category": "...", "detail": "one sentence naming the specific problem"}]`. Empty array if nothing is flagged.

- [ ] **Step 3: Merge flags**

Concatenate all reviewer outputs into `$SCRATCH/devops-flags.json` (single JSON array). Print a count per category. No commit — scratch data only.

---

### Task 9: DevOps audit — verify and fix

> **Orchestration task — execute inline in the main session.**

**Files:**
- Modify: `data/questions/aws-devops.json`

**Interfaces:**
- Consumes: `$SCRATCH/devops-flags.json` from Task 8.

- [ ] **Step 1: Adversarial verification of flags**

For each flag in `devops-flags.json`, dispatch verification grouped in batches of ~15 flags per subagent. Verifier prompt per flag: the full question JSON + the flag, with instructions: "Try to REFUTE this flag: argue the keyed answer is correct and the question is fair as written. Verdict `confirmed` only if the flag survives your strongest counter-argument. Return `[{"id", "verdict": "confirmed"|"refuted", "reason"}]`." Only `confirmed` flags proceed.

- [ ] **Step 2: Fix confirmed flags**

Edit `data/questions/aws-devops.json` directly:
- `factual` — re-key to the defensible answer if one exists, otherwise rewrite the wrong option(s) so the keyed answer is uniquely correct; update the explanation.
- `ambiguous` — add the deciding constraint to the stem (e.g., "MOST cost-effective", a scale number, a compliance requirement) or sharpen the near-correct distractor so it fails for a precise reason; update the explanation.
- `giveaway` — replace the weak distractor with a plausible one that fails for one specific reason; update the explanation.
- `shallow` — rewrite the stem as a scenario with concrete constraints at the sample benchmark depth, preserving the same tested concept and the same options where possible.
- `weak-explanation` — rewrite the explanation to cover why the correct answer works and why each distractor fails.

**Every fixed question keeps its existing `id`.**

- [ ] **Step 3: Validate**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts`
Expected: PASS (aws-devops block: still no duplicate IDs, valid schema, valid answer keys).

- [ ] **Step 4: Commit**

```bash
git add data/questions/aws-devops.json
git commit -m "fix: repair flagged DOP-C02 questions from quality audit"
```

(Include the per-category confirmed-flag counts in the commit body.)

---

### Task 10: Add the user's 10 DOP-C02 samples if missing

**Files:**
- Modify: `data/questions/aws-devops.json`

**Interfaces:**
- Consumes: Appendix B (the 10 cleaned samples with keyed answers).

- [ ] **Step 1: Check for existing coverage**

For each Appendix B sample, search the bank for an existing question with the same tested decision (grep the stem's distinctive phrases, e.g. `user-agent header`, `Backup_Frequency`, `DEPLOYMENT_GROUP_NAME`):

```bash
node -e "
const q = require('./data/questions/aws-devops.json');
const probes = ['user-agent header','provisioned concurrency','DEPLOYMENT_GROUP_NAME','Backup_Frequency','custom ANY endpoint','KMS grant that delegates','RPM package','Firewall Manager policy to attach AWS WAF','keys have not been rotated','unauthenticated request'];
for (const p of probes) console.log(p, '→', q.filter(x => x.stem.includes(p)).length);
"
```

- [ ] **Step 2: Add missing samples**

For each sample with no existing equivalent: clean text per Appendix B notes, author a full explanation (style bar from Global Constraints), assign the correct DOP-C02 domain (listed per sample in Appendix B), compute `id` as `sha256("aws-devops:" + stem)` first 12 hex chars, and append. Samples that already have an equivalent in the bank are skipped (note which in the commit body).

- [ ] **Step 3: Validate and commit**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts` → PASS.

```bash
git add data/questions/aws-devops.json
git commit -m "feat: add benchmark DOP-C02 sample questions to the bank"
```

---

### Task 11: Final verification

**Files:** none new.

- [ ] **Step 1: Full suite**

Run: `npm run test && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 2: E2E smoke**

Run: `npm run test:e2e`
Expected: PASS (existing Playwright suite; no ANS-specific specs required).

- [ ] **Step 3: Manual spot-check**

Run `npm run dev`, load `/`, confirm: ANS card shows a "Specialty" badge; `/exam/aws-ans/practice` serves questions with explanations; `/exam/aws-ans` mock setup shows 65 questions / 170 min. Stop the server.

- [ ] **Step 4: Final commit (if any stragglers) and report**

Report per-domain ANS counts, DevOps flags found/confirmed/fixed per category, and samples added vs skipped.

---

## Appendix A: ANS-C01 user samples (cleaned) — keyed answers

Include these verbatim (with the noted typo fixes) as drafts in the stated tasks. Author explanations at execution time per the style bar.

**A1 — Network Design (Task 3). Answer: A.** gRPC over TCP 443, mTLS end-to-end (no decryption in transit path), EKS backend, thousands of connections. Fix: "Amazon EKS duster" → "Amazon EKS cluster".
- Correct A: NLB with TCP listener on 443 forwarding to pod IPs (passthrough preserves mTLS; AWS Load Balancer Controller with IP targets).
- B wrong: ALB HTTPS listener terminates TLS — breaks the no-decryption requirement. C wrong: same termination problem plus instance targets route through NodePort, losing direct pod routing. D wrong: TLS listener on NLB also terminates TLS at the load balancer.

**A2 — Network Design (Task 3). Answer: A.** ALB, path-based routing to multiple target groups, HTTPS everywhere, TLS offload, client IP visibility.
- Correct A: ALB HTTPS listener + path-based rules + X-Forwarded-For.
- B wrong: "an HTTPS listener for each domain" and host-based rules contradict the URL-path requirement. C/D wrong: NLB does not support path- or host-based routing; TLS listener on NLB doesn't offload for multiple target groups by URL.

**A3 — Network Design (Task 3). Answer: A.** Global Accelerator static IPs; ALB must not be directly reachable. Fixes: "Configure the ALB in a public subnet of the VPAttach an internet gateway." → "...of the VPC. Attach an internet gateway." (option C); option A "Attach an internet gateway without adding routes in the subnet route tables to point to the internet gateway."
- Correct A: internal ALB in private subnets; GA requires an IGW *attached* to the VPC for internal-ALB endpoints, but with no routes to it the ALB stays unreachable directly; GA preserves client IPs for ALB endpoints, so the SG allows the internet on the listener port.
- B wrong: without an attached IGW, GA cannot route to an internal ALB. C wrong: public subnet + routes makes the ALB directly reachable, and GA preserves client IP so allowlisting "the accelerator's IP addresses" blocks real clients. D wrong: adding IGW routes to the "private" subnets makes them public — same exposure and same SG mistake as C.

**A4 — Network Design (Task 3). Answer: C.** Shared-services VPC consumed by many business-unit VPCs, granular security, scale, MOST secure. Fix: "PrivateLink in the central shared services VPCreate VPC endpoints" → "...shared services VPC. Create VPC endpoints...".
- Correct C: PrivateLink endpoint services expose only the specific service, unidirectionally, per-consumer — most granular and scales per business unit.
- A wrong: TGW full mesh gives broad network-level reachability, not granular service-level control. B wrong: peering full mesh scales poorly (n²) and exposes whole VPC CIDRs. D wrong: transit VPC with VPN appliances is legacy, operationally heavy, and still network-level access.

**A5 — Network Management and Operation (Task 5). Answer: A.** 4 Gbps LAG (4×1 Gbps), five private VIFs, daily saturation; identify the culprit VIF and fix capacity.
- Correct A: `VirtualInterfaceBpsEgress`/`VirtualInterfaceBpsIngress` are per-VIF metrics that identify the offending business unit; a 4×1 Gbps LAG cannot be upgraded in place — provision a new 10 Gbps dedicated connection and migrate.
- B wrong: right metrics, but you cannot "upgrade the bandwidth" of an existing dedicated connection/LAG of 1 Gbps links to 10 Gbps — new connection required. C/D wrong: `ConnectionBpsIngress`/`ConnectionPpsEgress` are connection-level aggregates that cannot attribute traffic to a VIF; C's "5 Gbps hosted connection" is also a downgrade path that doesn't exist for a dedicated connection.

## Appendix B: DOP-C02 user samples (cleaned) — keyed answers and domains

**B1 — Monitoring and Logging. Answer: A.** Metric per API operation/response code/app version from a Lambda behind an ALB. CloudWatch Logs metric filter with dimensions (metric filters support up to 3 dimensions). B wrong: Logs Insights queries don't "populate" metrics. C wrong: ALB access logs go to S3, not CloudWatch Logs, and response metadata isn't in access logs. D wrong: X-Ray Insights doesn't publish custom dimensional metrics like this.

**B2 — Resilient Cloud Solutions. Answer: C.** Lambda cold starts with 10× midday peak → provisioned concurrency + Application Auto Scaling (min 1, max 100). A wrong: PC of 1 can't cover peak; deleting DAX hurts. B wrong: reserved concurrency 0 blocks all invocations. D wrong: reserved concurrency doesn't pre-warm; Application Auto Scaling doesn't manage "reserved concurrency maximum" on API Gateway.

**B3 — SDLC Automation. Answer: B.** CodeDeploy per-deployment-group config without separate revisions → script reading `DEPLOYMENT_GROUP_NAME` env var, referenced from a lifecycle hook. A wrong: tags + metadata/EC2 API is heavy management overhead. C wrong: no such "custom environment variable per environment" feature; ValidateService is too late conceptually and adds per-group config. D wrong: `DEPLOYMENT_GROUP_ID` is an opaque GUID (can't map to log levels without lookup) and `Install` hook is reserved for CodeDeploy's own file copy — you can't attach scripts to it. Typo fixes: "DEPLOYMENT_GROUP_ NAME" → "DEPLOYMENT_GROUP_NAME".

**B4 — Security and Compliance. Answer: B.** Enforce Backup_Frequency tag on EBS volumes → AWS Config managed rule (`required-tags`) scoped to `EC2::Volume` + SSM Automation remediation applying `weekly`. A wrong: custom rule scoped to *all* EC2 resources over-applies (requirement is volumes) and managed rule already exists. C/D wrong: EventBridge-on-CreateVolume tags at creation only — misses pre-existing volumes and later tag deletions (no continuous compliance). Typo fixes: "This requirement Includes" → "includes"; "dally" → "daily"; "Backup Frequency" → "Backup_Frequency" (options A/B).

**B5 — Resilient Cloud Solutions. Answer: A.** Aurora single-instance cluster must stay available through maintenance → add a reader (creates Multi-AZ failover target), use cluster endpoint for writes and reader endpoint for reads. B wrong: custom ANY endpoint sends writes to the reader — write failures. C/D wrong: Aurora has no "Multi-AZ option" toggle — availability comes from adding reader instances. Remove stray "Topic 1" line preceding the stem.

**B6 — Security and Compliance. Answer: A, D, F (Choose three).** Share an encrypted AMI cross-account for an Auto Scaling group: copy AMI encrypted with the customer-managed KMS key (A — default EBS key in B can't be shared), key policy allows target account to create grants + grant to the ASG service-linked role created in the *target* account (D — C has the grant in the wrong account), share the *encrypted* AMI (F, not the unencrypted E).

**B7 — SDLC Automation. Answer: A, D (Choose two).** CodeDeploy RPM deploy to an ASG from CodePipeline: bake the CodeDeploy agent into the AMI + instance profile permissions (A); CodeDeploy application with in-place deployment targeting the ASG, CodeDeploy action in the pipeline (D). B wrong: AppSpec doesn't "grant access". C wrong: Image Builder/AMI deployment isn't how CodeDeploy deploys an RPM. E wrong: target the ASG, not enumerated instances (new instances from scale-out would be missed).

**B8 — Security and Compliance. Answer: A, C (Choose two).** Org-wide WAF ACL enforcement on ALBs and API Gateway → delegate Firewall Manager to a security account + Firewall Manager WAF policy with auto-remediation. B/D wrong: GuardDuty is threat detection, not policy attachment. E wrong: Config rules detect/remediate per-account but "Config managed rule to attach web ACLs" as stated isn't the org-wide preventive mechanism Firewall Manager is (and the pairing A+C is required).

**B9 — Security and Compliance. Answer: C.** Notify when manually-rotated KMS keys exceed 90 days → AWS Config custom rule (evaluates key age/rotation metadata) publishing to SNS via Config→EventBridge on noncompliance. A wrong: KMS has no built-in age-based SNS publishing. B wrong: Trusted Advisor has no KMS rotation check. D wrong: Security Hub has no such control for *manual* rotation age with custom 90-day thresholds out of the box.

**B10 — Security and Compliance. Answer: C.** CodeBuild downloading from S3 unauthenticated → bucket policy removes public access; CodeBuild *service role* gets S3 read; AWS CLI in buildspec uses the role. A wrong: "AllowedBuckets" CodeBuild setting doesn't exist. B wrong: S3 has no HTTPS basic auth. D wrong: long-lived IAM access keys in a build are less secure than the service role.
