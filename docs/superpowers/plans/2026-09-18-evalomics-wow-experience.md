# Evalomics Wow Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Evalomics' long explanatory marketing experience with a shorter evidence-engine experience and align sign-in, source onboarding, and direct-result UX around immediate customer value.

**Architecture:** Preserve all server-side evidence truth and backend pipelines. Add small client-side Framer Motion islands for semantic animation only; server-rendered pages remain responsible for source truth, navigation, and results. Reuse the existing design tokens and `framer-motion` dependency; do not add a second animation runtime.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS 4, Framer Motion 13, Lucide React.

**Spec:** `docs/superpowers/specs/2026-09-18-evalomics-wow-experience-redesign.md`

## Global Constraints

- Preserve provider credential handling, provider normalization, CSV/demo pipelines, recommendation ranking, and verified-savings math.
- Do not add a second animation dependency.
- Motion must communicate hierarchy, state change, causality, or progress.
- Respect `prefers-reduced-motion`.
- Synthetic demo values must stay clearly marked synthetic.
- Remove public `CSV-first` messaging.
- Do not invent provider capabilities, prompt visibility, savings, benchmark progress, or verification.
- Keep direct result as the first post-analysis surface.
- Keep deep evidence behind progressive disclosure.
- No WebGL, video hero, canvas animation, or persistent high-frequency decorative motion.
- Mobile must have no horizontal overflow and must not compress multi-column desktop layouts into unreadable cards.

---

### Task 1: Lock the public messaging and source-choice requirements

**Files:**
- Create: `tests/web/wow-experience-copy.test.ts`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/login/page.tsx`

**Interfaces:**
- Consumes: existing server-rendered public pages.
- Produces: public copy that consistently names OpenAI, Anthropic, CSV, and demo paths and never says `CSV-first`.

- [ ] **Step 1: Write the failing source-copy regression test**

Create `tests/web/wow-experience-copy.test.ts` using Node's test/assert modules. Read the two page source files and assert:
- neither contains `CSV-first`
- homepage contains `OpenAI`, `Anthropic`, `CSV`, `Analyze my AI usage`, and `Try the live demo`
- login contains `OpenAI`, `Anthropic`, `CSV`, and `demo`
- homepage no longer imports `ContainerScroll`

Example assertions:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync('apps/web/app/page.tsx', 'utf8');
const login = readFileSync('apps/web/app/login/page.tsx', 'utf8');

test('public experience names all supported first-value paths', () => {
  assert.equal(home.includes('CSV-first'), false);
  assert.equal(login.includes('CSV-first'), false);
  for (const expected of ['OpenAI', 'Anthropic', 'CSV', 'Analyze my AI usage', 'Try the live demo']) {
    assert.equal(home.includes(expected), true, expected);
  }
  for (const expected of ['OpenAI', 'Anthropic', 'CSV', 'demo']) {
    assert.equal(login.includes(expected), true, expected);
  }
  assert.equal(home.includes('ContainerScroll'), false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run from repo root:

```bash
node --test tests/web/wow-experience-copy.test.ts
```

Expected: FAIL because current homepage/login still contain `CSV-first`, homepage lacks the new CTA text, and homepage still imports `ContainerScroll`.

- [ ] **Step 3: Rewrite homepage and login copy without changing backend behavior**

Homepage:
- keep headline `Find AI waste. Prove the fix.`
- supporting copy names OpenAI, Anthropic, CSV
- primary CTA `Analyze my AI usage` -> `/login`
- secondary CTA `Try the live demo` -> `/login?returnTo=/start`
- trust row contains free beta, no card, no prompt content required for supported aggregate-data paths, no invented savings
- remove `ContainerScroll` usage

Login:
- supporting copy says sign in then choose OpenAI, Anthropic, CSV, or demo
- right-side sequence becomes Connect or upload -> Analyze automatically -> Get one clear result
- remove `CSV-first`

- [ ] **Step 4: Run the copy test and verify GREEN**

```bash
node --test tests/web/wow-experience-copy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/web/wow-experience-copy.test.ts apps/web/app/page.tsx apps/web/app/login/page.tsx
git commit -m "ux: align public Evalomics promise with provider-native flow"
```

---

### Task 2: Build the semantic Evidence Engine homepage demo

**Files:**
- Create: `apps/web/components/marketing/evidence-engine-demo.tsx`
- Create: `tests/web/evidence-engine-demo.test.ts`
- Modify: `apps/web/app/page.tsx`
- Delete: `apps/web/components/ui/container-scroll-animation.tsx` after confirming no imports remain.

**Interfaces:**
- Consumes: no backend data; this is explicitly synthetic marketing demonstration.
- Produces: `EvidenceEngineDemo` client component with four semantic states and reduced-motion path.

- [ ] **Step 1: Write the failing component-source contract test**

The test reads `evidence-engine-demo.tsx` and asserts it includes:
- `useReducedMotion`
- source labels OpenAI, Anthropic, CSV
- analysis labels `Reading usage evidence`, `Ranking supported opportunities`
- evidence labels `Opportunity`, `Tested`, `Verified`
- explicit `Synthetic` disclosure

It also scans `apps/web` source for `container-scroll-animation` imports and expects zero.

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/web/evidence-engine-demo.test.ts
```

Expected: FAIL because the component does not exist and the old container-scroll import remains.

- [ ] **Step 3: Implement `EvidenceEngineDemo`**

Use `'use client'`, `motion`, `AnimatePresence`, and `useReducedMotion` from `framer-motion`.

The component should:
- render a static meaningful state when reduced motion is enabled
- cycle automatically through four states only when motion is allowed
- stop after the final Verified explanation instead of looping forever
- use synthetic values and keep a persistent `Synthetic walkthrough` label
- reserve layout height to avoid shift
- use only transform/opacity transitions
- provide visible text for every state so information is never motion-only

- [ ] **Step 4: Integrate into homepage**

Replace the old scroll demo with:

```tsx
<section aria-labelledby="evidence-engine-title">
  <header>...</header>
  <EvidenceEngineDemo />
</section>
```

Keep the page sequence to:
1. Hero
2. Evidence Engine
3. product contract / trust
4. CTA/footer

Delete the old container-scroll component only after a repository search confirms no remaining imports.

- [ ] **Step 5: Run test and verify GREEN**

```bash
node --test tests/web/evidence-engine-demo.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/marketing/evidence-engine-demo.tsx apps/web/app/page.tsx tests/web/evidence-engine-demo.test.ts
git rm apps/web/components/ui/container-scroll-animation.tsx
git commit -m "feat: replace showcase scroll with evidence engine"
```

---

### Task 3: Turn the no-data workspace into a four-path launchpad

**Files:**
- Create: `apps/web/components/workbench/source-choice-card.tsx`
- Create: `tests/web/source-launchpad.test.ts`
- Modify: `apps/web/app/o/[organizationId]/page.tsx`

**Interfaces:**
- Consumes: `organizationId`.
- Produces: a visual launchpad linking to the existing import/data experience without duplicating provider backend logic.

- [ ] **Step 1: Write failing launchpad contract test**

Assert the workspace page/component source includes four labels:
- OpenAI
- Anthropic
- Upload CSV
- Try demo

Assert all paths use existing organization-scoped routes and no new credential logic is introduced in the component.

- [ ] **Step 2: Run RED**

```bash
node --test tests/web/source-launchpad.test.ts
```

Expected: FAIL because the current no-data state has one generic `Connect or upload usage` CTA.

- [ ] **Step 3: Implement source-choice card**

Create a focused server-safe presentational component:

```ts
type SourceChoiceCardProps = Readonly<{
  title: string;
  description: string;
  meta: string;
  href: string;
  badge?: string;
}>;
```

Use links only. Do not accept credentials or files in this card.

- [ ] **Step 4: Replace no-data state**

The Overview no-data state becomes:
- one short heading
- four choices
- short trust sentence
- no advanced configuration

OpenAI/Anthropic/CSV may point to the current import page with anchors/query hints if supported; demo points to the existing demo/import route. Do not invent a route that does not exist.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/web/source-launchpad.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/workbench/source-choice-card.tsx apps/web/app/o/[organizationId]/page.tsx tests/web/source-launchpad.test.ts
git commit -m "ux: turn empty workspace into source launchpad"
```

---

### Task 4: Add semantic analysis progress without fake percentages

**Files:**
- Create: `apps/web/components/workbench/analysis-progress.tsx`
- Create: `tests/web/analysis-progress.test.ts`
- Modify: `apps/web/app/o/[organizationId]/loading.tsx`

**Interfaces:**
- Produces: `AnalysisProgress` with stage labels only; it has no percentage API.

- [ ] **Step 1: Write failing test**

Assert:
- component includes stages `Reading usage`, `Normalizing evidence`, `Finding waste`, `Ranking supported opportunities`
- source contains no percent symbol and no `progress:` numeric prop
- uses `useReducedMotion`

- [ ] **Step 2: Run RED**

```bash
node --test tests/web/analysis-progress.test.ts
```

- [ ] **Step 3: Implement**

Use a short timed visual sequence while the loading route is mounted. This does not claim backend completion and must not label any stage `complete` except visually through the current animation state.

Reduced motion renders all stages statically with `Analyzing usage evidence…`.

- [ ] **Step 4: Replace legacy shimmer loading surface**

Keep semantic heading and accessible status region:

```tsx
<div role="status" aria-live="polite">
  <AnalysisProgress />
</div>
```

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test tests/web/analysis-progress.test.ts
git add apps/web/components/workbench/analysis-progress.tsx apps/web/app/o/[organizationId]/loading.tsx tests/web/analysis-progress.test.ts
git commit -m "feat: show semantic analysis progress"
```

---

### Task 5: Tighten the direct-result visual hierarchy

**Files:**
- Create: `tests/web/direct-result-hierarchy.test.ts`
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/recommendation-card.tsx` only if needed.

**Interfaces:**
- Consumes: existing `FounderDashboardView` and `RecommendationCard`.
- Produces: one dominant answer with secondary metadata and details.

- [ ] **Step 1: Write failing hierarchy test**

Source assertions:
- result screen contains `Spend analyzed`
- details disclosure text is `See why` or `See details`
- one primary action remains inside recommendation result
- Work MRI stays inside details and is not moved above the direct result
- no new calculated savings value is introduced in the page

- [ ] **Step 2: Run RED if current hierarchy violates the new copy contract**

```bash
node --test tests/web/direct-result-hierarchy.test.ts
```

- [ ] **Step 3: Refine result layout**

Make:
- result label small
- spend/supporting evidence compact
- finding title dominant
- state pill adjacent to finding
- CTA visually dominant
- limitations and MRI hidden by default
- verified savings prominent only when present

Do not change recommendation selection logic.

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/web/direct-result-hierarchy.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add tests/web/direct-result-hierarchy.test.ts apps/web/app/o/[organizationId]/page.tsx apps/web/components/recommendation-card.tsx
git commit -m "ux: strengthen direct result hierarchy"
```

---

### Task 6: Unify the evidence-state visual tokens and motion accessibility

**Files:**
- Create: `tests/web/evidence-state-style.test.ts`
- Modify: `apps/web/app/globals.css`
- Modify: affected homepage/workbench components only as required.

**Interfaces:**
- Produces: reusable classes/tokens for observed, opportunity, tested, verified, muted states.

- [ ] **Step 1: Write failing style contract test**

Assert globals define:
- `--eval-observed`
- `--eval-opportunity`
- `--eval-tested`
- `--eval-verified`
- reduced-motion media query that suppresses nonessential animation

- [ ] **Step 2: Run RED**

```bash
node --test tests/web/evidence-state-style.test.ts
```

- [ ] **Step 3: Add tokens and focused utilities**

Use existing palette relationships:
- observed/evidence blue
- opportunity amber
- tested blue
- verified green

Add a global:

```css
@media (prefers-reduced-motion: reduce) {
  .eval-motion-decorative {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

Avoid broad `* { animation: none }` rules that could break functional transitions.

- [ ] **Step 4: Run GREEN and commit**

```bash
node --test tests/web/evidence-state-style.test.ts
git add apps/web/app/globals.css tests/web/evidence-state-style.test.ts
git commit -m "style: unify Evalomics evidence states"
```

---

### Task 7: Browser, build, and accessibility verification

**Files:**
- Modify existing e2e tests if a stable selector changed.
- No production behavior additions unless a verified defect requires a TDD fix.

**Interfaces:**
- Validates the entire branch.

- [ ] **Step 1: Run focused source-contract suite**

```bash
node --test tests/web/*.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run existing repository test suite**

Use the repository's existing test command from root/package metadata. Do not substitute a smaller test set for the full suite.

- [ ] **Step 3: Run production build**

```bash
npm --prefix apps/web run build
```

Expected: exit 0, TypeScript completes successfully.

- [ ] **Step 4: Deploy/inspect preview build**

Verify desktop and 390px mobile:
- no horizontal overflow
- homepage is materially shorter than the old ~3,086px desktop page
- hero shows new provider-native copy
- Evidence Engine marks itself synthetic
- login contains no `CSV-first`
- first result remains direct answer before details
- no console errors

- [ ] **Step 5: Check reduced motion**

Emulate `prefers-reduced-motion: reduce` and verify:
- all text remains visible
- Evidence Engine shows useful static state
- analysis loading remains understandable
- no essential meaning disappears

- [ ] **Step 6: Record final verification evidence**

Do not merge. Leave a reviewable implementation PR with build/browser evidence.

- [ ] **Step 7: Commit any test-only adjustments**

```bash
git add tests apps/web/e2e
git commit -m "test: verify Evalomics wow experience"
```
