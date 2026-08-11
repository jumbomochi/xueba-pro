# SCS-C03 Question Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the AWS Certified Security – Specialty (SCS-C03) exam to xueba-pro: certification config plus a 160-question bank meeting the established quality bar.

**Architecture:** Pure data addition. `data/certifications.json` gains an `aws-scs` entry; `data/questions/aws-scs.json` holds the bank; `src/lib/data.ts` gains one registry line; the existing validation test gains one bank import. Questions are authored per-domain into fragment files, validated mechanically by a scratchpad script, merged, then adversarially key-reviewed.

**Tech Stack:** JSON data, Python 3 (validation script), Vitest (existing tests), Next.js static build.

**Spec:** `docs/superpowers/specs/2026-08-11-scs-c03-question-bank-design.md`

## Global Constraints

Every task implicitly includes these. Copy of the spec's quality bar:

- `certificationId: "aws-scs"`, `difficulty: "professional"` on every question.
- Question shape must satisfy `QuestionSchema` in `src/types/question.ts`: `{id, certificationId, domain, difficulty, type, stem, options[{key,text}], correctAnswers[], explanation, tags[]}`.
- `type: "single"` → exactly 4 options keyed `A`–`D`, exactly 1 correct answer. `type: "multiple"` → exactly 5 options keyed `A`–`E`, exactly 2 correct answers, stem ends with `(Choose two.)`. Target ~80% single / ~20% multiple per domain.
- `domain` must be one of exactly: `Detection`, `Incident Response`, `Infrastructure Security`, `Identity and Access Management`, `Data Protection`, `Security Foundations and Governance`.
- `id` = first 12 hex chars of sha256 of `"aws-scs:" + stem` (computed by the validator's `--fix-ids` mode — author with `"id": ""`).
- Stems: 100–180-word scenarios with concrete deciding constraints; use qualifiers (MOST secure, LEAST operational overhead, MOST cost-effective) whenever two options would otherwise both be defensible. Ordered-sequence questions (converted HOTSPOT style) may be shorter (≥60 words) since the options carry the steps.
- Explanations address EVERY option letter with one precise failure/success reason each, in the house style: `"C is correct. <why>. A is wrong because <reason>. B ... D ..."`.
- **The app never shuffles options.** Keyed answers must be spread evenly across letters within each domain (max−min ≤ 1 per letter counting every correct letter), and the keyed option must not be systematically the longest (domain-level key:distractor mean word ratio in [0.8, 1.25]; key is strictly-longest option in <35% of the domain's questions).
- Tags: 3–6 AWS service/concept tags per question.
- Fact currency: exam scope is post-Dec-2025. Use current names/behavior — IAM Identity Center (never "AWS SSO"), Resource Control Policies (RCPs, GA Nov 2024) alongside SCPs, GuardDuty protection plans (Runtime Monitoring, Malware Protection for S3), Security Hub central configuration, ACM exportable public certificates (2025), ALB mTLS, EC2 IMDSv2 default on new launch types, S3 default encryption always-on. Do not test deprecated services (Macie Classic, AWS SSO naming, CloudHSM Classic).
- Validation gate: `python3 $SCRATCHPAD/validate_scs.py <file> [--domain "<name>" --expect N]` must pass before any commit of question data. `SCRATCHPAD=/private/tmp/claude-503/-Users-huiliang-GitHub-xueba-pro/1024f3ce-d8b6-4196-bd19-59db245b07e6/scratchpad`.
- Domain allocation (final bank): IAM 32, Infrastructure Security 29, Data Protection 29, Detection 26, Incident Response 22, Security Foundations and Governance 22. Five benchmark questions land in Task 1 (4 IAM, 1 Governance), so fragments contribute: IAM 28, Infra 29, DP 29, Detection 26, IR 22, Governance 21.

---

### Task 1: Certification config, wiring, and benchmark seed questions

**Files:**
- Modify: `data/certifications.json` (append entry)
- Create: `data/questions/aws-scs.json` (5 benchmark questions)
- Modify: `src/lib/data.ts:13-19` (add registry line)
- Modify: `src/lib/__tests__/validate-questions.test.ts:3-15` (add bank import)
- Test: `src/lib/__tests__/validate-questions.test.ts`, `src/lib/__tests__/validate-data.test.ts`

**Interfaces:**
- Produces: cert id `"aws-scs"`; `data/questions/aws-scs.json` as a JSON array that Tasks 9–10 extend/merge into; the 6 exact domain name strings listed in Global Constraints.

- [ ] **Step 1: Add the failing test wiring first**

In `src/lib/__tests__/validate-questions.test.ts`, add after line 7 (`import awsAns ...`):

```typescript
import awsScs from "../../../data/questions/aws-scs.json";
```

and to the `banks` array:

```typescript
  { name: "aws-scs", questions: awsScs },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts`
Expected: FAIL — cannot resolve `../../../data/questions/aws-scs.json`.

- [ ] **Step 3: Add the certification entry**

Append to the array in `data/certifications.json` (after the `aws-ans` entry):

```json
  {
    "id": "aws-scs",
    "name": "AWS Certified Security - Specialty",
    "code": "SCS-C03",
    "domains": [
      { "name": "Detection", "weight": 16 },
      { "name": "Incident Response", "weight": 14 },
      { "name": "Infrastructure Security", "weight": 18 },
      { "name": "Identity and Access Management", "weight": 20 },
      { "name": "Data Protection", "weight": 18 },
      { "name": "Security Foundations and Governance", "weight": 14 }
    ],
    "totalQuestions": 65,
    "timeMinutes": 170,
    "passingScore": 750
  }
```

- [ ] **Step 4: Register the bank import in `src/lib/data.ts`**

Add to the `questionImports` record after the `aws-ans` line:

```typescript
  "aws-scs": () => import("../../data/questions/aws-scs.json") as Promise<{ default: Question[] }>,
```

- [ ] **Step 5: Create `data/questions/aws-scs.json` with the 5 adapted benchmark questions**

Write exactly this array (ids intentionally empty; Step 6 fills them). These are the examtopics-derived calibration items, rewritten per spec (fresh stems, reconstructed options, HOTSPOTs converted to ordered-sequence single-choice):

```json
[
  {
    "id": "",
    "certificationId": "aws-scs",
    "domain": "Identity and Access Management",
    "difficulty": "professional",
    "type": "single",
    "stem": "A security engineer is investigating an AWS Lambda function that returns AccessDenied errors whenever it attempts to read objects from an Amazon S3 bucket named security-artifacts-bucket. The function's execution role has an identity policy that allows s3:GetObject on the bucket and all of its objects. The bucket policy contains a single statement that allows the s3:GetObject action, names the function's execution role ARN as the principal, and sets the Resource element to \"arn:aws:s3:::security-artifacts-bucket\". The bucket uses default server-side encryption with Amazon S3 managed keys (SSE-S3), and the function and bucket are in the same AWS account. Which change to the bucket policy will resolve the errors?",
    "options": [
      { "key": "A", "text": "Change the Principal element to the Lambda service principal, lambda.amazonaws.com, so that the Lambda service is granted access to the bucket." },
      { "key": "B", "text": "Change the Action element to s3:ListBucket so that the statement covers read operations that the function performs against the bucket." },
      { "key": "C", "text": "Change the Resource element to \"arn:aws:s3:::security-artifacts-bucket/*\" so that the statement applies to the objects in the bucket." },
      { "key": "D", "text": "Add the Lambda function's ARN as a second entry in the Resource element so that the statement covers both the bucket and the function." }
    ],
    "correctAnswers": ["C"],
    "explanation": "C is correct. s3:GetObject is an object-level action, so it must be granted on object ARNs of the form arn:aws:s3:::bucket-name/*. A Resource element that names only the bucket ARN matches bucket-level actions, so the current statement authorizes nothing that GetObject requests can use. A is wrong because the function accesses S3 with its execution role's credentials; granting the lambda.amazonaws.com service principal does not authorize the role and would broaden access to the entire service rather than this function. B is wrong because s3:ListBucket is a bucket-level action that authorizes listing, not reading object contents. D is wrong because Resource entries in an S3 bucket policy must be S3 ARNs; a Lambda function ARN is not a valid resource in a bucket policy.",
    "tags": ["S3 bucket policy", "Lambda", "policy evaluation", "resource ARN"]
  },
  {
    "id": "",
    "certificationId": "aws-scs",
    "domain": "Identity and Access Management",
    "difficulty": "professional",
    "type": "single",
    "stem": "A company is building a web application that must authenticate external users across multiple microservices that run on Amazon Elastic Container Service (Amazon ECS). The solution must use temporary credentials and must minimize the management overhead of maintaining user databases. A security engineer is defining the order of implementation steps. Which sequence of steps implements a secure authentication strategy that meets these requirements?",
    "options": [
      { "key": "A", "text": "Configure an Amazon Cognito user pool for user authentication. Create an Amazon Cognito application client for the web application. Implement an Amazon API Gateway HTTP API with AWS Lambda authorizers that validate tokens before forwarding requests to the microservices. Set up an IAM role for each microservice and grant each role appropriate permissions." },
      { "key": "B", "text": "Set up AWS IAM Identity Center to give users access to the microservices. Create an Amazon DynamoDB table to store user credentials for each microservice. Implement an Amazon API Gateway HTTP API with AWS Lambda authorizers that validate tokens. Set up an IAM role for each microservice and grant each role appropriate permissions." },
      { "key": "C", "text": "Create an Amazon DynamoDB table to store user credentials for each microservice. Create an Amazon Cognito application client for the web application. Set up an IAM role for each microservice and grant each role appropriate permissions. Implement an Amazon API Gateway HTTP API with AWS Lambda authorizers that validate tokens." },
      { "key": "D", "text": "Configure an Amazon Cognito user pool for user authentication. Set up an IAM role for each microservice and grant each role appropriate permissions. Create an Amazon DynamoDB table to store user credentials for each microservice. Implement an Amazon API Gateway HTTP API with AWS Lambda authorizers that validate tokens." }
    ],
    "correctAnswers": ["A"],
    "explanation": "A is correct. An Amazon Cognito user pool provides managed authentication for external users with no user database to operate, an application client lets the web application interact with the pool, Lambda authorizers on an API Gateway HTTP API validate the pool's tokens before requests reach the microservices, and per-microservice IAM roles supply temporary credentials with least-privilege permissions. B is wrong because IAM Identity Center is for workforce access, not external application users, and a DynamoDB credential table reintroduces the user-database management the requirements exclude. C is wrong because it also builds a self-managed credential store in DynamoDB, which adds overhead and risk compared with Cognito-managed authentication. D is wrong because it includes the unnecessary DynamoDB credential table and defers token validation until after roles are wired, leaving the services without an authentication gate.",
    "tags": ["Cognito", "API Gateway", "Lambda authorizer", "ECS", "temporary credentials"]
  },
  {
    "id": "",
    "certificationId": "aws-scs",
    "domain": "Identity and Access Management",
    "difficulty": "professional",
    "type": "single",
    "stem": "An AWS account administrator created an IAM group for the company's developers and attached a managed policy that is designed to require multi-factor authentication (MFA). The policy contains a Deny statement for all actions with a condition of Bool aws:MultiFactorAuthPresent: false, along with a NotAction exemption that allows users to manage and enable their own MFA devices. After the policy is applied, developers who authenticate to the AWS Management Console with MFA can work normally, but the same users report that every Amazon EC2 command that they run with the AWS CLI by using their long-term access keys fails with an authorization error. What should the administrator do to resolve this problem while still enforcing MFA?",
    "options": [
      { "key": "A", "text": "Change the condition in the Deny statement so that it tests whether aws:MultiFactorAuthPresent is true instead of false." },
      { "key": "B", "text": "Instruct users to run the aws sts get-session-token CLI command with the --serial-number and --token-code parameters, and to use the returned temporary credentials for subsequent API and CLI calls." },
      { "key": "C", "text": "Implement federated API and CLI access with SAML 2.0, and configure the identity provider to enforce multi-factor authentication for every sign-in." },
      { "key": "D", "text": "Create a role that enforces MFA in its trust policy, instruct users to run sts assume-role with the --serial-number and --token-code parameters, and add sts:AssumeRole to the NotAction element of the Deny statement." }
    ],
    "correctAnswers": ["B"],
    "explanation": "B is correct. Requests signed with long-term access keys carry no MFA context, so the aws:MultiFactorAuthPresent key is absent and the Deny statement blocks them. Calling sts get-session-token with the MFA device serial number and a current token code returns temporary credentials whose sessions include aws:MultiFactorAuthPresent set to true, so subsequent CLI calls pass the condition. A is wrong because denying when the key is true would block exactly the MFA-authenticated sessions and allow non-MFA access. C is wrong because migrating all API access to SAML federation is a re-architecture of the company's identity model, which is unnecessary to fix CLI access for existing IAM users. D is wrong because adding sts:AssumeRole to the NotAction exemption lets any principal without MFA assume roles, creating a bypass that undermines the MFA requirement.",
    "tags": ["MFA", "STS", "get-session-token", "IAM policy conditions", "CLI"]
  },
  {
    "id": "",
    "certificationId": "aws-scs",
    "domain": "Security Foundations and Governance",
    "difficulty": "professional",
    "type": "single",
    "stem": "A company uses AWS Organizations with the default FullAWSAccess SCP attached to all organizational units. The security team must restrict AWS usage for all existing and future accounts in a specific OU so that resources can be created only in the eu-west-1 Region. A defined set of global services, including IAM, Amazon CloudFront, Amazon Route 53, and AWS Support, must continue to work from their default endpoints. A security engineer will attach a new SCP to the OU. Which SCP meets these requirements?",
    "options": [
      { "key": "A", "text": "A statement with Effect: Allow and Action: \"*\" that includes a condition of StringEquals aws:RequestedRegion: eu-west-1." },
      { "key": "B", "text": "A statement with Effect: Deny and Action: \"*\" that includes a condition of StringEquals aws:RequestedRegion: eu-west-1." },
      { "key": "C", "text": "A statement with Effect: Deny and Action: \"*\" that includes a condition of StringNotEquals aws:RequestedRegion: eu-west-1." },
      { "key": "D", "text": "A statement with Effect: Deny and NotAction set to the global service actions (iam:*, cloudfront:*, route53:*, support:*) that includes a condition of StringNotEquals aws:RequestedRegion: eu-west-1." }
    ],
    "correctAnswers": ["D"],
    "explanation": "D is correct. The Deny applies to every action except the exempted global service actions, and the StringNotEquals condition makes the Deny fire only for requests outside eu-west-1, so regional usage is confined to eu-west-1 while the named global services keep working; because SCPs attached to an OU apply to every current and future account in that OU, no per-account work is needed. A is wrong because SCPs do not grant permissions, and with FullAWSAccess still attached an additional Allow statement imposes no restriction at all. B is wrong because its logic is inverted: it denies requests that are in eu-west-1, the one Region that should remain usable. C is wrong because it denies all non-eu-west-1 requests with no exemption, which breaks the required global services since their control planes resolve to Regions such as us-east-1.",
    "tags": ["SCP", "Organizations", "aws:RequestedRegion", "region restriction"]
  },
  {
    "id": "",
    "certificationId": "aws-scs",
    "domain": "Identity and Access Management",
    "difficulty": "professional",
    "type": "single",
    "stem": "A security engineer needs to configure AWS IAM Identity Center to use the company's external SAML 2.0 identity provider (IdP) as its identity source, and must set up automatic provisioning so that users and groups synchronize from the IdP. Which sequence of steps meets these requirements?",
    "options": [
      { "key": "A", "text": "Obtain the SAML metadata from IAM Identity Center. Obtain the SAML metadata from the external IdP. Configure the external IdP as the identity source in IAM Identity Center by exchanging the metadata between the two systems. Enable automatic provisioning in the IAM Identity Center settings. Enable automatic provisioning in the external IdP by using the provisioning endpoint and access token." },
      { "key": "B", "text": "Configure the external IdP as the identity source in IAM Identity Center. Enable automatic provisioning in the external IdP. Obtain the SAML metadata from IAM Identity Center. Obtain the SAML metadata from the external IdP. Enable automatic provisioning in the IAM Identity Center settings." },
      { "key": "C", "text": "Create an IAM role that has a trust policy that specifies the IdP's API endpoint. Obtain the SAML metadata from the external IdP. Configure the external IdP as the identity source in IAM Identity Center. Enable automatic provisioning in the IAM Identity Center settings. Enable automatic provisioning in the external IdP." },
      { "key": "D", "text": "Enable automatic provisioning in the external IdP. Enable automatic provisioning in the IAM Identity Center settings. Obtain the SAML metadata from the external IdP. Obtain the SAML metadata from IAM Identity Center. Configure the external IdP as the identity source in IAM Identity Center." }
    ],
    "correctAnswers": ["A"],
    "explanation": "A is correct. Changing the identity source to an external IdP is a metadata exchange: the engineer collects the SAML metadata that each side presents, uploads the IdP's metadata into IAM Identity Center while giving the Identity Center metadata to the IdP, and only then enables SCIM automatic provisioning, first in Identity Center, which generates the SCIM endpoint and access token, and then in the IdP, which consumes them. B is wrong because it configures the identity source before the metadata that the configuration requires has been obtained, and it enables provisioning in the IdP before the SCIM endpoint exists. C is wrong because IAM Identity Center federation is configured in Identity Center itself; no IAM role trust policy pointing at an IdP API endpoint is involved. D is wrong because provisioning cannot be enabled in the IdP first, since the SCIM endpoint and token are produced by IAM Identity Center, and the metadata exchange must precede everything.",
    "tags": ["IAM Identity Center", "SAML", "SCIM", "external IdP"]
  }
]
```

- [ ] **Step 6: Fill in the ids**

Run this (also used later; keep as one-liner here since the validator script arrives in Task 2):

```bash
python3 - <<'EOF'
import json, hashlib
p = "data/questions/aws-scs.json"
qs = json.load(open(p))
for q in qs:
    q["id"] = hashlib.sha256(f"aws-scs:{q['stem']}".encode()).hexdigest()[:12]
json.dump(qs, open(p, "w"), indent=2, ensure_ascii=False)
print([q["id"] for q in qs])
EOF
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/validate-questions.test.ts src/lib/__tests__/validate-data.test.ts`
Expected: PASS (aws-scs has ≥5 questions, valid schema, unique ids, valid keys; cert weights sum to 100).

- [ ] **Step 8: Commit**

```bash
git add data/certifications.json data/questions/aws-scs.json src/lib/data.ts src/lib/__tests__/validate-questions.test.ts
git commit -m "feat: add SCS-C03 certification with benchmark seed questions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Mechanical validation script

**Files:**
- Create: `$SCRATCHPAD/validate_scs.py` (NOT committed — scratchpad only, per spec)

**Interfaces:**
- Produces: `python3 $SCRATCHPAD/validate_scs.py <file.json> [--domain "<name>" --expect N] [--fix-ids] [--full]` — exits 0 on pass, 1 with a numbered failure list on fail. `--full` additionally enforces the complete 160-question domain allocation. All later tasks consume this.

- [ ] **Step 1: Write the script**

```python
#!/usr/bin/env python3
"""Mechanical quality gate for the aws-scs question bank (and fragments)."""
import json, hashlib, re, sys, argparse
from collections import Counter

ALLOC = {
    "Identity and Access Management": 32,
    "Infrastructure Security": 29,
    "Data Protection": 29,
    "Detection": 26,
    "Incident Response": 22,
    "Security Foundations and Governance": 22,
}
DOMAINS = set(ALLOC)

def words(s): return len(s.split())

def check(path, domain=None, expect=None, fix_ids=False, full=False):
    qs = json.load(open(path))
    errs, warns = [], []

    if fix_ids:
        for q in qs:
            q["id"] = hashlib.sha256(f"aws-scs:{q['stem']}".encode()).hexdigest()[:12]
        json.dump(qs, open(path, "w"), indent=2, ensure_ascii=False)

    ids = [q.get("id") for q in qs]
    if len(set(ids)) != len(ids):
        errs.append(f"duplicate ids: {[i for i,c in Counter(ids).items() if c>1]}")

    for q in qs:
        qid = q.get("id") or q.get("stem", "")[:40]
        exp = hashlib.sha256(f"aws-scs:{q['stem']}".encode()).hexdigest()[:12]
        if q.get("id") != exp: errs.append(f"{qid}: id != sha256 scheme (expect {exp})")
        if q.get("certificationId") != "aws-scs": errs.append(f"{qid}: bad certificationId")
        if q.get("difficulty") != "professional": errs.append(f"{qid}: bad difficulty")
        if q.get("domain") not in DOMAINS: errs.append(f"{qid}: bad domain {q.get('domain')!r}")
        keys = [o["key"] for o in q.get("options", [])]
        ca = q.get("correctAnswers", [])
        if q.get("type") == "single":
            if keys != ["A","B","C","D"]: errs.append(f"{qid}: single needs options A-D, got {keys}")
            if len(ca) != 1: errs.append(f"{qid}: single needs 1 correct, got {ca}")
        elif q.get("type") == "multiple":
            if keys != ["A","B","C","D","E"]: errs.append(f"{qid}: multiple needs options A-E, got {keys}")
            if len(ca) != 2: errs.append(f"{qid}: multiple needs 2 correct, got {ca}")
            if not q["stem"].rstrip().endswith("(Choose two.)"):
                errs.append(f"{qid}: multiple stem must end with '(Choose two.)'")
        else:
            errs.append(f"{qid}: bad type {q.get('type')!r}")
        for a in ca:
            if a not in keys: errs.append(f"{qid}: correct answer {a} not an option key")
        if not (3 <= len(q.get("tags", [])) <= 6): errs.append(f"{qid}: need 3-6 tags")

        # explanation must address every option letter
        expl = q.get("explanation", "")
        for k in keys:
            pat = rf"(?:^|[\s(]){k}(?:\)|\b)(?=[\s,.:;]|$)"
            if not re.search(pat, expl): errs.append(f"{qid}: explanation never addresses option {k}")
        # no dangling "Option X" beyond real keys
        for m in re.findall(r"[Oo]ption\s+([A-Z])\b", expl):
            if m not in keys: errs.append(f"{qid}: explanation references nonexistent Option {m}")

        n = words(q["stem"])
        seq = "sequence of steps" in q["stem"].lower()
        lo = 60 if seq else 100
        if not (lo <= n <= 200): warns.append(f"{qid}: stem {n} words (target {lo}-180)")

    # per-domain aggregate checks
    for dom in sorted({q["domain"] for q in qs if q.get("domain") in DOMAINS}):
        dqs = [q for q in qs if q["domain"] == dom]
        letters = Counter(a for q in dqs for a in q["correctAnswers"])
        allk = sorted({k for q in dqs for k in [o["key"] for o in q["options"]]})
        counts = [letters.get(k, 0) for k in "ABCD"]  # E only exists on multiples; check A-D core
        if max(counts) - min(counts) > 1 and len(dqs) >= 8:
            errs.append(f"{dom}: key distribution uneven A-D {counts} (max-min>1)")
        keyw, disw, longest = [], [], 0
        for q in dqs:
            kw = [words(o["text"]) for o in q["options"] if o["key"] in q["correctAnswers"]]
            dw = [words(o["text"]) for o in q["options"] if o["key"] not in q["correctAnswers"]]
            keyw += kw; disw += dw
            if min(kw) > max(dw): longest += 1
        ratio = (sum(keyw)/len(keyw)) / (sum(disw)/len(disw))
        if not (0.8 <= ratio <= 1.25):
            errs.append(f"{dom}: key:distractor length ratio {ratio:.2f} outside [0.8,1.25]")
        if len(dqs) >= 8 and longest / len(dqs) >= 0.35:
            errs.append(f"{dom}: keyed option strictly longest in {longest}/{len(dqs)} questions (>=35%)")
        mult = sum(1 for q in dqs if q["type"] == "multiple")
        print(f"  {dom}: {len(dqs)} qs, A-D keys {counts}, ratio {ratio:.2f}, "
              f"key-longest {longest}, multiple {mult} ({100*mult//len(dqs)}%)")

    if domain:
        got = sum(1 for q in qs if q["domain"] == domain)
        if got != expect: errs.append(f"expected {expect} questions in {domain}, got {got}")
        others = [q["domain"] for q in qs if q["domain"] != domain]
        if others: errs.append(f"fragment contains foreign domains: {set(others)}")
    if full:
        got = Counter(q["domain"] for q in qs)
        for dom, n in ALLOC.items():
            if got.get(dom) != n: errs.append(f"full bank: {dom} has {got.get(dom,0)}, expected {n}")
        if len(qs) != 160: errs.append(f"full bank: {len(qs)} questions, expected 160")

    for w in warns: print(f"WARN: {w}")
    if errs:
        print(f"\nFAIL ({len(errs)}):")
        for i, e in enumerate(errs, 1): print(f"  {i}. {e}")
        return 1
    print(f"\nPASS: {len(qs)} questions clean")
    return 0

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("file"); ap.add_argument("--domain"); ap.add_argument("--expect", type=int)
    ap.add_argument("--fix-ids", action="store_true"); ap.add_argument("--full", action="store_true")
    a = ap.parse_args()
    sys.exit(check(a.file, a.domain, a.expect, a.fix_ids, a.full))
```

- [ ] **Step 2: Run it against the Task 1 seed to verify it works**

Run: `python3 $SCRATCHPAD/validate_scs.py data/questions/aws-scs.json`
Expected: PASS with 5 questions (per-domain aggregate checks print; distribution/ratio gates only fire at ≥8 questions per domain, and IAM at 4 questions with keys C,A,B,A plus Governance D is within tolerance). If the explanation-coverage regex false-positives on the seed questions, fix the regex, not the questions.

- [ ] **Step 3: Verify it fails on bad input**

Run: `python3 -c "import json; qs=json.load(open('data/questions/aws-scs.json')); qs[0]['correctAnswers']=['E']; json.dump(qs, open('$SCRATCHPAD/bad.json','w'))" && python3 $SCRATCHPAD/validate_scs.py $SCRATCHPAD/bad.json; echo "exit=$?"`
Expected: FAIL output listing `correct answer E not an option key`, exit=1.

No commit — the script lives in scratchpad only.

---

### Tasks 3–8: Author domain fragments

Six independent tasks, one per domain — **safe to dispatch in parallel** (each writes only its own fragment file). Each follows the identical step template below; the table gives the per-task parameters. ALL Global Constraints apply — especially stem length, per-option explanations, even key spread, and length parity, which are hard gates in the validator.

| Task | Domain | Fragment file (`$SCRATCHPAD/fragments/`) | Count | ~multiple (2-correct) |
|---|---|---|---|---|
| 3 | Detection | `detection.json` | 26 | 5 |
| 4 | Incident Response | `incident-response.json` | 22 | 4 |
| 5 | Infrastructure Security | `infrastructure-security.json` | 29 | 6 |
| 6 | Identity and Access Management | `iam.json` | 28 | 6 |
| 7 | Data Protection | `data-protection.json` | 29 | 6 |
| 8 | Security Foundations and Governance | `governance.json` | 21 | 4 |

**Key-balance note for Tasks 6 and 8:** the merged domain totals include Task 1's benchmarks. IAM benchmarks contribute keys C, A, B, A; Governance contributes D. Aim the fragment's A–D key counts so the domain total is even: IAM fragment ≈ A6 B7 C7 D8 (+E from multiples spread evenly); Governance fragment ≈ A6 B6 C5 D4. Other domains: spread A–D within max−min ≤ 1.

**Topic coverage per domain** (draw scenarios across the full list; no more than 3 questions on any one service feature):

- **Detection (Task 3):** GuardDuty findings triage and multi-account delegated admin; GuardDuty protection plans (S3 Protection, Runtime Monitoring, Malware Protection); Security Hub standards, central configuration, aggregation Regions, automation rules, ASFF; Amazon Inspector (ECR/EC2/Lambda scanning); Amazon Macie discovery jobs and findings; Amazon Detective investigation; CloudWatch metric filters and alarms on CloudTrail logs; EventBridge routing of findings; AWS Config rules as detection controls; analyzing VPC Flow Logs, Route 53 Resolver query logs, and CloudTrail for indicators of compromise; unusual-API-activity and credential-exfiltration detection.
- **Incident Response (Task 4):** compromised IAM credential playbook (deactivate key, revoke sessions via role policy timestamp condition, review CloudTrail); compromised EC2 instance forensics (isolate with a no-rule security group, remove role, snapshot EBS, memory capture, protect from termination); GuardDuty finding auto-remediation via EventBridge + Lambda/Systems Manager runbooks; Security Hub custom actions; S3 public-exposure and ransomware response (Block Public Access, Object Lock, versioning recovery); KMS key compromise and CloudTrail-verified key usage; root credential compromise steps; forensic account/environment patterns and chain of custody; AWS Systems Manager Incident Manager; capturing volatile evidence before termination; post-incident CloudTrail/Athena analysis.
- **Infrastructure Security (Task 5):** security group vs network ACL design; AWS WAF (managed rules, rate-based rules, scope-down, CAPTCHA); Shield Advanced and DDoS response; AWS Network Firewall (stateful rules, TLS inspection, egress filtering); Route 53 Resolver DNS Firewall; VPC interface/gateway endpoints and endpoint policies; PrivateLink service exposure; ALB mTLS and TLS security policies; CloudFront + origin cloaking (custom headers, OAC); EC2 IMDSv2 enforcement; Nitro Enclaves for isolating sensitive compute; Systems Manager Patch Manager and Session Manager (no inbound SSH); egress control via NAT/proxy; Verified Access for VPN-less access.
- **IAM (Task 6):** policy evaluation logic (explicit deny, identity vs resource policy union in-account, cross-account requiring both sides); permission boundaries; SCPs vs RCPs (resource control policies, GA Nov 2024) in evaluation; role trust policies, ExternalId and the confused-deputy problem; sts:AssumeRole vs federation vs Cognito identity pools; session policies and session tags for ABAC; IAM Access Analyzer (external access, unused access, policy generation from CloudTrail); IAM Identity Center permission sets and external IdP; IAM Roles Anywhere for on-premises workloads; service-linked roles; aws:PrincipalOrgID and aws:SourceArn/aws:SourceAccount conditions; access key rotation and credential reports.
- **Data Protection (Task 7):** KMS key policies vs grants vs IAM policies; cross-account KMS usage (kms:ViaService, kms:EncryptionContext conditions); customer managed vs AWS managed keys, imported key material, multi-Region keys, automatic rotation; envelope encryption and the Encryption SDK; S3 encryption (SSE-KMS with bucket keys, DSSE-KMS, enforcing encryption and TLS with aws:SecureTransport); EBS encryption by default; CloudHSM vs KMS custom key store; ACM certificate management (including exportable public certificates, 2025) and TLS termination choices; Secrets Manager rotation vs Parameter Store; Macie for sensitive-data discovery; S3 Object Lock compliance mode; data-in-transit enforcement patterns.
- **Governance (Task 8):** Organizations structure and delegated administrator patterns; SCP authoring (region deny, service allow-lists) and RCPs for resource-perimeter controls; data perimeters (aws:PrincipalOrgID, aws:ResourceOrgID, aws:SourceOrgID); Control Tower landing zone, controls, and Account Factory; AWS Config conformance packs and organization rules; centralized logging architecture (org CloudTrail, log archive account, S3 + KMS design); Audit Manager; AWS Artifact for compliance reports; root account hardening and centralized root access management; tagging policies; security reference architecture (audit/security-tooling accounts); Trusted Advisor security checks.

Step template (identical for Tasks 3–8; substitute the task's parameters):

- [ ] **Step 1: Author `<count>` questions into the fragment file**

Create `$SCRATCHPAD/fragments/<file>` as a JSON array of question objects with `"id": ""`, `"certificationId": "aws-scs"`, `"domain": "<domain>"`, `"difficulty": "professional"`. Exactly `<count>` questions; `<multiple>` of them `type: "multiple"` (5 options A–E, exactly 2 correct, stem ends `(Choose two.)`), the rest `type: "single"` (4 options A–D, 1 correct). Cover the domain's topic list above; write plausible distractors that are real AWS features misapplied (wrong scope, wrong layer, more overhead, or violates a stated constraint) — never absurd throwaways. Assign correct-answer letters BEFORE writing text, following the key-balance note, and write the keyed option and distractors to comparable length.

- [ ] **Step 2: Validate the fragment**

Run: `python3 $SCRATCHPAD/validate_scs.py $SCRATCHPAD/fragments/<file> --fix-ids --domain "<domain>" --expect <count>`
Expected: PASS. Fix every listed failure and re-run until clean. Warnings about stem length must be resolved unless the stem is an ordered-sequence question.

- [ ] **Step 3: Self-review answer keys**

Re-read each question asking "could a distractor also satisfy every stated constraint?" — if yes, sharpen the stem's deciding constraint (then re-run Step 2, since stem edits change ids). No commit — fragments are scratchpad files; the merge task commits.

---

### Task 9: Merge fragments and full-bank validation

**Files:**
- Modify: `data/questions/aws-scs.json` (5 → 160 questions)

**Interfaces:**
- Consumes: `$SCRATCHPAD/fragments/*.json` (six fragments), Task 1's seed bank, Task 2's validator.
- Produces: the complete 160-question `data/questions/aws-scs.json`, ordered by domain group.

- [ ] **Step 1: Merge**

```bash
python3 - <<'EOF'
import json, os
S = os.environ["SCRATCHPAD"] + "/fragments"
bank = json.load(open("data/questions/aws-scs.json"))
order = ["Detection", "Incident Response", "Infrastructure Security",
         "Identity and Access Management", "Data Protection",
         "Security Foundations and Governance"]
frags = ["detection.json", "incident-response.json", "infrastructure-security.json",
         "iam.json", "data-protection.json", "governance.json"]
for f in frags:
    bank += json.load(open(f"{S}/{f}"))
bank.sort(key=lambda q: order.index(q["domain"]))
json.dump(bank, open("data/questions/aws-scs.json", "w"), indent=2, ensure_ascii=False)
print(len(bank))
EOF
```

Expected output: `160`.

- [ ] **Step 2: Full mechanical validation**

Run: `python3 $SCRATCHPAD/validate_scs.py data/questions/aws-scs.json --full`
Expected: PASS — all six domains at allocation, key spreads max−min ≤ 1, ratios in range. Fix any cross-fragment issues (e.g., duplicate stems producing duplicate ids) by editing the offending questions, then re-run with `--fix-ids`.

- [ ] **Step 3: App test suite, lint, build**

Run: `npm run test && npm run lint && npm run build`
Expected: all pass; build output contains `out/exam/aws-scs/` routes (check with `ls out/exam/aws-scs/`).

- [ ] **Step 4: Commit**

```bash
git add data/questions/aws-scs.json
git commit -m "feat: add 160-question SCS-C03 bank across all six domains

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Adversarial answer-key review and fixes

**Files:**
- Modify: `data/questions/aws-scs.json` (fixes only)

**Interfaces:**
- Consumes: the merged 160-question bank; Task 2's validator.
- Produces: the final reviewed bank.

- [ ] **Step 1: Dispatch six independent key-review subagents (one per domain, parallel)**

Each reviewer gets ONLY its domain's questions (extract with `python3 -c "import json;qs=json.load(open('data/questions/aws-scs.json'));json.dump([q for q in qs if q['domain']=='<domain>'],open('$SCRATCHPAD/review-<slug>.json','w'),indent=2)"`) and this brief, verbatim:

> You are an adversarial reviewer for AWS Certified Security – Specialty (SCS-C03) exam questions. For each question in the attached JSON, independently determine the correct answer(s) from the stem and options alone, WITHOUT looking at correctAnswers or the explanation first. Then compare. Report a numbered list of: (1) questions where your answer differs from correctAnswers, with your reasoning and confidence (high/medium/low); (2) factual errors in any option or explanation text against AWS behavior as of 2026 (post-Dec-2025 exam scope); (3) questions where two options both satisfy every stated constraint. Do not report style issues. Return findings as JSON: `[{"id": "...", "issue": "wrong-key|fact-error|ambiguous", "detail": "...", "confidence": "high|medium|low"}]`. An empty array is a valid result.

- [ ] **Step 2: Adjudicate and fix**

For each finding, verify the claim yourself before changing anything (check AWS docs via WebSearch if uncertain; a reviewer can be wrong). Apply fixes:
- **Wrong key** → swap option *texts* so the correct content sits on the already-keyed letter (do NOT change `correctAnswers` — preserves distribution), then rewrite the explanation to match the new letter assignment.
- **Fact error** → correct the offending text; if the stem changes, ids regenerate.
- **Ambiguous** → sharpen the stem's deciding constraint or weaken the runner-up option.

- [ ] **Step 3: Re-validate**

Run: `python3 $SCRATCHPAD/validate_scs.py data/questions/aws-scs.json --full --fix-ids && npm run test`
Expected: PASS both.

- [ ] **Step 4: Commit**

```bash
git add data/questions/aws-scs.json
git commit -m "fix: apply adversarial key review to SCS-C03 bank

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-review checklist (done at planning time)

- Spec coverage: cert config (T1), 160-q allocation (T3–8 + T1 benchmarks = 26/22/29/32/29/22 ✓ sums 160), sample adaptation (T1), direct authoring (T3–8), mechanical gates (T2, T9), adversarial review (T10), integration/tests (T1, T9). Headroom: min domain 22 ≥ ⌈65×0.14⌉ = 10 ✓.
- No placeholders: all code/data steps carry full content; authoring steps carry the complete brief, counts, key quotas, and topic lists.
- Type consistency: validator flags/paths match between T2 definition and T3–10 usage; fragment filenames match between the T3–8 table and T9's merge list.
