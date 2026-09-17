# Evalomics Direct-Answer Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the authenticated Evalomics workspace into a direct-answer SaaS flow where customers upload/connect data, immediately see the strongest supported result, and open technical evidence only on demand.

**Architecture:** Keep the existing evidence-state engine and routes intact, but simplify the default presentation layer. The Overview becomes the single customer-facing answer surface; Work MRI, workflow progression, limitations, raw provenance, and detailed methodology move behind explicit disclosure. Existing Safety/Test/Savings routes remain available as expert paths and are prefilled wherever possible.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS 4, Better Auth, Drizzle/Postgres, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-direct-answer-workspace-design.md`

## Global Constraints

- Preserve Observed, Opportunity, Tested, Implemented, and Verified evidence semantics exactly.
- Synthetic/demo evidence must remain visibly labeled and must never become Verified without comparable production evidence.
- Default customer flow is **connect/upload → direct answer → optional details**.
- Raw internal evidence IDs and provenance references are hidden by default.
- One dominant primary CTA per screen.
- Human-readable money/percentage values are primary; exact arithmetic lives in details.
- Missing values remain missing; never convert missing evidence to zero.
- Keep the authenticated workspace consistently dark; no accidental light containers.
- Do not add provider connectors in this pass.

---

### Task 1: Make Overview the direct-answer result surface

**Files:**
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/work-mri.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Test: `apps/web/e2e/founder-flow.e2e.ts`

**Interfaces:**
- Consumes: `buildFounderDashboardView(...)`, `buildWorkMriSnapshot(...)`, existing recommendation state and savings values.
- Produces: one primary result block containing spend analyzed, strongest supported saving, confidence, recommendation, and one next action; `details` disclosure for deeper evidence.

- [ ] **Step 1: Add a failing Overview E2E assertion**

Update `apps/web/e2e/founder-flow.e2e.ts` so a seeded Tested workspace asserts:

```ts
await expect(page.getByRole('heading', { name: /we analyzed your ai usage/i })).toBeVisible();
await expect(page.getByText(/best tested improvement/i)).toBeVisible();
await expect(page.getByRole('button', { name: /see details/i })).toBeVisible();
await expect(page.getByText(/what should we test next/i)).toHaveCount(0);
await expect(page.getByText(/evidence: import:/i)).toHaveCount(0);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm --workspace @optimizer/web run e2e -- founder-flow.e2e.ts
```

Expected: FAIL because the current Overview still renders the workflow-oriented heading and exposed technical evidence.

- [ ] **Step 3: Replace the top-level Overview hierarchy**

In `apps/web/app/o/[organizationId]/page.tsx`:

- remove the large `WorkflowProgress` from the default Overview body;
- change the main headline to `We analyzed your AI usage` when data exists;
- render one primary result card above the fold;
- for Tested state, label the result `Best tested improvement` and keep the saving explicitly Tested;
- for Opportunity state, label it `Best opportunity found`;
- for Verified state, label it `Verified improvement`;
- render exactly one primary CTA based on state: `Test this optimization`, `Prepare safe rollout`, or `View verified savings`;
- render one secondary `See details` disclosure;
- move supporting metrics, progression, Work MRI, limitations, evidence-window metadata, and methodology inside that disclosure.

- [ ] **Step 4: Remove duplicate recommendation presentation**

In `apps/web/components/work-mri.tsx`, stop rendering `snapshot.strongestAction` as a second recommendation. Keep only supporting facts and evidence limitations inside MRI details.

In `apps/web/components/recommendation-card.tsx`, ensure customer-facing copy does not duplicate a second heading that implies a new recommendation after a Tested result.

- [ ] **Step 5: Hide provenance IDs from default MRI rows**

Replace always-visible `Evidence: {fact.evidenceRef}` with a compact `Calculation details` disclosure. Put `fact.evidenceRef` inside the disclosure only.

- [ ] **Step 6: Re-run focused E2E and build**

Run:

```bash
npm --workspace @optimizer/web run e2e -- founder-flow.e2e.ts
npm --workspace @optimizer/web run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/o/[organizationId]/page.tsx apps/web/components/work-mri.tsx apps/web/components/recommendation-card.tsx apps/web/e2e/founder-flow.e2e.ts
git commit -m "ux: make overview a direct-answer result"
```

---

### Task 2: Make upload completion lead directly to the answer

**Files:**
- Modify: `apps/web/app/o/[organizationId]/import/page.tsx`
- Modify: `apps/web/app/o/[organizationId]/import/action.ts` only if redirect behavior requires it
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Consumes: existing import result query parameters and persisted usage evidence.
- Produces: unmistakable upload completion state with one dominant `View my analysis` action and optional `See import details`.

- [ ] **Step 1: Add failing import-success E2E assertions**

Add assertions after a successful CSV import:

```ts
await expect(page.getByText(/usage data is ready/i)).toBeVisible();
await expect(page.getByRole('link', { name: /view my analysis/i })).toBeVisible();
await expect(page.getByText(/checksum/i)).toHaveCount(0);
```

The checksum assertion applies before opening `See import details`.

- [ ] **Step 2: Run the customer-loop test and confirm failure**

```bash
npm --workspace @optimizer/web run e2e -- customer-loop.e2e.ts
```

Expected: FAIL on the new direct-answer upload copy/CTA.

- [ ] **Step 3: Simplify successful import state**

In `import/page.tsx`:

- use the completion heading `Your AI usage data is ready`;
- summarize accepted rows and evidence window only when trustworthy;
- make `View my analysis` the single dominant CTA to `/o/${organizationId}`;
- move checksum, source, parser diagnostics, and provenance under `See import details`;
- keep `Continue to safety setup` only as a quiet advanced link, not the primary path.

- [ ] **Step 4: Keep failures actionable and inline**

Known validation failures must remain inline with one corrective instruction. Do not redirect to a generic recovery page and do not surface raw exceptions.

- [ ] **Step 5: Re-run customer-loop test and build**

```bash
npm --workspace @optimizer/web run e2e -- customer-loop.e2e.ts
npm --workspace @optimizer/web run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/o/[organizationId]/import/page.tsx apps/web/app/o/[organizationId]/import/action.ts apps/web/e2e/customer-loop.e2e.ts
git commit -m "ux: route successful imports to direct analysis"
```

---

### Task 3: Demote workflow mechanics to optional expert controls

**Files:**
- Modify: `apps/web/components/workbench/workbench-shell.tsx`
- Modify: `apps/web/app/o/[organizationId]/workloads/page.tsx`
- Modify: `apps/web/app/o/[organizationId]/benchmark/page.tsx`
- Modify: `apps/web/components/workflow-progress.tsx`
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Consumes: existing routes and inferred workload/test data.
- Produces: navigation and expert pages that remain available without implying every customer must manually complete every stage.

- [ ] **Step 1: Add failing navigation assertions**

Assert the default sidebar emphasizes:

```ts
await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Data' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Tests' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
```

And ensure Safety is visually grouped as advanced rather than part of a mandatory sequential progress bar on Overview.

- [ ] **Step 2: Run focused test and confirm failure where applicable**

```bash
npm --workspace @optimizer/web run e2e -- customer-loop.e2e.ts
```

- [ ] **Step 3: Simplify navigation hierarchy**

Keep `Overview`, `Data`, `Tests`, and `Savings` as primary customer items. Keep `Safety`, `Telemetry`, and `Settings` available under an advanced/configuration grouping.

- [ ] **Step 4: Keep Safety simple by default**

In `workloads/page.tsx`, preserve inferred workload and default quality floor. Keep p95/failure-rate controls inside `Advanced safety controls`. Copy must explain that most users can keep defaults.

- [ ] **Step 5: Make Tests recommendation-led**

In `benchmark/page.tsx`:

- show `Open latest result` first when a previous test exists;
- do not force users to re-upload to revisit a result;
- keep configuration IDs, evaluator version, and currency under `Advanced benchmark settings`;
- manual paired CSV remains available as an expert path.

- [ ] **Step 6: Re-run E2E and build**

```bash
npm --workspace @optimizer/web run e2e -- customer-loop.e2e.ts
npm --workspace @optimizer/web run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/workbench/workbench-shell.tsx apps/web/app/o/[organizationId]/workloads/page.tsx apps/web/app/o/[organizationId]/benchmark/page.tsx apps/web/components/workflow-progress.tsx apps/web/e2e/customer-loop.e2e.ts
git commit -m "ux: demote workflow mechanics to advanced controls"
```

---

### Task 4: Finish visual consistency and production verification

**Files:**
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/e2e/founder-flow.e2e.ts`
- Test: `apps/web/e2e/customer-loop.e2e.ts`

**Interfaces:**
- Consumes: all new direct-answer surfaces from Tasks 1–3.
- Produces: consistent dark workspace with no light-surface leaks and production-ready responsive behavior.

- [ ] **Step 1: Add visual-state assertions that catch accidental light panels**

Add stable selectors/data attributes to the direct-answer result and details container, then assert they exist and are visible at desktop and mobile viewport sizes. Do not use pixel-color assertions; rely on component classes/roles and browser screenshots during review.

- [ ] **Step 2: Consolidate dark workbench surface rules**

In `globals.css`, make the direct-answer card, details disclosure, MRI details, replay/result cards, upload success, and advanced controls all use the same dark surface variables. Remove or override legacy generic rules that create white backgrounds inside `.org-workbench`.

- [ ] **Step 3: Verify responsive hierarchy**

At mobile width, the result card must stack in this order:

1. result label/state
2. saving/value
3. confidence
4. recommendation
5. primary CTA
6. See details

- [ ] **Step 4: Run full web verification**

```bash
npm --workspace @optimizer/web run build
npm --workspace @optimizer/web run e2e
```

Expected: all build and E2E checks PASS.

- [ ] **Step 5: Verify Vercel preview**

Confirm the latest `ux/overview-clarity-pass` preview deployment is READY, inspect build logs for zero compile errors, and review runtime errors for the preview after exercising Overview, Data, Tests, and Savings.

- [ ] **Step 6: Merge only after preview verification**

Open/update the PR for `ux/overview-clarity-pass`, verify it is mergeable and preview is green, then merge to `main`.

- [ ] **Step 7: Verify production**

Confirm the production deployment for the merge commit is READY. Check `/api/health`, production runtime errors, and the authenticated customer flow with the existing smoke-test workspace.

- [ ] **Step 8: Commit any final styling fixes before merge**

```bash
git add apps/web/app/globals.css apps/web/e2e/founder-flow.e2e.ts apps/web/e2e/customer-loop.e2e.ts
git commit -m "fix(ui): finish direct-answer workspace polish"
```
