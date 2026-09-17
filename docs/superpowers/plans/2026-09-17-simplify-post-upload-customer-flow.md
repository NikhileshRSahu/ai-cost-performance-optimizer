# Simplify Post-Upload Customer Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Evalomics behave as “upload usage → get one trustworthy answer → optionally validate/details,” while preserving the existing Potential/Tested/Verified evidence contract and advanced benchmark tooling.

**Architecture:** Keep the current import, diagnosis, hypothesis, benchmark, implementation, and verification backend unchanged. Change the customer-facing orchestration so successful usage analysis redirects to Overview, the default navigation exposes only customer-level surfaces, the strongest usage hypothesis is rendered directly even when savings are not yet quantified, and validation/benchmark tooling is reached contextually from the recommendation rather than through a mandatory wizard.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Drizzle persistence, Playwright E2E, existing Evalomics workbench services.

**Spec:** `docs/superpowers/specs/2026-09-17-direct-answer-workspace-design.md`

## Global Constraints

- Preserve Observed, Opportunity, Tested, Implemented, and Verified as distinct evidence states.
- Never invent a financial saving amount when the evidence does not support one.
- Never present Potential or Tested savings as Verified production savings.
- Keep synthetic/demo evidence visibly labeled.
- Infer provider, model, currency, workload, environment, usage window, spend, latency/failure metrics, and current configuration before asking the customer to re-enter them.
- Normal customer navigation must not imply Data → Safety → Test → Apply → Verify is mandatory.
- Raw evidence IDs and exact formula internals are hidden from the default customer view.
- Advanced benchmark, Safety, Counterfactual Replay, audit references, and verification tooling remain reachable through contextual actions/details.

---

### Task 1: Redirect Successful Usage Analysis to the Answer

**Files:**
- Modify: `apps/web/app/o/[organizationId]/import/action.ts`
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Consumes: `analyzeImportedUsage(...)` and the existing organization Overview route `/o/:organizationId`.
- Produces: successful non-blocked uploads land on `/o/:organizationId?source=import&importId=...`; blocked/failed imports remain on the Data page with actionable status.

- [ ] **Step 1: Write the failing E2E expectation**

Update the customer flow test so after selecting a valid CSV, checking the synthetic-data box when needed, and clicking `Analyze this usage`, it expects navigation to the organization Overview and the heading `We analyzed your AI usage` rather than requiring `Continue to safety setup`.

```ts
await page.getByRole('button', { name: 'Analyze this usage' }).click();
await expect(page).toHaveURL(/\/o\/[^/?]+\?source=import/);
await expect(
  page.getByRole('heading', { name: 'We analyzed your AI usage' }),
).toBeVisible();
await expect(
  page.getByRole('link', { name: 'Continue to safety setup' }),
).toHaveCount(0);
```

- [ ] **Step 2: Run the targeted E2E test and verify it fails**

Run:
```bash
npm run web:e2e -- --grep "customer loop"
```
Expected: FAIL because successful upload currently returns to `/import?importId=...`.

- [ ] **Step 3: Change successful redirect behavior**

In `uploadUsageCsv`, track whether analysis ran successfully and redirect a usable import to Overview:

```ts
redirect(
  `/o/${organizationId}?source=import&importId=${encodeURIComponent(importId)}`,
);
```

Keep blocked/failed imports on `/import` so row rejection/warning details remain recoverable.

- [ ] **Step 4: Run the targeted E2E test**

Run:
```bash
npm run web:e2e -- --grep "customer loop"
```
Expected: PASS for upload → Overview transition.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/o/[organizationId]/import/action.ts apps/web/e2e/customer-loop.e2e.ts
git commit -m "feat: route analyzed usage directly to overview"
```

---

### Task 2: Make the Overview Useful When Savings Are Not Yet Quantified

**Files:**
- Modify: `src/workbench/dashboard-view.ts`
- Modify: `apps/web/lib/dashboard-data.ts`
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Test: existing dashboard/view unit tests and `apps/web/e2e/founder-flow.e2e.ts`

**Interfaces:**
- Consumes: persisted rank-one usage hypotheses created by `analyzeImportedUsage`, including `title`, `measuredFact`, `inference`, `principalLimitation`, `nextAction`, `qualityGuard`, and `opportunityKind` from recommendation evidence.
- Produces: `DashboardRecommendationEvidence` gains human-readable measured/inference fields so the result card can explain *why* the recommendation exists without exposing raw evidence IDs.

- [ ] **Step 1: Extend the dashboard recommendation view contract in tests first**

Add expectations that an OPPORTUNITY with no `saving` still carries:

```ts
expect(view.strongestAction).toMatchObject({
  state: 'OPPORTUNITY',
  title: 'Test higher cache reuse on explicitly eligible input',
  measuredFact: expect.stringContaining('Cache hit ratio'),
  inference: expect.stringContaining('below'),
  confidenceBand: 'LOW',
});
```

- [ ] **Step 2: Run the relevant unit tests and verify failure**

Run:
```bash
npm test -- --runInBand dashboard-view dashboard-data
```
Expected: FAIL because `measuredFact` and `inference` are not currently part of the dashboard recommendation contract.

- [ ] **Step 3: Add supported explanatory fields**

Extend `DashboardRecommendationEvidence` with:

```ts
measuredFact: string | null;
inference: string | null;
qualityGuard: string | null;
opportunityKind: string | null;
```

In `recommendationView(...)`, populate them only from persisted evidence via `evidenceString(...)`.

- [ ] **Step 4: Replace dead-end savings copy in `RecommendationCard`**

For `recommendation.saving === null`, render:

```tsx
<p>Savings estimate</p>
<p>Needs validation</p>
<p>No financial saving is claimed until the candidate is benchmarked.</p>
```

Do not render `Saving amount unavailable` as the hero value.

Below the title, show the strongest measured fact and short inference when present:

```tsx
{recommendation.measuredFact ? (
  <p>{recommendation.measuredFact}</p>
) : null}
```

Keep limitation disclosure and confidence visible but secondary.

- [ ] **Step 5: Ensure Overview's primary CTA is contextual validation**

For `OPPORTUNITY`, label the CTA `Validate this opportunity` and point it to the recommendation lab/validation route. For `TESTED + OPTIMIZE`, keep `Prepare safe rollout`. For `VERIFIED`, keep `View verified savings`.

- [ ] **Step 6: Verify the exact synthetic-data state**

The result for the current 28-row demo should show, in the first result card:

- Spend analyzed: `USD 1774.78`
- Strongest finding: `Test higher cache reuse on explicitly eligible input`
- Savings estimate: `Needs validation`
- Confidence: `LOW`
- Measured evidence including the cache hit ratio
- One CTA: `Validate this opportunity`
- Secondary disclosure: `See details`

It must **not** show the raw `import:...#CACHE_HIT_RATIO` reference by default.

- [ ] **Step 7: Run unit + E2E tests**

Run:
```bash
npm test -- --runInBand dashboard-view dashboard-data
npm run web:e2e -- --grep "founder flow|customer loop"
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/workbench/dashboard-view.ts apps/web/lib/dashboard-data.ts apps/web/app/o/[organizationId]/page.tsx apps/web/components/recommendation-card.tsx apps/web/e2e/founder-flow.e2e.ts
git commit -m "feat: turn usage hypotheses into direct customer answers"
```

---

### Task 3: Remove Mandatory Workflow Navigation from the Normal Customer Path

**Files:**
- Modify: `apps/web/components/workbench/workbench-shell.tsx`
- Modify: any component currently rendering the large `Data → Safety → Test → Apply → Verify` progress bar on customer-facing pages
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Produces: default sidebar `Overview`, `Data`, `Savings`; advanced disclosure contains `Safety`, `Tests`, `Telemetry`, `Settings`.

- [ ] **Step 1: Add failing navigation assertions**

```ts
await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Data' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
await expect(page.getByRole('navigation').getByText('Safety')).not.toBeVisible();
await expect(page.getByRole('navigation').getByText('Tests')).not.toBeVisible();
```

Use the actual accessible advanced disclosure behavior selected in implementation rather than brittle CSS selectors.

- [ ] **Step 2: Run targeted E2E and verify failure**

Run:
```bash
npm run web:e2e -- --grep "customer loop"
```
Expected: FAIL because Safety/Tests are still shown as normal workflow items in the live flow.

- [ ] **Step 3: Reorganize navigation**

Set normal navigation to:

```ts
const primary = [
  { slug: '', label: 'Overview', icon: Activity },
  { slug: '/import', label: 'Data', icon: Database },
  { slug: '/proof', label: 'Savings', icon: ShieldCheck },
] as const;
```

Place Safety and Tests under Advanced alongside Telemetry and Settings:

```ts
const advanced = [
  { slug: '/workloads', label: 'Safety', icon: BrainCircuit },
  { slug: '/benchmark', label: 'Tests', icon: FlaskConical },
  { slug: '/telemetry', label: 'Telemetry', icon: BarChart3 },
  { slug: '/settings', label: 'Settings', icon: Settings },
] as const;
```

- [ ] **Step 4: Remove the large workflow progress bar from default Data/Test/Overview surfaces**

Keep the evidence lifecycle only inside `See details` or advanced validation screens. Do not show a mandatory five-step rail immediately after upload.

- [ ] **Step 5: Run E2E**

Run:
```bash
npm run web:e2e -- --grep "customer loop|founder flow"
```
Expected: PASS and no normal-path expectation depends on visiting Safety before seeing an answer.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/workbench/workbench-shell.tsx apps/web/e2e/customer-loop.e2e.ts
git commit -m "feat: hide validation internals from default navigation"
```

---

### Task 4: Replace the Generic Safety/Test Wizard with Contextual Validation Entry

**Files:**
- Modify: `apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx`
- Modify: benchmark/safety pages only as needed to preserve advanced fallback
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Consumes: `recommendationId` and persisted recommendation evidence.
- Produces: the recommendation CTA opens a focused validation page that explains what is known, what is missing, and asks for the smallest missing artifact.

- [ ] **Step 1: Write a failing E2E for an untested usage hypothesis**

After clicking `Validate this opportunity`, expect:

```ts
await expect(
  page.getByRole('heading', { name: /Validate this opportunity/i }),
).toBeVisible();
await expect(page.getByText(/what we already know/i)).toBeVisible();
await expect(page.getByText(/what is still needed/i)).toBeVisible();
```

Do not expect an error-like dead end as the primary experience.

- [ ] **Step 2: Run targeted E2E and verify failure**

Expected current behavior: `Insufficient benchmark evidence` with a return button.

- [ ] **Step 3: Replace the dead-end state with a guided missing-evidence state**

When complete paired benchmark evidence is absent, render:

- recommendation title
- current measured evidence
- confidence/claim boundary
- `What we still need to validate this safely`
- one primary action appropriate to the missing evidence
- advanced link to manual paired-case benchmark upload

The page must not imply the recommendation is invalid simply because validation has not yet occurred.

- [ ] **Step 4: Preserve existing tested/verified lab behavior**

If complete benchmark evidence exists, keep Counterfactual Replay and current validation/report behavior unchanged.

- [ ] **Step 5: Run E2E**

Run:
```bash
npm run web:e2e -- --grep "customer loop"
```
Expected: PASS across opportunity, tested, replay, rollout, and verification branches.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx apps/web/e2e/customer-loop.e2e.ts
git commit -m "feat: guide validation instead of showing benchmark dead ends"
```

---

### Task 5: Keep Import Details Available Without Making Them the Journey

**Files:**
- Modify: `apps/web/app/o/[organizationId]/import/page.tsx`
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Produces: Data page remains usable for upload history/import diagnostics, but successful upload no longer presents `Continue to safety setup` as the dominant action.

- [ ] **Step 1: Add failing assertions for post-upload Data state**

When opening Data for a completed import, expect `View import details` and `View analysis overview`; do not expect `Continue to safety setup` as a primary CTA.

- [ ] **Step 2: Remove the mandatory progression CTA**

Replace `Continue to safety setup` with a quiet contextual link such as `Advanced validation settings` if needed, and make `View analysis overview` the dominant next action for users who remain on Data.

- [ ] **Step 3: Verify import diagnostics remain accessible**

Accepted/duplicates/rejected/warnings and import details remain visible on demand.

- [ ] **Step 4: Run E2E**

Run:
```bash
npm run web:e2e -- --grep "customer loop"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/o/[organizationId]/import/page.tsx apps/web/e2e/customer-loop.e2e.ts
git commit -m "fix: make analysis overview the post-import destination"
```

---

### Task 6: Full Regression and Release Gate

**Files:**
- Modify only files required by failures revealed here.

**Interfaces:**
- Produces: one release candidate where the simplified customer path and advanced technical path both work.

- [ ] **Step 1: Run formatter/type/build checks**

```bash
npm run check
npm run web:build
```
Expected: PASS.

- [ ] **Step 2: Run unit/integration tests**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 3: Run full Playwright suite**

```bash
npm run web:e2e
```
Expected: PASS.

- [ ] **Step 4: Verify the exact customer flow manually on preview**

With the 28-row synthetic CSV:

1. Upload CSV.
2. Receive an unmistakable success state.
3. Land directly on Overview.
4. See `USD 1774.78` observed spend.
5. See `Test higher cache reuse on explicitly eligible input` as the strongest finding.
6. See `Savings estimate: Needs validation`, not a fabricated amount.
7. See LOW confidence and a human-readable measured cache fact.
8. See one primary CTA: `Validate this opportunity`.
9. Confirm raw `import:...#...` evidence IDs are hidden until details/audit disclosure.
10. Confirm Safety/Tests are not presented as mandatory normal navigation.
11. Open validation and confirm missing evidence is explained constructively instead of an `Insufficient benchmark evidence` dead end.
12. Confirm advanced paired benchmark, Counterfactual Replay, implementation, and verification routes still work.

- [ ] **Step 5: Run security/release checks**

```bash
npm audit --audit-level=high
```
Also run the repository's existing Docker, DB backup/restore, and gitleaks release gates used by CI.

- [ ] **Step 6: Final release commit if any regression-only fixes were required**

```bash
git add -A
git commit -m "fix: close simplified-flow release regressions"
```

- [ ] **Step 7: Deploy one preview only**

Do not create repeated Vercel previews. Deploy the final head once, browser-smoke it, then merge/promote only after the exact flow above passes.
