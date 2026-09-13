# Founder Workbench UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first authenticated, founder-facing web workbench that turns persisted optimizer evidence into an executive dashboard, current-vs-candidate Optimization Lab, and print-optimized audit report without weakening trust-state or tenant boundaries.

**Architecture:** Add a Next.js 16 app under `apps/web` so the existing domain/persistence package remains independently testable. Server-rendered routes consume organization-scoped application/view-model services, never raw database rows directly. A trusted-session bridge resolves a verified passwordless identity through the existing session adapter; demo mode uses deterministic synthetic fixtures and permanently visible labeling.

**Tech Stack:** Next.js 16.3.4, React 19.3.0, TypeScript 6, existing PostgreSQL/Drizzle persistence, existing Zod/domain modules, Vitest, Playwright for critical browser journeys, CSS Modules/global CSS without a design-system dependency.

**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md` sections 3-4, 7, 12, 16-19, 21-24, 26-27, 29.1-29.6.

## Global Constraints

- Every customer route is organization-scoped from authenticated session membership; URL/query organization IDs are selectors, never authority.
- UI may display `OPPORTUNITY`, `TESTED`, or `VERIFIED` only from persisted evidence state; no presentation-layer promotion.
- Demo-derived pages must always show “Synthetic demo data — not a customer result.”
- Financial display rounds only at presentation time; exact numerator/denominator and formula version remain available in evidence details.
- No provider credentials, raw prompts/responses, unrestricted errors, or arbitrary HTML are rendered or stored.
- The web app never automatically changes customer production configuration.
- Green is reserved for passed/verified outcomes, amber for potential/insufficient evidence, red for failed constraints/errors; state is also encoded in text/icons.
- Core routes must be keyboard reachable, responsive, print-friendly where applicable, and meet WCAG 2.2 AA contrast targets.
- CI remains formatting + lint + typecheck + tests + production build + PostgreSQL tests + audit + Gitleaks.

---

### Task 1: Web workspace and production build foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/not-found.tsx`
- Test: `tests/web/workspace.test.ts`

**Interfaces:**
- Root scripts expose `web:dev`, `web:build`, and `web:test`.
- Root `check` continues validating the engine; CI additionally runs `npm run web:build`.

- [ ] **Step 1: Write failing workspace tests.** Verify `apps/web/package.json` pins Next 16.3.4, React/React DOM 19.3.0, and the web app contains a server-rendered root route with no client-side auth state.
- [ ] **Step 2: Run focused test and verify RED.**
- [ ] **Step 3: Add npm workspace and pinned web dependencies.** Do not introduce Tailwind, component kits, analytics SDKs, or client auth libraries in this slice.
- [ ] **Step 4: Implement minimal accessible shell.** Global skip link, semantic header/main, responsive max-width layout, typography, focus-visible styles, print reset, and a neutral evidence-oriented visual language.
- [ ] **Step 5: Run `npm run web:build`, root typecheck/tests, and verify GREEN.**
- [ ] **Step 6: Commit as `feat: add founder workbench web shell`.**

### Task 2: Trusted request session and organization route guard

**Files:**
- Create: `apps/web/lib/session.ts`
- Create: `apps/web/lib/organization-context.ts`
- Create: `apps/web/app/o/[organizationId]/layout.tsx`
- Create: `apps/web/app/unauthorized/page.tsx`
- Test: `tests/web/organization-context.test.ts`

**Interfaces:**
```ts
export type WebIdentityProvider = () => Promise<unknown>;

export async function resolveWebSession(
  provider: WebIdentityProvider,
  adapter: PasswordlessSessionAdapter,
): Promise<AuthenticatedSession | null>;

export function requireOrganizationContext(
  session: AuthenticatedSession,
  organizationId: string,
): Readonly<{ organizationId: string; role: Role }>;
```

- [ ] **Step 1: Write failing route-guard tests.** No session → unauthorized; membership absent → unauthorized; VIEWER may enter read routes; role is derived only from session memberships.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement server-only session bridge.** For V0 development/demo, identity injection is an interface; production email-link delivery remains separately gated. No browser storage of roles or credentials.
- [ ] **Step 4: Implement organization layout guard and role-aware navigation labels.**
- [ ] **Step 5: Run focused tests/build and verify GREEN.**
- [ ] **Step 6: Commit as `feat: guard founder routes by persisted membership`.**

### Task 3: Founder dashboard view model and page

**Files:**
- Create: `src/workbench/dashboard-view.ts`
- Create: `apps/web/lib/dashboard-data.ts`
- Create: `apps/web/components/evidence-state-badge.tsx`
- Create: `apps/web/components/metric-card.tsx`
- Create: `apps/web/components/recommendation-card.tsx`
- Create: `apps/web/app/o/[organizationId]/page.tsx`
- Test: `tests/workbench/dashboard-view.test.ts`
- Test: `tests/web/dashboard-copy.test.ts`

**Interfaces:**
```ts
export type FounderDashboardView = Readonly<{
  organizationName: string;
  periodLabel: string;
  dataQuality: 'READY' | 'PARTIAL_DATA' | 'ZERO_USAGE' | 'NO_DATA';
  observedSpend: DisplayMoney | null;
  strongestAction: DashboardRecommendation | null;
  verifiedNetSavings: DisplayMoney | null;
  isDemo: boolean;
  limitations: readonly string[];
}>;

export function buildFounderDashboardView(input: DashboardEvidence): FounderDashboardView;
```

- [ ] **Step 1: Write failing pure view-model tests.** Cover ready data, partial data, no data, verified negative impact, fewer-than-seven-day projection suppression, and immutable demo label.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement deterministic view-model builder using exact-domain outputs.** Presentation formatting may create rounded display strings but retains exact evidence refs.
- [ ] **Step 4: Implement server data loader using organization-scoped repositories.**
- [ ] **Step 5: Render dashboard hierarchy:** observed spend + period/data-quality state, strongest recommended action as visual focus, savings state, benchmark/performance status, confidence/limitation, verified net savings, one next action.
- [ ] **Step 6: Add copy tests forbidding “guaranteed”, “customer result” on demo data, or VERIFIED language for non-verified states.**
- [ ] **Step 7: Run tests/build and verify GREEN.**
- [ ] **Step 8: Commit as `feat: add founder evidence dashboard`.**

### Task 4: Optimization Lab comparison

**Files:**
- Create: `src/workbench/lab-view.ts`
- Create: `apps/web/lib/lab-data.ts`
- Create: `apps/web/components/constraint-row.tsx`
- Create: `apps/web/components/evidence-details.tsx`
- Create: `apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx`
- Test: `tests/workbench/lab-view.test.ts`
- Test: `tests/web/lab-copy.test.ts`

**Interfaces:**
```ts
export type OptimizationLabView = Readonly<{
  recommendationId: string;
  decision: 'OPTIMIZE' | 'DO_NOT_CHANGE' | 'INSUFFICIENT_EVIDENCE';
  current: ConfigurationEvidence;
  candidate: ConfigurationEvidence;
  constraints: readonly ConstraintDisplayRow[];
  economics: LabEconomicsView;
  confidence: ConfidenceDisplay;
  evidenceLinks: readonly EvidenceLink[];
  isDemo: boolean;
}>;
```

- [ ] **Step 1: Write failing tests for decision presentation.** Constraint failure dominates; insufficient evidence is distinct; exact boundary passes; positive saving cannot override failed quality.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement pure Lab view model from persisted recommendation/benchmark evidence.**
- [ ] **Step 4: Render side-by-side current/candidate metrics with constraint rows and visually dominant final decision.**
- [ ] **Step 5: Add progressive evidence disclosure for formulas, exclusions, source window, formula/detector versions, and limitations.**
- [ ] **Step 6: Verify demo labeling and copy-safety tests.**
- [ ] **Step 7: Commit as `feat: add optimization lab comparison`.**

### Task 5: Print-optimized professional report

**Files:**
- Create: `src/reports/report-view.ts`
- Create: `src/reports/index.ts`
- Create: `apps/web/app/o/[organizationId]/report/[recommendationId]/page.tsx`
- Create: `apps/web/app/o/[organizationId]/report/[recommendationId]/print.css`
- Test: `tests/reports/report-view.test.ts`
- Test: `tests/web/report-content.test.ts`

**Interfaces:**
- Report sections follow spec section 19 exactly: executive summary; scope/data quality; opportunity; benchmark; economics; confidence; implementation/rollback; verification; methodology/limitations.

- [ ] **Step 1: Write failing report tests.** Every financial claim must include state, horizon, currency, exact-evidence reference, and formula version where applicable; demo report must include permanent synthetic disclaimer; incomplete evidence must render limitation rather than invented zero.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement pure report view model with escaped plain text only.**
- [ ] **Step 4: Render semantic print HTML with repeated report header/footer cues, page-break rules, monochrome-safe state labels, and no interactive-only content required to understand conclusions.**
- [ ] **Step 5: Add “Print / Save as PDF” browser action without server-side PDF dependency.**
- [ ] **Step 6: Run tests/build and verify GREEN.**
- [ ] **Step 7: Commit as `feat: add evidence backed optimization report`.**

### Task 6: Critical E2E, accessibility, and CI gate

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/demo-flow.spec.ts`
- Create: `apps/web/e2e/tenant-guard.spec.ts`
- Create: `apps/web/e2e/report-print.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Browser tests run against deterministic demo/test identity only; no paid APIs or outbound email.

- [ ] **Step 1: Add Playwright as a pinned dev dependency and create failing E2E specs.**
- [ ] **Step 2: Golden demo flow:** dashboard → strongest opportunity → Lab → report; assert synthetic label visible on every page.
- [ ] **Step 3: Tenant guard flow:** URL-switch attempt to another organization returns unauthorized without leaking organization content.
- [ ] **Step 4: Decision flow:** failed candidate shows DO NOT CHANGE; weak evidence shows INSUFFICIENT EVIDENCE; neither renders verified/passed styling.
- [ ] **Step 5: Report flow:** report contains all required sections and print media styles; no hidden evidence is required to interpret result.
- [ ] **Step 6: Add critical accessibility assertions:** unique page title, one main landmark, keyboard-focusable navigation/actions, labels not color-only, heading order, and no obvious automated WCAG violations using the selected test helper if dependency audit remains clean.
- [ ] **Step 7: Add `web:build` and browser smoke/E2E gate to CI after domain + PostgreSQL tests.**
- [ ] **Step 8: Run full gate: root check, DB tests, web build, E2E, audit, Gitleaks.**
- [ ] **Step 9: Pre-merge code/security/content review; merge only on fully green exact PR head.**
- [ ] **Step 10: Update README with the actual runnable V0 workbench path and remaining gates.**

## Acceptance Boundary

This slice is complete when an authenticated founder can enter only organizations they belong to, see observed spend/data-quality state and one strongest defensible recommendation, inspect current-vs-candidate benchmark evidence and decision in the Optimization Lab, and produce a professional print-ready optimization report. Synthetic demo content is unmistakably labeled everywhere; financial/evidence states cannot be promoted by UI code; cross-tenant route attempts fail; and the complete browser journey passes CI.

This slice does **not** enable provider credentials, automated production changes, billing, scheduled email reports, or broad commercial outreach. Live magic-link email delivery and deployment configuration can be added after the local/authenticated flow passes security and E2E review.
