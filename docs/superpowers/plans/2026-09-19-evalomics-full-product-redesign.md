# Evalomics Full Product Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the full Evalomics frontend so the approved Vercel visual language and the simplified Emergent-style product flow feel consistent across marketing, onboarding, workspace, analysis, recommendations, testing, verification, tools, and supporting screens without changing backend semantics.

**Architecture:** Keep the existing Next.js 16 app and backend/domain logic. Introduce a shared dark Evalomics design system and reusable workspace primitives, then migrate routes in flow order. Marketing keeps cinematic motion; operational screens use the same palette and surfaces with flatter, task-focused layouts. Evidence maturity remains explicit as Observed → Potential → Tested → Verified.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS 4, Framer Motion 13, Lucide React, Vitest, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-09-19-evalomics-full-product-design.md`

## Global Constraints

- Visual baseline: approved Vercel deployment `dpl_CE2Cdud7YXJrzMtn3CkHPZPgYDse` / commit `1cc65e8`.
- Default product flow: Connect/upload → automatic analysis → direct result → optional details → test → verify.
- Preserve backend/domain behavior unless a frontend/backend mismatch blocks the intended flow.
- Never collapse Potential, Tested, and Verified savings into one number.
- Marketing may use cinematic 3D/scroll motion; operational UI must remain readable and task-focused.
- Respect `prefers-reduced-motion`.
- Production is not changed until preview verification and user approval.

---

### Task 1: Establish Shared Evalomics Tokens and UI Primitives

**Files:**
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/components/ui/eval-surface.tsx`
- Create: `apps/web/components/ui/evidence-badge.tsx`
- Create: `apps/web/components/ui/eval-button.tsx`
- Create: `apps/web/components/ui/status-banner.tsx`
- Test: `tests/web/eval-design-system.test.ts`

**Interfaces:**
- Produces: `EvidenceState = 'OBSERVED' | 'POTENTIAL' | 'TESTED' | 'VERIFIED'`
- Produces: `EvidenceBadge({ state, label? })`
- Produces: `EvalSurface({ tone, children, className? })`
- Produces: `EvalButton({ variant, href?, ... })`
- Produces: `StatusBanner({ tone, title, detail })`

- [ ] **Step 1: Write a failing design-system test**

Assert that the shared evidence states exist and map to unique semantic class names rather than generic colors.

- [ ] **Step 2: Run the focused test**

Run:
```bash
npm run web:test -- --run tests/web/eval-design-system.test.ts
```

Expected: FAIL because shared primitives do not exist yet.

- [ ] **Step 3: Centralize CSS variables**

Add shared variables for:
```css
--eval-bg: #050708;
--eval-panel: #0a1017;
--eval-panel-raised: #0f1721;
--eval-border: rgba(255,255,255,.075);
--eval-cyan: #63def4;
--eval-amber: #f0a35b;
--eval-tested: #82b7ff;
--eval-verified: #63e6bb;
--eval-danger: #fb7185;
```

Create surface, border, glow, focus, and typography utility classes used by both marketing and workspace.

- [ ] **Step 4: Implement the four shared primitives**

Keep primitives small, typed, accessible, and className-extensible.

- [ ] **Step 5: Run unit/type checks**

Run:
```bash
npm run web:test -- --run tests/web/eval-design-system.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/ui tests/web/eval-design-system.test.ts
git commit -m "ui: establish Evalomics shared design system"
```

---

### Task 2: Lock the Approved Marketing Shell and Launch-Style Scroll Story

**Files:**
- Modify: `apps/web/components/marketing/launch-exact-evalomics.tsx`
- Modify: `apps/web/components/marketing/guided-showcase-demo.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `tests/web/landing-story.test.ts`

**Interfaces:**
- Consumes: shared design tokens from Task 1.
- Produces: landing section order with `Hero → GuidedShowcaseDemo → remaining sections`.

- [ ] **Step 1: Write a failing landing hierarchy test**

Assert:
- hero copy remains present,
- `GuidedShowcaseDemo` follows the hero,
- old repetitive diagnosis copy is absent from the rendered homepage source.

- [ ] **Step 2: Run test and confirm failure if old copy remains**

- [ ] **Step 3: Finalize the 3-screen sticky choreography**

Keep three overlapping product screens visible, shift/flatten/zoom on scroll, fade oldest screen and introduce the fourth verification state. No fake cursor autoplay.

- [ ] **Step 4: Preserve approved hero and downstream sections**

Do not alter pricing, FAQ, CTA, or footer behavior except shared token adoption.

- [ ] **Step 5: Add reduced-motion behavior**

For reduced motion, render a static readable stacked composition without sticky transforms.

- [ ] **Step 6: Run tests and typecheck**

- [ ] **Step 7: Commit**

```bash
git commit -am "ui: finalize approved Evalomics marketing story"
```

---

### Task 3: Rebuild the Start / Source Selection Flow

**Files:**
- Modify: `apps/web/components/marketing/start-flow.tsx`
- Modify: `apps/web/app/start/page.tsx` if present
- Test: `tests/web/source-launchpad.test.ts`
- Test: `tests/web/guided-product-flow.test.ts`

**Interfaces:**
- Consumes: `EvalSurface`, `EvalButton`, `StatusBanner`.
- Produces: three source choices: OpenAI, Anthropic, CSV.

- [ ] **Step 1: Update failing tests to enforce one-decision source selection**

Tests must assert that the initial screen presents exactly the supported sources and that each source resolves to the existing real import/login route.

- [ ] **Step 2: Run tests to establish the current gap**

- [ ] **Step 3: Rebuild `StartFlow` with the approved product visual language**

Use one dominant headline, concise privacy/trust copy, and three source cards. Preserve current route construction and authentication returnTo behavior.

- [ ] **Step 4: Keep motion functional**

Use only short step transitions and success feedback; no decorative floating UI.

- [ ] **Step 5: Run focused tests**

- [ ] **Step 6: Commit**

```bash
git commit -am "ux: simplify Evalomics source selection"
```

---

### Task 4: Rebuild Import / Connect and Upload Success States

**Files:**
- Modify: `apps/web/app/o/[organizationId]/import/page.tsx`
- Modify: `apps/web/components/workbench/csv-dropzone.tsx`
- Test: `tests/web/import-copy.test.ts`
- Test: `tests/web/guided-product-flow.test.ts`

**Interfaces:**
- Consumes: existing server actions `connectProviderAccount`, `syncProviderAccount`, `uploadUsageCsv`.
- Produces: clear connected/uploaded states and one path forward to analysis.

- [ ] **Step 1: Add failing tests for visible upload/provider success state**

Require filename/provider, connection state, and a clear analysis action/transition.

- [ ] **Step 2: Preserve all existing provider error mappings**

Do not alter backend error codes or semantics.

- [ ] **Step 3: Restyle provider and CSV cards**

Apply the new surface/border/token system and eliminate any inconsistent light styling.

- [ ] **Step 4: Add satisfying success feedback**

Show “uploaded/connected”, what will be analyzed, and what happens next.

- [ ] **Step 5: Verify malformed CSV and provider failures remain recoverable**

- [ ] **Step 6: Commit**

```bash
git commit -am "ux: unify provider and CSV intake states"
```

---

### Task 5: Make the Organization Home the Direct Result Screen

**Files:**
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Create: `apps/web/components/workbench/direct-result.tsx`
- Test: `tests/web/direct-result-hierarchy.test.ts`

**Interfaces:**
- Consumes: existing `buildFounderDashboardView` output.
- Produces: `DirectResult` receiving observed spend, strongest recommendation, tested amount, verified amount, confidence, and action.

- [ ] **Step 1: Write/strengthen hierarchy tests**

The result screen must surface in this order:
1. observed spend,
2. strongest opportunity,
3. tested/verified evidence when present,
4. confidence,
5. recommended action,
6. `See details`.

- [ ] **Step 2: Run focused test**

- [ ] **Step 3: Extract `DirectResult`**

Keep server data loading in the route; move visual composition into a focused component.

- [ ] **Step 4: Redesign the no-data state**

One clear choice: connect provider or upload CSV. Do not show a dashboard shell with empty widgets.

- [ ] **Step 5: Apply evidence labels to every savings figure**

Observed, Potential, Tested, Verified must be visible as text, not color-only.

- [ ] **Step 6: Run tests/typecheck**

- [ ] **Step 7: Commit**

```bash
git commit -am "ux: make direct result the Evalomics workspace home"
```

---

### Task 6: Build Optional “See Details” Evidence Surface

**Files:**
- Create: `apps/web/components/workbench/evidence-details.tsx`
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Test: `tests/web/direct-result-hierarchy.test.ts`

**Interfaces:**
- Produces: `EvidenceDetails` section/drawer containing evidence window, Work MRI summary, constraints, source lineage, methodology, limitations, and verification logic.

- [ ] **Step 1: Add failing test that deep evidence is secondary**

Primary result content must appear before technical evidence.

- [ ] **Step 2: Implement `See details` interaction**

Prefer an in-page expandable detail panel or route-safe disclosure that does not disrupt the primary flow.

- [ ] **Step 3: Add technical evidence blocks**

Reuse existing data only; do not invent fields.

- [ ] **Step 4: Add keyboard and focus behavior**

- [ ] **Step 5: Commit**

---

### Task 7: Normalize Workspace Navigation and Shell

**Files:**
- Modify: `apps/web/components/workbench/workbench-shell.tsx`
- Modify: `apps/web/components/site-chrome.tsx`
- Test: `tests/web/workbench-shell.test.ts`

**Interfaces:**
- Consumes: shared tokens and evidence primitives.
- Produces: one desktop shell and one mobile navigation pattern.

- [ ] **Step 1: Add a shell test for navigation labels and active state**

- [ ] **Step 2: Align shell palette with approved landing**

Replace hard-coded mixed blue surfaces with shared dark/amber/cyan system.

- [ ] **Step 3: Simplify navigation hierarchy**

Keep Cost Dashboard, Usage & Import, Recommendations, Prompt Optimizer, Model Calculator, Verified Savings, Settings.

- [ ] **Step 4: Make mobile navigation usable and accessible**

- [ ] **Step 5: Commit**

---

### Task 8: Redesign Recommendations as Evidence-First Opportunities

**Files:**
- Modify: `apps/web/app/o/[organizationId]/recommendations/page.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Test: `tests/web/recommendation-card.test.ts`

**Interfaces:**
- Produces opportunity cards answering: what, why, potential, confidence, action, evidence, tested status.

- [ ] **Step 1: Add failing tests for evidence maturity and recommended action**

- [ ] **Step 2: Replace generic metric-card composition with evidence-first cards**

- [ ] **Step 3: Keep modeled upside explicitly Potential**

- [ ] **Step 4: Add empty state consistent with source-import flow**

- [ ] **Step 5: Commit**

---

### Task 9: Normalize Testing / Benchmark and Verification Experiences

**Files:**
- Modify relevant benchmark/test route(s) discovered in the workspace.
- Modify: `apps/web/app/o/[organizationId]/proof/page.tsx`
- Create: `apps/web/components/workbench/quality-gate.tsx`
- Create: `apps/web/components/workbench/evidence-progression.tsx`
- Test: existing benchmark and verification web tests.

**Interfaces:**
- Produces: `QualityGate` and `EvidenceProgression`.
- Evidence progression is exactly Potential → Tested → Verified.

- [ ] **Step 1: Locate current benchmark/test route and existing proof data contract**

- [ ] **Step 2: Write failing UI tests against the existing domain semantics**

- [ ] **Step 3: Build benchmark comparison**

Show current vs proposed economics, quality floor, benchmark result, and limitations.

- [ ] **Step 4: Build verification progression**

Verified state only renders when the current backend view contains verified evidence.

- [ ] **Step 5: Commit**

---

### Task 10: Bring Prompt Optimizer, Calculator, and Supporting Tools into the Same System

**Files:**
- Modify: `apps/web/app/o/[organizationId]/prompts/page.tsx`
- Modify: `apps/web/app/o/[organizationId]/calculator/page.tsx`
- Modify: `apps/web/components/workbench/workspace-model-calculator.tsx`
- Modify tool routes under `apps/web/app/tools/**` as discovered.
- Test: `tests/web/workspace-model-calculator.test.ts`

**Interfaces:**
- Consumes shared workspace surfaces, buttons, labels, evidence semantics.

- [ ] **Step 1: Run existing calculator/prompt tests**

- [ ] **Step 2: Replace isolated visual treatments with common primitives**

- [ ] **Step 3: Keep general prompt advice explicitly non-personalized unless prompt-level evidence exists**

- [ ] **Step 4: Ensure calculator outputs remain planning evidence, not Verified**

- [ ] **Step 5: Commit**

---

### Task 11: Normalize Auth, Empty, Error, and Recovery Screens

**Files:**
- Modify auth-related pages under `apps/web/app/login/**`, `unauthorized/**`, and related components as discovered.
- Modify route-specific error/empty states in import/workspace screens.
- Create: `apps/web/components/ui/eval-empty-state.tsx`
- Create: `apps/web/components/ui/eval-error-state.tsx`
- Test: relevant web/auth tests.

**Interfaces:**
- Produces reusable `EvalEmptyState` and `EvalErrorState`.

- [ ] **Step 1: Inventory controlled auth/error pages**

- [ ] **Step 2: Add reusable recovery components**

Every error explains what happened, what remains safe, and the next action.

- [ ] **Step 3: Apply approved visual language without altering OAuth provider-hosted screens**

- [ ] **Step 4: Commit**

---

### Task 12: Responsive, Accessibility, and Full Flow Browser Verification

**Files:**
- Modify affected UI files from earlier tasks only as required by QA.
- Modify/add Playwright tests under `apps/web/e2e/**`.
- Test: `tests/web/**`

**Interfaces:**
- Validates all earlier tasks end-to-end.

- [ ] **Step 1: Run repository checks**

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run web:build
```

- [ ] **Step 2: Start the web app locally**

```bash
npm run web:dev
```

- [ ] **Step 3: Browser-check desktop flow**

Verify:
- landing,
- start/source selection,
- CSV/provider intake,
- direct result,
- See details,
- recommendations,
- calculator,
- proof/verification.

- [ ] **Step 4: Browser-check mobile**

Verify layout at a common mobile viewport and ensure no scaled-down unreadable dashboards.

- [ ] **Step 5: Run accessibility checks**

Use Playwright + axe for major screens; verify keyboard focus manually for source selection, detail disclosure, and mobile navigation.

- [ ] **Step 6: Fix only observed regressions**

- [ ] **Step 7: Commit**

```bash
git commit -am "test: verify full Evalomics product redesign"
```

---

### Task 13: Preview Deployment and Production Gate

**Files:** none unless deployment configuration needs correction.

**Interfaces:**
- Input: fully tested redesign branch.
- Output: one preview URL for user review.

- [ ] **Step 1: Push one clean preview build**

Avoid repeated dummy commits because the Hobby deployment quota is limited.

- [ ] **Step 2: Verify the deployed preview in browser**

Capture landing and primary product-flow states.

- [ ] **Step 3: Compare against the approved visual baseline**

Check palette, typography, surfaces, spacing, motion restraint, and route consistency.

- [ ] **Step 4: User review gate**

Do not promote until the user approves the complete preview.

- [ ] **Step 5: Promote the exact validated deployment**

Use Vercel promotion rather than rebuilding when possible.

