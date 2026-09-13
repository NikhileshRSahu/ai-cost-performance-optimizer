# Customer Loop V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the first paid-audit customer loop from CSV upload through workload constraints, benchmark evidence, implementation confirmation, post-change verification, and verified net savings, then validate the entire flow with a hard synthetic dataset plus attributed public research data.

**Architecture:** Reuse the existing PostgreSQL schema and exact-domain engine. Add organization-scoped application services plus server-rendered Next.js workflow pages and POST route handlers. Customer uploads remain CSV-first; benchmark and verification evidence are converted into the existing canonical/domain types before persistence. No provider credentials or production-side configuration changes are introduced.

**Tech Stack:** Next.js 16, TypeScript 6, PostgreSQL/Drizzle, Zod, existing CSV/benchmark/verification engines, Vitest, Playwright, axe.

**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md`

## Global Constraints

- All writes require persisted OWNER/OPERATOR authorization; VIEWER remains read-only.
- Missing numeric evidence is never converted to zero.
- Money stays exact; no floating-point financial arithmetic.
- CSV upload maximum remains 10 MiB / 50,000 rows / 64 KiB per cell.
- A benchmark may issue OPTIMIZE only when the configured quality requirement is measured and all configured constraints pass.
- Implementation is customer-confirmed; the product never applies production changes.
- VERIFIED is assigned only by the existing verification engine after implementation, comparable post-change evidence, coverage, and performance checks pass.
- Demo data always displays “Synthetic demo data — not a customer result.”
- Public research data is labeled as research/reference evidence and never represented as customer production data.
- No OpenAI/Anthropic admin credentials ship in this milestone.

---

### Task 1: Hard demo and research-backed fixtures

**Files:**
- Create: `fixtures/demo/customer-loop-tough.csv`
- Create: `fixtures/demo/customer-loop-post-change.csv`
- Create: `fixtures/research/model-reference-2026.csv`
- Create: `fixtures/research/SOURCES.md`
- Test: `tests/fixtures/customer-loop-fixtures.test.ts`

**Produces:**
- Baseline CSV with >=14 covered calendar days, two workloads, retries, cache fields, mixed latency/success data, duplicates, and deliberately rejected rows while retaining enough valid rows for analysis.
- Post-change CSV with >=7 complete post-stabilization days and comparable denominator evidence.
- Research snapshot explicitly attributed to public sources; only pricing/latency/reference fields are reused.

- [ ] Write failing fixture contract tests for required headers, minimum coverage, partial-invalid behavior, demo flags, and source attribution.
- [ ] Generate the deterministic fixtures and expected accepted/skipped/rejected counts.
- [ ] Verify the tough baseline imports as PARTIAL rather than silently coercing invalid rows.
- [ ] Verify the post-change CSV is independently valid and comparable.
- [ ] Commit fixture + attribution documentation.

### Task 2: CSV upload + import summary customer workflow

**Files:**
- Create: `src/workbench/import-service.ts`
- Create: `apps/web/lib/import-actions.ts`
- Create: `apps/web/app/o/[organizationId]/import/page.tsx`
- Create: `apps/web/app/o/[organizationId]/import/action.ts`
- Create: `apps/web/components/workflow-progress.tsx`
- Modify: `apps/web/app/o/[organizationId]/layout.tsx`
- Test: `tests/workbench/import-service.test.ts`
- Test: `tests/web/import-copy.test.ts`

**Interfaces:**
```ts
export async function importCustomerUsage(input: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  fileName: string;
  bytes: Uint8Array;
  isDemo: boolean;
  receivedAt: string;
}): Promise<ImportCustomerUsageResult>;
```

- [ ] RED tests: authorization, parser rejection, partial import, exact duplicate skip, immutable checksum/import lineage, accepted usage persistence.
- [ ] Implement transactional import service using existing CSV parser/fingerprints and import/usage tables.
- [ ] Build upload page with drag/select input, file constraints, accepted/skipped/rejected/warning summary, coverage, spend, and next-step CTA.
- [ ] Show downloadable CSV contract/template link and permanent demo warning for demo imports.
- [ ] Add Import navigation/progress step.

### Task 3: Workload constraints + benchmark input

**Files:**
- Create: `src/workbench/workload-service.ts`
- Create: `src/workbench/benchmark-service.ts`
- Create: `src/benchmarks/csv.ts`
- Create: `apps/web/app/o/[organizationId]/workloads/page.tsx`
- Create: `apps/web/app/o/[organizationId]/workloads/action.ts`
- Create: `apps/web/app/o/[organizationId]/benchmark/page.tsx`
- Create: `apps/web/app/o/[organizationId]/benchmark/action.ts`
- Test: `tests/workbench/workload-service.db.test.ts`
- Test: `tests/workbench/benchmark-service.db.test.ts`
- Test: `tests/benchmarks/csv.test.ts`

**Interfaces:**
```ts
type WorkloadConstraintInput = {
  name: string;
  environment: string;
  requiredQuality: string;
  maxP95LatencyMs: string | null;
  maxFailureRate: string | null;
};

export async function evaluateAndPersistBenchmark(...): Promise<{
  recommendationId: string;
  decision: BenchmarkDecision;
  savingState: 'OPPORTUNITY' | 'TESTED';
}>;
```

- [ ] RED workload tests: required quality mandatory, exact decimal validation, tenant isolation.
- [ ] Persist workload/constraint set using existing `workloads.constraint_set`.
- [ ] Add benchmark CSV contract: case_id, repetition_id, configuration_id, outcome, quality_score, latency_ms, cost, evaluator_version.
- [ ] Evaluate with existing `evaluateBenchmark`; failed candidate remains OPPORTUNITY/DO_NOT_CHANGE, passed candidate advances to TESTED.
- [ ] Persist recommendation evidence including measured fact/inference/hypothesis, rank metadata, Lab payload, formula/evaluator versions.
- [ ] Render workflow UI with explicit constraint status and route to existing Optimization Lab.

### Task 4: Implementation confirmation + post-change verification

**Files:**
- Create: `src/workbench/implementation-service.ts`
- Create: `src/workbench/verification-service.ts`
- Create: `apps/web/app/o/[organizationId]/implement/[recommendationId]/page.tsx`
- Create: `apps/web/app/o/[organizationId]/implement/[recommendationId]/action.ts`
- Create: `apps/web/app/o/[organizationId]/verify/[recommendationId]/page.tsx`
- Create: `apps/web/app/o/[organizationId]/verify/[recommendationId]/action.ts`
- Test: `tests/workbench/customer-verification.db.test.ts`

- [ ] RED tests: cannot verify before implementation, stabilization overlap blocks verification, <7 complete days blocks verification, denominator/workload/currency mismatches block verification, failed post-change constraints stay TESTED, negative verified impact is retained.
- [ ] Persist customer-confirmed implementation through existing implementation/evidence boundary.
- [ ] Accept post-change CSV through the same import service.
- [ ] Build baseline/post verification input from persisted records + explicit customer attestations; never guess comparability.
- [ ] Run existing verification engine and persist verification window.
- [ ] Append VERIFIED ledger event only on VERIFIED result.
- [ ] Render exact verified net impact, direction, formula version, evidence windows, and block reasons.

### Task 5: Complete customer journey + end-of-build hard test

**Files:**
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Modify: `apps/web/e2e/founder-flow.e2e.ts`
- Create: `apps/web/e2e/customer-loop.e2e.ts`
- Modify: `README.md`

- [ ] Add five-step journey status to dashboard: Import → Constraints → Benchmark → Implement → Verify.
- [ ] Strongest tested recommendation links to implementation when eligible.
- [ ] E2E uses `customer-loop-tough.csv` for baseline upload and asserts partial-import summary.
- [ ] E2E creates workload constraints, uploads benchmark evidence, confirms TESTED state, marks implemented, uploads post-change CSV, supplies comparability attestations, and asserts VERIFIED net impact.
- [ ] Run axe on each customer-step page.
- [ ] Run a second negative journey where a failed quality constraint produces DO_NOT_CHANGE and never VERIFIED.
- [ ] Run full gate: `npm run check`, `npm run web:build`, `npm run test:db`, Chromium E2E, audit, Gitleaks.
- [ ] Pre-merge review tenant/auth/financial-state boundaries.
- [ ] Merge only exact green head to `main`.

## Research-data policy

Public data is used only as a realism/reference layer:
- `mario0369/llm-cost-same-prompt` — CC BY 4.0 measured per-call cost/latency dataset.
- `zachz/llm-cost-benchmark` — MIT cost/latency reference dataset.
- Official provider price documentation is authoritative when pricing is used.
- Public benchmark rows never become fake customer usage records.
- Every copied/derived field in `fixtures/research` records source, license, retrieval date, and transformation notes.

## Acceptance Boundary

The milestone is done when a first-time customer can upload usage, define the workload safety requirement, submit paired benchmark evidence, receive a defensible decision, confirm their own rollout, upload post-change evidence, and see VERIFIED net savings only if every comparability/performance requirement passes. The complete flow must pass with the hard synthetic fixture and must keep research/reference evidence visibly separate from customer evidence.
