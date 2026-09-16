# Evalomics V0 Release Completion Design

**Status:** Approved release-completion design  
**Date:** 2026-09-16  
**Product owner:** Nikhilesh R. Sahu  
**Repository:** `NikhileshRSahu/ai-cost-performance-optimizer`  
**Release branch:** `fix/recovery-ui-backend`  
**Release PR:** #32 — `recovery: stabilize Evalomics UI and backend release path`  
**Product spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md`  
**North-star metric:** Verified net savings

## 1. Purpose

This document does not redefine the Evalomics V0 product. The approved V0 specification remains authoritative for product behavior, mathematics, evidence states, and non-goals.

This document defines the shortest defensible path from the current recovery branch to a sellable, production-ready V0.

The release is complete only when one real customer can finish the core journey without hidden manual repair:

`LAND → SIGN IN → WORKSPACE → IMPORT CSV → DIAGNOSE → DEFINE CONSTRAINTS → TEST CANDIDATE → IMPLEMENT → UPLOAD POST-CHANGE DATA → VERIFY → SEE VERIFIED NET SAVINGS → VIEW PROOF`

The release must preserve the evidence-state invariant:

`OPPORTUNITY → TESTED → VERIFIED`

A lower state may never be presented as a higher state. Demo evidence may never be presented as customer evidence.

## 2. Current Repository State

The recovery branch already contains the major V0 surfaces and backend systems:

- public landing and acquisition tools;
- login and Neon Auth integration;
- organization-scoped authenticated workbench;
- health endpoint that separates database and auth readiness;
- CSV evidence import and validation;
- deterministic diagnosis/economic analysis;
- workload constraints;
- benchmark decision flow;
- Optimization Lab;
- implementation confirmation;
- post-change verification;
- verified savings proof/report surfaces;
- telemetry credential workflow;
- PostgreSQL persistence and migrations;
- unit/integration tests;
- Playwright E2E tests;
- Docker build;
- CI gates including formatting, linting, type checking, tests, database drill, E2E, dependency audit, Docker build, and gitleaks.

The current release branch is therefore in release-hardening, not greenfield product construction.

## 3. Completion Principle

Do not patch symptoms one by one without first locating the owning subsystem.

For each remaining failure:

1. identify whether it belongs to product behavior, data integrity, security, UX/design system, deployment, or test infrastructure;
2. fix the owning subsystem once;
3. run the narrowest relevant test;
4. run the full release pipeline only after the narrow test passes;
5. do not weaken assertions merely to obtain a green check.

No new feature work enters V0 unless the audit shows it is required for the core release contract.

## 4. V0 Completion Matrix

| Subsystem | Current assessment | Release requirement |
|---|---|---|
| Public landing | Implemented | Clear value proposition, correct CTA paths, responsive and accessible |
| Free calculators | Implemented | Exact arithmetic, no hidden FX conversion, public without auth |
| Login/auth UI | Implemented | Preview-safe behavior and working production Google sign-in |
| Neon Auth proxy | Implemented but production verification pending | Stable production hostname works with correct callback/origin |
| Database readiness | Implemented | Health check proves live DB connectivity |
| Auth readiness | Implemented | Health check proves auth/JWKS readiness separately from DB |
| Tenant isolation | Implemented with tests | Cross-tenant access denied without data leakage |
| CSV import | Implemented | Required columns, size/row caps, null-vs-zero integrity, duplicate handling |
| Diagnosis/economics | Implemented | Exact-decimal calculations, unsupported claims withheld |
| Constraints | Implemented | Verification blocked until workload constraints exist |
| Benchmark decision | Implemented | OPTIMIZE / DO_NOT_CHANGE / INSUFFICIENT_EVIDENCE behave per spec |
| Optimization Lab | Implemented | Current-vs-candidate evidence renders with recovery states |
| Implementation tracking | Implemented | Implemented state persisted before verification |
| Post-change upload | Implemented | Size/validation protections match baseline import rigor |
| Verification | Implemented | VERIFIED only after comparability, performance and economic checks pass |
| Proof/report | Implemented | Evidence states, limitations, provenance and synthetic demo labeling remain explicit |
| Telemetry credential flow | Implemented | Least-privilege credential path and accessibility pass |
| Accessibility | Partially complete | WCAG AA release E2E passes across dark and light surfaces |
| Responsive visual QA | Not yet release-verified | Desktop/mobile screenshots show no broken hierarchy or overflow |
| CI | Not yet green | Every release gate passes on one unchanged candidate commit |
| Vercel preview | Pending fresh candidate | Preview must be built from current release head |
| Production deployment | Pending | Stable `evalomics.vercel.app` serves the release candidate |
| Production auth | Pending | Real Google login works on stable production hostname |
| Production core journey | Pending | Full CSV → verified savings flow succeeds against production services |
| Release ledger | Missing | Final evidence records commit, CI, deployment, health, auth, E2E and QA results |

## 5. Frozen V0 Release Scope

### 5.1 Must ship

The following are blocking:

- the complete CSV-first customer journey;
- exact savings mathematics and evidence-state integrity;
- organization isolation;
- production database/auth readiness;
- Google sign-in on the stable production hostname;
- deterministic benchmark and verification decisions;
- professional proof/report output;
- accessibility on critical routes;
- responsive desktop/mobile behavior;
- dependency/security scan gates;
- reproducible Docker build;
- production smoke test.

### 5.2 Explicitly post-V0

The following do not block V0 unless they are already required by an existing core flow:

- automatic provider-side configuration changes;
- automatic billing/subscription system;
- enterprise SSO;
- broad provider connector catalogue;
- ChatGPT/Claude/email memory ingestion;
- automatic prompt rewriting;
- advanced agent workflow reconstruction;
- generalized LLM observability;
- cosmetic animation expansion;
- broad design-system refactors unrelated to the release;
- marketing automation.

## 6. Release Acceptance Contract

### 6.1 Functional acceptance

A release candidate passes only if all of the following work from a clean account/workspace:

1. User lands on Evalomics and understands the product promise.
2. User can reach login without dead or misleading CTA paths.
3. Production Google sign-in succeeds.
4. User reaches an organization-scoped workbench.
5. User uploads a conforming CSV.
6. Invalid rows are rejected visibly; missing data stays missing rather than becoming zero.
7. Accepted evidence creates a defensible diagnosis.
8. User defines workload constraints.
9. User evaluates a current/candidate benchmark.
10. The decision engine produces the correct decision state.
11. User records implementation.
12. User uploads a post-change evidence window.
13. Verification checks comparability, constraints and economics.
14. VERIFIED is produced only when all verification requirements pass.
15. Failed quality/performance never becomes VERIFIED.
16. Negative verified impact is shown as a cost increase, not hidden.
17. Proof/report shows scope, evidence state, formulas, confidence, limitations and demo status.

### 6.2 Trust acceptance

- Demo data is permanently labeled synthetic.
- Customer evidence is never inferred from demo fixtures.
- Potential, Tested and Verified remain visually and semantically distinct.
- Unsupported calculations display unavailable/withheld states.
- Financial claims include currency and comparison horizon.
- Raw prompts/responses are not required for the V0 CSV-first flow.
- Missing values are not coerced to zero.

### 6.3 Security acceptance

- Unauthorized and cross-tenant routes fail closed.
- Credentials/secrets do not appear in logs or committed source.
- gitleaks passes.
- High-severity dependency audit gate passes or any accepted exception is documented with an explicit release decision.
- Telemetry credentials remain least-privilege.
- Production auth callbacks/origins use only approved stable hosts.
- Arbitrary Vercel preview hosts do not expose broken production social-auth flows.

### 6.4 Reliability acceptance

One unchanged release candidate commit must pass:

1. `npm ci`
2. `npm run check`
3. `npm run web:build`
4. `npm run test:db`
5. database backup/restore drill
6. Playwright install
7. `npm run web:e2e`
8. `npm audit --audit-level=high`
9. Docker build
10. gitleaks

A later commit invalidates the previous full green result and requires a fresh run.

## 7. Remaining Work by Owning Subsystem

### 7.1 Design-system/accessibility cleanup

Current E2E failures are concentrated in contrast handling between authenticated dark workbench surfaces and intentionally light report/recovery surfaces.

Required fix:

- define explicit dark-surface and light-surface text contracts;
- scope selectors to semantic containers instead of broad global descendant overrides;
- keep recovery dark surfaces out of light-report rules;
- keep report cover/sections/disclaimer out of dark-workbench rules;
- ensure state colors still meet contrast;
- rerun the focused recovery/founder E2E tests before the complete suite.

Success criterion: no Axe color-contrast violations on critical E2E routes.

### 7.2 E2E release journey

The automated suite must prove:

- successful hard customer journey reaches verified savings;
- failed post-change quality never becomes verified;
- telemetry credential creation works;
- recovery states remain actionable and accessible;
- founder traverses dashboard, lab and report;
- cross-tenant URL is denied;
- public tools and login remain usable.

Any flaky timeout should be fixed at the underlying state/readiness boundary before extending a timeout. Timeout extension is allowed only when the state is correct and the wait condition is objectively too short.

### 7.3 CI final gates

After E2E is green, do not stop.

Run and record:

- high-severity dependency audit;
- Docker image build;
- gitleaks.

Any failure is a release blocker until diagnosed and resolved or explicitly documented as a non-exploitable, accepted exception.

### 7.4 Deployment and runtime

A fresh Vercel deployment must be built from the final candidate commit.

Verify:

- deployed commit SHA matches the release candidate;
- homepage responds successfully;
- public tools render;
- `/api/health` separately reports DB and auth readiness;
- production environment variables are present through provider-managed configuration, never printed;
- stable hostname is `https://evalomics.vercel.app`.

Do not treat Vercel Hobby build-rate limits as application build failures.

### 7.5 Production authentication

Test Google login only against the stable production hostname or another explicitly trusted stable host.

Pass conditions:

- sign-in redirects through Google;
- callback returns to Evalomics;
- session is established;
- authenticated route resolves;
- no invalid-hostname proxy error;
- no preview-host workaround is required.

### 7.6 Production core-flow verification

Execute the complete CSV-first flow with a non-customer test fixture clearly marked as test/demo:

- login;
- workspace;
- evidence upload;
- diagnosis;
- constraints;
- benchmark;
- implementation;
- post-change upload;
- verification;
- proof.

Pass conditions:

- expected records persist;
- state transitions are correct;
- verified savings appears only in the passing fixture;
- failing fixture remains below VERIFIED;
- report matches persisted evidence.

### 7.7 Visual QA

Capture desktop and mobile evidence for:

- homepage;
- login;
- overview;
- Evidence;
- Constraints;
- Test;
- Verify;
- proof/report.

Review:

- hierarchy;
- contrast;
- overflow;
- truncation;
- keyboard focus;
- CTA clarity;
- evidence-state clarity;
- demo labeling;
- responsive navigation.

Only release-blocking visual defects are fixed during this pass. Pure polish moves to post-V0.

## 8. Execution Order

The remaining work must be executed in this order:

1. complete focused accessibility/design-system fix;
2. run focused failing E2E tests;
3. run complete CI on one unchanged commit;
4. resolve audit/Docker/gitleaks blockers if any;
5. produce fresh Vercel preview;
6. verify `/api/health`;
7. verify production Google auth;
8. run production CSV → verified-savings journey;
9. run desktop/mobile visual QA;
10. fix only release-blocking production/visual defects;
11. rerun affected automated and production checks;
12. write release ledger;
13. mark PR #32 ready;
14. merge PR #32;
15. deploy/verify production from merged main.

PR #31 is superseded and must not be merged as the release path.

## 9. Release Ledger

Create `docs/release/evalomics-v0-release-ledger.md` containing:

- final commit SHA;
- PR number;
- CI run ID and result;
- unit/integration result;
- DB drill result;
- E2E result;
- dependency audit result;
- Docker result;
- gitleaks result;
- Vercel deployment ID and deployed SHA;
- production URL;
- health result with DB/auth statuses;
- production auth result;
- production core-journey result;
- desktop/mobile QA checklist;
- known non-blocking limitations;
- explicit post-V0 list.

No item may be marked passed from assumption. Each item requires observed evidence.

## 10. Definition of Done

Evalomics V0 is done when all of the following are true simultaneously:

- PR #32 contains the intended release candidate;
- one unchanged commit passes the entire CI pipeline;
- fresh deployment is built from that commit;
- DB and auth health are green;
- production Google login succeeds;
- complete CSV-first customer journey succeeds;
- failing verification fixture does not become VERIFIED;
- accessibility E2E has no blocking violations;
- desktop/mobile release QA passes;
- release ledger is complete;
- PR #32 is merged;
- production is smoke-tested after merge.

Anything beyond this list is either a bug discovered during verification or post-V0 work.

## 11. Non-negotiable Release Rules

- Do not merge PR #31.
- Do not merge PR #32 while draft gates are incomplete.
- Do not weaken trust-state logic.
- Do not disable accessibility checks to make CI green.
- Do not invent provider/runtime success.
- Do not log or expose secrets during verification.
- Do not add unrelated features during release hardening.
- Do not claim release completion until the release ledger contains evidence for every blocking gate.
