# Evalomics MRI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the value-before-validation slice and deliver the Stage 1 AI Efficiency MRI foundation: up to three ranked actionable findings, separate detection and savings confidence, reproducible modeled savings ranges, a non-overlapping modeled total, and a simplified founder overview that gives value before optional proof.

**Architecture:** Keep the existing organization-scoped persistence and exact rational economics. Extend the workbench view contract from a single `strongestAction` to an immutable MRI summary with up to three recommendations. Scenario math lives in a pure economics module and ranking stays deterministic. Persisted recommendation evidence remains the source of truth for state; presentation code may label and format evidence but may never promote `OPPORTUNITY` to `TESTED` or `VERIFIED`. The first implementation should reuse the current usage diagnosis/hypothesis pipeline rather than introduce the full Stage 3 detector suite.

**Tech Stack:** TypeScript 6, Node 24, exact bigint rational economics, PostgreSQL/Drizzle, Next.js 16.3.4, React 19.3.0, Vitest 5, Playwright 1.63, Tailwind CSS 4, existing GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-09-17-evalomics-10x-product-design.md`, especially sections 2, 4-10, 17-18, 20-23.

## Global Constraints

- Value first, proof second. Initial useful findings must not require benchmark setup or a validation wizard.
- `Observed`, `Modeled`, `Tested`, and `Verified` are distinct evidence states. A modeled scenario is never described as achieved or verified savings.
- Preserve persisted `OPPORTUNITY` / `TESTED` / `VERIFIED` state and existing ledger semantics; no UI-side state promotion.
- Use exact rational arithmetic for financial calculations. Round only for display.
- Modeled ranges must come from explicit low/base/high assumptions, never arbitrary percentage padding around one number.
- Account-level modeled totals must not double-count findings that share the same economic basis.
- Ranking uses the conservative/low modeled case when a scenario exists.
- Do not expose the internal composite ranking score in customer UI.
- Do not add OpenAI/Anthropic live connection work in this plan; provider-native onboarding is Stage 2 and gets its own implementation plan.
- Do not implement the full seven-detector suite in this plan; Stage 1 uses existing persisted hypotheses/recommendations and builds the MRI contract around them.
- No automatic merge, deployment, production configuration change, or secret access.
- Demo content must retain `Synthetic demo data — not a customer result.`
- Preserve organization membership checks and current tenant isolation.
- Avoid unnecessary commits/builds because the project is on Vercel Hobby; run focused tests before the full gate and batch related source edits when practical.

---

### Task 0: Close the existing value-before-validation gate before widening the UI

**Files:**
- Existing: `apps/web/components/recommendation-card.tsx`
- Existing: `apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx`
- Existing: `apps/web/e2e/customer-loop.e2e.ts`
- Existing: `apps/web/e2e/founder-flow.e2e.ts`
- Existing: `.github/workflows/ci.yml`

**Interfaces / required behavior:**
- An `OPPORTUNITY` result already contains a useful `nextAction`.
- Exact savings measurement remains optional.
- Existing proof flow still supports `TESTED` and `VERIFIED` states.

- [ ] **Step 1: Verify PR #37 exact head and CI state.** Do not merge or begin production deployment if the exact head is not green.
- [ ] **Step 2: Run or inspect the focused Stage 0 assertions:** initial result shows `Recommended action`, `Not measured yet`, and `Measure exact savings (optional)`; proof flow still reaches TESTED/VERIFIED when evidence is supplied.
- [ ] **Step 3: If Stage 0 is red, fix only the failing behavior using TDD before continuing.** Do not mix an unrelated MRI refactor into a Stage 0 repair.
- [ ] **Step 4: Record Stage 0 as the baseline behavior in E2E tests so the MRI refactor cannot reintroduce proof-first friction.
- [ ] **Step 5: Commit only if a Stage 0 code/test fix was required, using `fix: preserve value before optional proof`.

### Task 1: Define the MRI and scenario view contracts

**Files:**
- Modify: `src/workbench/dashboard-view.ts`
- Modify: `tests/workbench/dashboard-view.test.ts`
- Modify: `src/workbench/index.ts` only if a new exported helper/module is introduced.

**Interfaces:**

```ts
export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';
export type SavingsConfidence = 'UNMEASURED' | 'MODELED' | 'TESTED' | 'VERIFIED';

export type ModeledSavingsRange = Readonly<{
  currency: string;
  horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  low: string;
  base: string;
  high: string;
  evidenceRef: string;
  formulaVersion: string;
  pricingRef: string | null;
  overlapGroup: string | null;
}>;

export type DashboardRecommendationEvidence = Readonly<{
  recommendationId: string;
  priorityRank: number;
  title: string;
  state: DashboardSavingsState;
  decision: DashboardDecision;
  saving: DashboardSavingEvidence | null;
  modeledRange: ModeledSavingsRange | null;
  detectionConfidence: ConfidenceBand;
  savingsConfidence: SavingsConfidence;
  principalLimitation: string | null;
  nextAction: string;
}>;

export type DashboardEvidence = Readonly<{
  organizationName: string;
  periodLabel: string;
  dataQuality: DashboardDataQuality;
  observedSpend: DisplayMoneyEvidence | null;
  completeCalendarDays: number;
  recommendations: readonly DashboardRecommendationEvidence[];
  nonOverlappingModeledTotal: ModeledSavingsRange | null;
  verifiedNetSavings: VerifiedNetSavingsEvidence | null;
  diagnosticFacts: readonly DashboardDiagnosticFact[];
  isDemo: boolean;
  limitations: readonly string[];
}>;
```

`FounderDashboardView` should expose immutable `recommendations`, `bestFirstMove`, and `nonOverlappingModeledTotal`; `bestFirstMove` is `recommendations[0] ?? null` and exists only as a convenience view, not a second source of ranking truth.

- [ ] **Step 1: Write failing view-model tests.** Cover: zero findings, one finding, three findings, more than three input findings truncated deterministically, immutable nested ranges, separate detection/savings confidence, and preservation of negative verified impact.
- [ ] **Step 2: Run `npx vitest run tests/workbench/dashboard-view.test.ts` and verify RED for the new contract.
- [ ] **Step 3: Replace the single-action contract with the MRI contract.** Keep state-label derivation pure; do not translate `MODELED` into `TESTED`.
- [ ] **Step 4: Make `buildFounderDashboardView` freeze nested recommendations, scenario ranges, diagnostic evidence, totals, and limitations.
- [ ] **Step 5: Run the focused test and `npm run typecheck`; verify GREEN.
- [ ] **Step 6: Commit as `refactor: add MRI dashboard view contract`.

### Task 2: Add a pure scenario engine for Stage 1 opportunity types

**Files:**
- Create: `src/economics/scenarios.ts`
- Modify: `src/economics/index.ts`
- Create: `tests/economics/scenarios.test.ts`

**Interfaces:**

```ts
export type ScenarioBand = Readonly<{
  low: string;
  base: string;
  high: string;
}>;

export type ScenarioEvidence = Readonly<{
  kind: 'PROMPT_CACHING' | 'MODEL_PORTFOLIO_REVIEW' | 'OUTPUT_BUDGET' | 'RETRY_POLICY';
  currency: string;
  horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION';
  range: ScenarioBand;
  formulaVersion: 'scenario-v1';
  formula: string;
  assumptions: Readonly<Record<string, string>>;
  evidenceRef: string;
  pricingRef: string | null;
  overlapGroup: string | null;
}>;

export function modelOpportunityScenario(input: OpportunityScenarioInput): ScenarioEvidence | null;
```

Use exact rational operations from `src/economics/exact.ts`. V1 formulas must follow the approved spec:
- caching: eligible repeated tokens × additional cache reuse × cached-token price delta;
- model routing: eligible volume × (current unit cost − candidate unit cost);
- retry: avoidable retry volume × average retry cost;
- output: avoidable output tokens × output-token price.

The Stage 1 implementation may return `null` when the persisted evidence lacks the inputs required for one of these formulas. It must not invent provider pricing or infer cache eligibility from unsupported aggregate data.

- [ ] **Step 1: Write failing tests for each formula.** Each test supplies explicit low/base/high assumptions and asserts exact outputs plus formula/version/evidence provenance.
- [ ] **Step 2: Add withholding tests.** Missing eligible tokens, candidate unit cost, retry evidence, output price, or currency consistency returns `null`/an explicit unavailable result rather than zero.
- [ ] **Step 3: Add monotonicity tests.** Low ≤ base ≤ high is enforced; invalid negative assumptions or inverted ranges throw a stable domain error.
- [ ] **Step 4: Run `npx vitest run tests/economics/scenarios.test.ts` and verify RED.
- [ ] **Step 5: Implement the minimum pure scenario engine using exact arithmetic and immutable outputs.
- [ ] **Step 6: Export it from `src/economics/index.ts` and run focused tests + typecheck.
- [ ] **Step 7: Commit as `feat: add reproducible modeled scenario engine`.

### Task 3: Add overlap-aware modeled total calculation

**Files:**
- Create: `src/economics/scenario-overlap.ts`
- Modify: `src/economics/index.ts`
- Create: `tests/economics/scenario-overlap.test.ts`

**Interfaces:**

```ts
export type ScenarioWithOverlap = Readonly<{
  recommendationId: string;
  range: ScenarioBand;
  overlapGroup: string | null;
}>;

export function nonOverlappingScenarioTotal(
  scenarios: readonly ScenarioWithOverlap[],
): ScenarioBand | null;
```

Rules:
- Different `overlapGroup` values are additive.
- `null` overlap groups are independent.
- Within the same non-null overlap group, count only the single highest conservative (`low`) opportunity, with deterministic tie-breaking by recommendation ID; do not sum potentially overlapping savings.
- All ranges in one total must use the same currency/horizon before the caller invokes this function.

- [ ] **Step 1: Write failing tests for independent, overlapping, tied, empty, and order-independent inputs.
- [ ] **Step 2: Verify RED.
- [ ] **Step 3: Implement deterministic overlap grouping and exact addition.
- [ ] **Step 4: Run tests and typecheck; verify GREEN.
- [ ] **Step 5: Commit as `feat: prevent modeled savings double counting`.

### Task 4: Persist enough evidence for split confidence and scenarios without a schema migration

**Files:**
- Modify: `src/workbench/analysis-service.ts`
- Modify: existing analysis-service persistence tests if present; otherwise create `tests/workbench/analysis-service.test.ts` using the established database-test pattern.
- Modify: `src/efficiency/hypotheses.ts` only if explicit scenario-input metadata is required at hypothesis creation time.

**Interfaces / evidence keys:**
Persist new optional keys inside the existing JSON `recommendations.evidence` object; do not add database columns in Stage 1 unless tests prove JSON storage is insufficient.

Recommended keys:
```ts
{
  priorityRank: number,
  opportunityKind: string,
  detectionConfidence: 'LOW' | 'MEDIUM' | 'HIGH',
  savingsConfidence: 'UNMEASURED' | 'MODELED',
  scenario?: {
    low: string,
    base: string,
    high: string,
    currency: string,
    horizon: 'OBSERVED_PERIOD' | 'THIRTY_DAY_PROJECTION',
    formulaVersion: 'scenario-v1',
    formula: string,
    assumptions: Record<string, string>,
    evidenceRef: string,
    pricingRef: string | null,
    overlapGroup: string | null
  }
}
```

For existing TESTED/VERIFIED recommendation rows, the loader derives `savingsConfidence` from the persisted state even if old JSON lacks the new key.

- [ ] **Step 1: Write a failing persistence test that analyzes a fixture capable of producing multiple hypotheses and asserts stable ranks 1..N, `detectionConfidence`, and no fabricated scenario when inputs are incomplete.
- [ ] **Step 2: Add a fixture/path with enough explicit scenario inputs for at least one safe modeled scenario and assert the persisted formula/version/assumptions.
- [ ] **Step 3: Verify RED.
- [ ] **Step 4: Implement confidence derivation rules from evidence completeness, not marketing preference. Keep existing `confidenceBand` populated for backwards compatibility until all consumers migrate.
- [ ] **Step 5: Call the pure scenario engine only when required inputs are present. Persist `MODELED` only when a scenario actually exists; otherwise persist `UNMEASURED`.
- [ ] **Step 6: Run focused service tests and DB tests; verify GREEN.
- [ ] **Step 7: Commit as `feat: persist MRI evidence and modeled scenarios`.

### Task 5: Load and rank the top three recommendations for the founder dashboard

**Files:**
- Modify: `apps/web/lib/dashboard-data.ts`
- Modify: `src/ranking/ranking.ts` only if a small deterministic conservative-scenario adapter is needed.
- Modify: `tests/ranking/ranking.test.ts` if ranking behavior changes.
- Add/modify web/dashboard loader tests using the repository's existing DB test conventions.

**Interfaces / behavior:**
- Load current usable import and recommendation rows scoped to the organization.
- Ignore stale recommendation rows tied to older imports when `sourceImportId` is available; if provenance is unavailable, retain existing rows only when their evidence can be safely attributed, otherwise add a limitation.
- Build candidate recommendation views with `priorityRank`, split confidence, scenario range and state.
- Sort deterministically. For modeled opportunities, use `low` modeled impact for economic ranking. Existing TESTED/VERIFIED evidence must retain stronger state semantics.
- Return at most three surfaced recommendations.
- Compute the non-overlapping total from surfaced modeled scenarios with matching currency/horizon.
- Verification lookup must no longer assume only rank-one can have verified evidence; the headline verified-net-savings value remains grounded in real verification evidence, never in the modeled total.

- [ ] **Step 1: Write failing loader/ranking tests for four persisted recommendations, stable top-three selection, missing-rank metadata, mixed states, and stale import provenance.
- [ ] **Step 2: Add tests showing two overlapping modeled recommendations do not sum at account level.
- [ ] **Step 3: Add tests showing fewer than seven complete days suppress a thirty-day projection while preserving the actionable finding.
- [ ] **Step 4: Verify RED.
- [ ] **Step 5: Replace `rankOne`/`strongestAction` loading with top-three MRI loading and overlap-aware total construction.
- [ ] **Step 6: Keep exact evidence references and limitations in every mapped recommendation.
- [ ] **Step 7: Run focused tests, `npm run typecheck`, and `npm run web:build`; verify GREEN.
- [ ] **Step 8: Commit as `feat: load top three MRI recommendations`.

### Task 6: Build the AI Efficiency MRI UI and revise the recommendation card

**Files:**
- Create: `apps/web/components/efficiency-mri.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Modify: `apps/web/components/evidence-state-pill.tsx` only if `Modeled` needs a distinct non-green visual token.
- Create or modify component/copy tests under `tests/web/` if present.

**Required UI hierarchy:**
1. `AI Efficiency MRI`
2. Spend analyzed
3. Non-overlapping modeled opportunity range, labeled **Modeled**, or `Not enough evidence to model yet`
4. Verified net savings, labeled **Verified**
5. Up to three ranked cards
6. Rank #1 visibly marked **Best first move**
7. Each card answers: what was found, why it matters, modeled/tested/verified impact, detection confidence, savings confidence, exact next action
8. Technical assumptions and limitations behind `See calculation` / details

**CTA policy:**
- OPPORTUNITY with low-risk actionable next step: `Generate fix` only when a Fix Engine action is actually implemented in a later stage; until Stage 4, use truthful CTAs such as `See recommended change` or `Measure exact savings (optional)`.
- Model-routing/risky candidate: `Test candidate` / optional proof route.
- TESTED + OPTIMIZE: `Prepare safe rollout`.
- VERIFIED: `View verified savings`.
- Never render a disabled/fake `Generate fix` button before the Fix Engine exists.

- [ ] **Step 1: Write failing copy/component assertions for `Best first move`, `Detection confidence`, `Savings confidence`, `Modeled`, and the absence of generic `Evidence confidence`.
- [ ] **Step 2: Add assertions that an unmeasured opportunity says `Not measured yet` and still shows its recommended action.
- [ ] **Step 3: Verify RED.
- [ ] **Step 4: Implement `EfficiencyMri` as a simple server-renderable component receiving the pure dashboard view; no client-side recomputation of financial evidence.
- [ ] **Step 5: Refactor `RecommendationCard` to support rank, best-first-move treatment, split confidence, scenario ranges, and state-correct CTA/copy.
- [ ] **Step 6: Keep assumptions/calculation/provenance progressively disclosed rather than adding dashboard clutter.
- [ ] **Step 7: Run component/copy tests, typecheck, and web build; verify GREEN.
- [ ] **Step 8: Commit as `feat: add AI Efficiency MRI result surface`.

### Task 7: Replace the single-answer overview with the MRI and simplify navigation

**Files:**
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/workbench/workbench-shell.tsx`
- Create: `apps/web/app/o/[organizationId]/findings/page.tsx` only if a dedicated findings route is needed for `See all findings`; otherwise defer the full route and keep the Stage 1 top-three overview.
- Modify: `apps/web/e2e/founder-flow.e2e.ts`

**Navigation target:**
- Primary: Overview, Findings, Changes, Savings
- Advanced: Connections, Benchmarks, Telemetry, Security, Settings

Do not create empty decorative pages. Where Stage 1 does not yet have a real feature route, either map the label to an existing meaningful route or leave the future item out until its plan is implemented. The user should never click into a blank placeholder.

- [ ] **Step 1: Update E2E first.** The founder overview must show `AI Efficiency MRI`, up to three ranked findings, one `Best first move`, modeled-vs-verified labels, recommended action, and `See details` for technical evidence.
- [ ] **Step 2: Add E2E assertions that raw evidence IDs, benchmark internals, and Counterfactual Replay are not visible on the default overview.
- [ ] **Step 3: Add empty/no-data assertions: one clear upload CTA and no fake zero savings.
- [ ] **Step 4: Verify RED against the current single-card page.
- [ ] **Step 5: Render `EfficiencyMri` from `FounderDashboardView`; derive proof timeline from the strongest actual evidence state among recommendations, not from a presentation label.
- [ ] **Step 6: Keep `WorkMri`, ProofTimeline, evidence limitations, raw methodology, and technical evidence inside `See details`.
- [ ] **Step 7: Adjust navigation only for routes that are meaningful now; preserve existing URLs used by proof/benchmark flows.
- [ ] **Step 8: Run founder-flow E2E and accessibility checks; verify GREEN.
- [ ] **Step 9: Commit as `feat: make MRI the founder overview`.

### Task 8: Expand E2E fixture data to prove the top-three and no-double-counting experience

**Files:**
- Modify: `apps/web/e2e/seed.ts`
- Modify: `apps/web/e2e/founder-flow.e2e.ts`
- Modify: `apps/web/e2e/customer-loop.e2e.ts`
- Modify or add deterministic CSV fixtures only if needed.

- [ ] **Step 1: Seed a demo organization with at least three recommendation rows representing distinct states/evidence and at least two modeled scenarios that share an overlap group.
- [ ] **Step 2: Keep the existing tested `rec-1` lab/report fixture functional so Stage 1 does not break the proof loop.
- [ ] **Step 3: Assert the overview surfaces exactly the expected top three in deterministic order and marks only rank #1 as `Best first move`.
- [ ] **Step 4: Assert the displayed account modeled total follows the no-double-counting rule.
- [ ] **Step 5: Assert OPPORTUNITY recommendations never render `Tested saving` or `Verified saving`.
- [ ] **Step 6: Assert the current customer-loop import still lands on a useful result before any safety/benchmark setup.
- [ ] **Step 7: Run `npm run web:e2e` against the seeded DB and verify accessibility remains free of serious/critical Axe violations.
- [ ] **Step 8: Commit as `test: cover MRI founder journey`.

### Task 9: Full verification and PR release gate

**Files:**
- Modify documentation only if actual user-visible workflow changed beyond the approved spec.
- No production merge/deploy changes in this task without explicit user approval.

- [ ] **Step 1: Run `npm run format:check`.
- [ ] **Step 2: Run `npm run lint`.
- [ ] **Step 3: Run `npm run typecheck`.
- [ ] **Step 4: Run `npm test`.
- [ ] **Step 5: Run `npm run build`.
- [ ] **Step 6: Run `npm run web:build`.
- [ ] **Step 7: Run `npm run test:db` with the test PostgreSQL URL.
- [ ] **Step 8: Run the backup/restore drill used by CI.
- [ ] **Step 9: Run `npm run web:e2e`.
- [ ] **Step 10: Run `npm audit --audit-level=high`, Docker build, and Gitleaks or rely on the exact GitHub CI job for those infrastructure gates if local tooling is unavailable.
- [ ] **Step 11: Inspect the exact PR-head GitHub Actions run; every CI step must be green.
- [ ] **Step 12: Smoke the exact Vercel preview for the PR head: overview, no-data state, one opportunity, three-opportunity MRI, details disclosure, tested route, verified route, responsive layout, and sign-in behavior appropriate for preview.
- [ ] **Step 13: Compare implementation against the approved spec: no fake modeled numbers, no overlap double counting, no proof-first blocking, no empty future navigation, no state promotion.
- [ ] **Step 14: Do not merge PR #37 automatically. Report exact PASS/FAIL/BLOCKED evidence and request merge authorization when all gates pass.

## Acceptance Boundary

Stage 0 + Stage 1 are complete when a founder can provide current usage evidence and immediately receive an **AI Efficiency MRI** with up to three deterministic, commercially meaningful findings; the first is clearly identified as the best first move; each finding separates detection confidence from savings confidence; supported opportunities can show reproducible modeled low/base/high impact without claiming achieved savings; overlapping opportunities are not double counted in the account total; and optional proof can still advance recommendations through TESTED and VERIFIED without being required to unlock the initial result.

This plan does **not** deliver provider-native OpenAI/Anthropic onboarding, the complete seven-detector suite, automated code patches/GitHub PR generation, automatic quality-baseline inference, continuous monitoring, weekly briefs, or the optional SDK/proxy. Those are separate Stage 2-7 plans after this foundation is verified.
