# Workbench Verification Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the domain/application core that safely turns a tested recommendation into implementation tracking and, only with comparable post-change evidence, a VERIFIED savings result.

**Architecture:** Extend the existing pure TypeScript evidence engine with four focused modules: session-derived authorization, an append-only savings-state ledger, implementation records, and a verification engine. Verification reuses exact rational economics and complete-day coverage; it returns precise blocking reasons instead of assigning VERIFIED when comparability or post-change performance is missing. Product events use an allowlisted payload contract so sensitive content cannot enter observability.

**Tech Stack:** Node 24, TypeScript 6 strict mode, Zod 4, Vitest 5, existing bigint rational economics, existing coverage engine, ESLint, Prettier, GitHub Actions.

**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md`, especially sections 11.3, 12, 18, 20–22, 24, 26–27, 29.2, and 29.6.

## Global Constraints

- Financial intermediates use exact rational arithmetic; JavaScript `Number` is not used for financial values.
- `OPPORTUNITY → TESTED → VERIFIED` is the only forward trust-state path; evidence corrections append invalidation events and never rewrite history.
- VERIFIED requires an implemented change, at least seven complete days in both baseline and post windows, non-overlapping windows, exclusion of rollout/stabilization time, same workload/currency/denominator/attribution scope, comparability attestations, post-window performance evidence, and positive or negative exact net-impact calculation.
- Negative verified impact remains visible as a verified cost increase; it is never clamped to zero.
- An old benchmark does not prove post-change quality.
- OWNER inherits OPERATOR abilities; OPERATOR may mark implementation and submit verification evidence; VIEWER is read-only. Only OWNER manages membership and credential references.
- Every authorization decision derives organization membership from the authenticated session; caller-supplied organization IDs are never authority.
- Raw prompts, responses, credentials, uploaded rows, request headers/bodies, and unrestricted error strings never enter product events.
- No provider credentials, paid API calls, customer-side production changes, deployment, or prospect outreach are authorized by this milestone.

---

### Task 1: Session-derived authorization

**Files:**
- Create: `src/workbench/authz.ts`
- Create: `src/workbench/index.ts`
- Test: `tests/workbench/authz.test.ts`

**Interfaces:**

```ts
export type Role = 'OWNER' | 'OPERATOR' | 'VIEWER';
export type WorkbenchAction =
  | 'READ'
  | 'IMPORT'
  | 'BENCHMARK'
  | 'PREPARE_GUIDE'
  | 'MARK_IMPLEMENTED'
  | 'SUBMIT_VERIFICATION'
  | 'MANAGE_MEMBERSHIP'
  | 'MANAGE_CREDENTIAL_REFERENCE';

export type SessionMembership = Readonly<{
  organizationId: string;
  role: Role;
}>;

export type AuthenticatedSession = Readonly<{
  userId: string;
  memberships: readonly SessionMembership[];
}>;

export function authorize(
  session: AuthenticatedSession,
  organizationId: string,
  action: WorkbenchAction,
): Readonly<{ allowed: boolean; role: Role | null; reason: string | null }>;
```

- [ ] **Step 1: Write failing authorization-matrix tests.** Test VIEWER read-only, OPERATOR read/import/benchmark/guide/implementation/verification, OWNER all actions, and cross-tenant denial when the requested organization is not in `session.memberships`.
- [ ] **Step 2: Run `npm test -- tests/workbench/authz.test.ts` and verify RED.**
- [ ] **Step 3: Implement a static role/action matrix.** Do not accept role or organization membership from request payloads outside the authenticated session object.
- [ ] **Step 4: Run focused tests and `npm run typecheck`; verify GREEN.**
- [ ] **Step 5: Commit as `feat: add session-derived workbench authorization`.**

### Task 2: Append-only savings-state ledger

**Files:**
- Create: `src/ledger/ledger.ts`
- Create: `src/ledger/index.ts`
- Test: `tests/ledger/ledger.test.ts`

**Interfaces:**

```ts
export type SavingsState = 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';
export type LedgerEventType = 'STATE_RECORDED' | 'STATE_INVALIDATED';

export type LedgerEvent = Readonly<{
  id: string;
  recommendationId: string;
  organizationId: string;
  type: LedgerEventType;
  state: SavingsState;
  occurredAt: string;
  evidenceRef: string;
  reason: string | null;
  invalidatesEventId: string | null;
}>;

export function appendState(input: Readonly<{
  history: readonly LedgerEvent[];
  event: LedgerEvent;
}>): readonly LedgerEvent[];

export function currentValidState(
  history: readonly LedgerEvent[],
  recommendationId: string,
): SavingsState | null;
```

- [ ] **Step 1: Write failing transition tests.** Cover initial OPPORTUNITY, OPPORTUNITY→TESTED, TESTED→VERIFIED, rejection of skips/regressions, duplicate IDs, cross-recommendation invalidation, invalidating an event while preserving it in history, and recomputing the latest valid state.
- [ ] **Step 2: Verify RED with `npm test -- tests/ledger/ledger.test.ts`.**
- [ ] **Step 3: Implement immutable append-only history.** `STATE_INVALIDATED` must reference an earlier same-organization/same-recommendation state event and may not delete or mutate it.
- [ ] **Step 4: Verify focused tests and typecheck GREEN.**
- [ ] **Step 5: Commit as `feat: add append-only savings state ledger`.**

### Task 3: Implementation record and guide evidence

**Files:**
- Create: `src/implementation/records.ts`
- Create: `src/implementation/index.ts`
- Test: `tests/implementation/records.test.ts`

**Interfaces:**

```ts
export type ImplementationGuide = Readonly<{
  recommendationId: string;
  organizationId: string;
  proposedChange: string;
  workload: string;
  environment: string;
  prerequisites: readonly string[];
  rolloutSteps: readonly string[];
  metricsToWatch: readonly string[];
  stopConditions: readonly string[];
  rollbackInstructions: readonly string[];
  expectedEconomicsEvidenceRef: string;
  reviewedByOperatorUserId: string | null;
  reviewedAt: string | null;
}>;

export type ImplementationRecord = Readonly<{
  recommendationId: string;
  organizationId: string;
  implementedAt: string;
  rolloutStart: string;
  stabilizationEnd: string;
  deploymentNote: string;
  rollbackInstructions: readonly string[];
  confirmedByUserId: string;
}>;

export function markGuideReviewed(...): ImplementationGuide;
export function createImplementationRecord(...): ImplementationRecord;
```

- [ ] **Step 1: Write failing tests.** Require non-empty guide fields; review requires OPERATOR/OWNER authorization supplied as a prior authorization result; implementation requires `stabilizationEnd >= rolloutStart`, authenticated confirmation, and preserved rollback instructions.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement strict Zod validation and immutable records.** The module records the change; it never applies it.
- [ ] **Step 4: Verify focused tests/typecheck GREEN.**
- [ ] **Step 5: Commit as `feat: add implementation guide and confirmation records`.**

### Task 4: Post-change verification engine

**Files:**
- Create: `src/verification/contracts.ts`
- Create: `src/verification/verify.ts`
- Create: `src/verification/index.ts`
- Test: `tests/verification/verify.test.ts`

**Interfaces:**

```ts
export type VerificationBlockReason =
  | 'IMPLEMENTATION_REQUIRED'
  | 'BASELINE_COVERAGE_INSUFFICIENT'
  | 'POST_COVERAGE_INSUFFICIENT'
  | 'WINDOWS_OVERLAP'
  | 'ROLLOUT_OR_STABILIZATION_OVERLAP'
  | 'WORKLOAD_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'DENOMINATOR_MISMATCH'
  | 'ATTRIBUTION_SCOPE_MISMATCH'
  | 'UNIT_DEFINITION_CHANGED'
  | 'WORKLOAD_MIX_NOT_COMPARABLE'
  | 'CONCURRENT_DEPLOYMENT_UNRESOLVED'
  | 'POST_QUALITY_EVIDENCE_REQUIRED'
  | 'PERFORMANCE_CONSTRAINT_FAILED'
  | 'BASELINE_UNITS_MISSING_OR_ZERO'
  | 'POST_UNITS_MISSING';

export type VerificationResult = Readonly<{
  status: 'VERIFIED' | 'BLOCKED';
  reasons: readonly VerificationBlockReason[];
  netImpact: Readonly<{ numerator: string; denominator: string }> | null;
  direction: 'SAVING' | 'COST_INCREASE' | 'NO_CHANGE' | null;
  formulaVersion: 'economics-v1' | null;
}>;

export function verifyPostChange(input: unknown): VerificationResult;
```

Input contains: implementation record; baseline/post date windows and complete-day lists; workload/configuration versions; currency; denominator type (`SUCCESSFUL_OUTCOMES` or `REQUESTS`); attribution scope; success/unit-definition attestations; workload-mix comparability; concurrent-deployment resolution; baseline cost/units; post actual cost/units; implementation cost in window; incremental operating cost; and post-window quality/latency/failure measurements plus configured constraints.

- [ ] **Step 1: Write failing golden-path and blocker tests.** Golden path: baseline cost `1`, baseline units `3`, post units `3`, actual post cost `0.5`, implementation cost `0.1`, operating cost `0.05` gives exact `7/20`; both windows have seven complete days; post quality passes. Test negative impact remains VERIFIED with `COST_INCREASE`.
- [ ] **Step 2: Add failing blocker tests.** Cover each comparability rule from section 29.2: insufficient coverage, overlap, stabilization intersection, workload/currency/denominator/attribution mismatch, changed unit definition/success definition, workload-mix change, concurrent deployment, missing post quality, failed post performance, zero/missing baseline units, missing post units.
- [ ] **Step 3: Verify RED.**
- [ ] **Step 4: Implement deterministic gate ordering.** Collect all applicable blocker reasons; perform exact `counterfactualImpact` only when every blocker is clear. Use unrounded values for thresholds. Never use a historical benchmark as post-window quality evidence.
- [ ] **Step 5: Verify focused tests/typecheck GREEN.**
- [ ] **Step 6: Commit as `feat: add comparable post-change verification engine`.**

### Task 5: Safe product-event contract

**Files:**
- Create: `src/product-events/events.ts`
- Create: `src/product-events/index.ts`
- Test: `tests/product-events/events.test.ts`

**Interfaces:**

```ts
export type ProductEventName =
  | 'IMPORT_STARTED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'ANALYSIS_COMPLETED'
  | 'FIRST_MEANINGFUL_OPPORTUNITY'
  | 'BENCHMARK_STARTED'
  | 'BENCHMARK_COMPLETED'
  | 'RECOMMENDATION_VIEWED'
  | 'IMPLEMENTATION_GUIDE_VIEWED'
  | 'RECOMMENDATION_MARKED_IMPLEMENTED'
  | 'VERIFICATION_COMPLETED'
  | 'VERIFIED_SAVING_ACHIEVED';

export function createProductEvent(input: unknown): ProductEvent;
```

Allow event properties only from an explicit scalar allowlist: IDs, counts, durations, states, safe error category, and exact money strings. Reject property names containing prompt/response/credential/secret/token/header/body/row/errorMessage and reject objects/arrays or unrestricted text properties.

- [ ] **Step 1: Write failing allowlist/redaction tests.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement strict schemas and deep freezing.**
- [ ] **Step 4: Verify GREEN.**
- [ ] **Step 5: Commit as `feat: add safe product event boundary`.**

### Task 6: Package exports and integration journey

**Files:**
- Modify: `src/index.ts`
- Modify: `package.json`
- Test: `tests/integration/implemented-verification-flow.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write a failing integration journey.** Construct authenticated OPERATOR session → append OPPORTUNITY → append TESTED → mark implementation → submit comparable post evidence → receive exact VERIFIED impact → append VERIFIED ledger state. Assert VIEWER cannot perform the implementation/verification actions.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Export `./workbench`, `./ledger`, `./implementation`, `./verification`, and `./product-events`; document the milestone honestly.**
- [ ] **Step 4: Run `npm run check` and `npm audit --audit-level=high`; verify GREEN.**
- [ ] **Step 5: Open a PR, require GitHub CI including Gitleaks, review the diff, and merge only after a fully green final head.**

## Acceptance Boundary

This milestone is complete when the repository can prove, in deterministic tests, that only an authorized operator/owner can record implementation and verification evidence; a recommendation cannot become VERIFIED without all comparability/performance gates; exact net impact is preserved including negative impact; the state history remains append-only; and observability cannot accept sensitive-content fields.

It is **not** yet the final sellable UI. A subsequent bounded milestone will add the PostgreSQL/Drizzle persistence layer, passwordless authentication adapter, founder dashboard, Optimization Lab/report rendering, and accessibility/end-to-end flow. Provider connectors stay gated until that work, the credential security gate, and explicit owner approval are complete.
