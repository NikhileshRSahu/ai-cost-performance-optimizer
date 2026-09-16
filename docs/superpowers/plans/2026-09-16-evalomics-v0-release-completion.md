# Evalomics V0 Release Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Evalomics V0 as a production-verified CSV-first AI Efficiency Intelligence product whose complete customer journey reaches Verified Net Savings only when evidence, performance, and economic gates all pass.

**Architecture:** Keep the existing TypeScript modular monolith and recovery branch intact. Finish release hardening at the owning subsystem: design-system/accessibility first, then deterministic E2E trust journeys, then CI/security gates, then Vercel/Neon production verification, then visual QA and release evidence. No new feature work enters this plan.

**Tech Stack:** Next.js, TypeScript, React, Tailwind/CSS, PostgreSQL, Drizzle ORM, Zod, Vitest, Playwright + Axe, Neon Auth/Postgres, GitHub Actions, Docker, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-16-evalomics-v0-release-completion-design.md`

## Global Constraints

- Release branch: `fix/recovery-ui-backend`.
- Release PR: #32 only. PR #31 must not be merged.
- Product north-star: Verified net savings.
- Evidence states remain `OPPORTUNITY → TESTED → VERIFIED`.
- Demo records remain permanently labeled synthetic.
- Missing numeric data must remain unavailable/null; never silently coerce missing values to zero.
- Do not disable accessibility checks.
- Do not weaken tenant isolation, benchmark constraints, or verification gates to make tests pass.
- Do not print or commit secrets.
- A release candidate is valid only if one unchanged commit passes the complete CI pipeline.
- Stable production hostname: `https://evalomics.vercel.app`.
- V0 remains CSV-first. Provider/email/ChatGPT/Claude expansion is post-V0.

---

## File Map

- `apps/web/app/globals.css` — shared dark/light surface contrast contracts.
- `apps/web/components/workbench/workbench-shell.tsx` — authenticated dark workbench root.
- `apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx` — Optimization Lab recovery and decision surface.
- `apps/web/app/o/[organizationId]/report/page.tsx` and report components — light evidence report surface.
- `apps/web/e2e/customer-loop.e2e.ts` — hard customer journey, failed-verification, recovery, telemetry.
- `apps/web/e2e/founder-flow.e2e.ts` — founder dashboard → Lab → report and tenant isolation.
- `apps/web/e2e/google-auth.e2e.ts` — auth-disabled/preview-safe behavior.
- `apps/web/app/api/health/route.ts` — production DB/Auth readiness contract.
- `.github/workflows/ci.yml` — release pipeline.
- `docs/release/evalomics-v0-release-ledger.md` — final release evidence.

### Task 1: Finish the dark/light accessibility surface contract

**Files:**
- Modify: `apps/web/app/globals.css`
- Inspect/modify only if necessary: `apps/web/components/workbench/workbench-shell.tsx`
- Inspect/modify only if necessary: `apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx`
- Test: `apps/web/e2e/customer-loop.e2e.ts`
- Test: `apps/web/e2e/founder-flow.e2e.ts`

**Interfaces:**
- Consumes: `.org-workbench` root class from `WorkbenchShell`.
- Produces: two explicit visual contracts:
  - dark workbench/recovery surfaces use accessible light foregrounds;
  - light report surfaces use accessible dark foregrounds.

- [ ] **Step 1: Confirm the current two failing accessibility tests**

Run:
```bash
npm run web:e2e -- --grep "recovery states stay actionable and accessible|founder can traverse dashboard, lab, and report"
```

Expected before final fix: Axe reports color-contrast violations on either dark recovery content or light report content.

- [ ] **Step 2: Keep the dark workbench rule scoped to actual dark content**

The dark contract in `apps/web/app/globals.css` must retain readable foregrounds for workbench text and headings:

```css
.org-workbench
  :is(p, span, small, dt, dd, li, th, td, label, legend, summary, code) {
  color: #aeb8c4 !important;
}

.org-workbench :is(h1, h2, h3, h4, strong, b) {
  color: #f3f6fa !important;
}
```

Do not classify `.empty-state` as globally light unless its rendered background is actually light.

- [ ] **Step 3: Scope light foreground overrides only to actual light report surfaces**

Use semantic report containers:

```css
.org-workbench .report-cover,
.org-workbench .report-section,
.org-workbench .report-disclaimer,
.org-workbench
  :is(.report-cover, .report-section, .report-disclaimer)
  :is(p, span, small, dt, dd, li, th, td, label, legend, summary, code) {
  color: #334155 !important;
}

.org-workbench
  :is(.report-cover, .report-section, .report-disclaimer)
  :is(h1, h2, h3, h4, strong, b) {
  color: #0f172a !important;
}
```

For `.report-disclaimer`, verify its text is dark against the existing pale warning background. Do not leave a `color: #fff` rule with greater specificity.

- [ ] **Step 4: Run formatting and focused accessibility tests**

Run:
```bash
npx prettier --check apps/web/app/globals.css
npm run web:e2e -- --grep "recovery states stay actionable and accessible|founder can traverse dashboard, lab, and report"
```

Expected: PASS, with zero blocking Axe violations.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/workbench/workbench-shell.tsx apps/web/app/o/[organizationId]/lab/[recommendationId]/page.tsx
git commit -m "fix(a11y): finalize release surface contrast"
```

### Task 2: Re-prove the complete trust-state E2E suite

**Files:**
- Test: `apps/web/e2e/customer-loop.e2e.ts`
- Test: `apps/web/e2e/founder-flow.e2e.ts`
- Test: `apps/web/e2e/free-tools.e2e.ts`
- Test: `apps/web/e2e/google-auth.e2e.ts`
- Test: `apps/web/e2e/llm-cost-calculator.e2e.ts`
- Test: `apps/web/e2e/public-beta.e2e.ts`
- Modify product code only when a failing assertion exposes a real product defect.

**Interfaces:**
- Consumes: CSV import, workload constraints, benchmark, implementation, verification, report, tenant isolation.
- Produces: automated proof that the complete V0 trust path works and negative paths fail closed.

- [ ] **Step 1: Run the complete web E2E suite**

Run:
```bash
npm run web:e2e
```

Expected: all scenarios pass, including:
- hard customer journey reaches verified savings;
- failed post-change quality never becomes verified;
- synthetic walkthrough stays labeled;
- telemetry-only credential flow works;
- recovery state is actionable and accessible;
- founder dashboard/Lab/report traversal works;
- cross-tenant URL is denied;
- free tools and login remain public/usable.

- [ ] **Step 2: If a timeout fails, classify it before changing the timeout**

For any failing locator:
1. inspect whether the expected state exists in DOM;
2. inspect server logs for authorization/data readiness errors;
3. fix the underlying state/readiness bug if the element is absent;
4. extend a timeout only when the state is correct but CI scheduling makes the existing deterministic wait too short.

Do not replace semantic assertions with `waitForTimeout()`.

- [ ] **Step 3: Re-run only the failing scenario after each product fix**

Example:
```bash
npm run web:e2e -- --grep "failed post-change quality never becomes verified"
```

Expected: PASS.

- [ ] **Step 4: Re-run the complete suite**

Run:
```bash
npm run web:e2e
```

Expected: all E2E tests PASS on the same commit.

- [ ] **Step 5: Commit only if product/test code changed**

```bash
git add apps/web/e2e apps/web/app apps/web/components apps/web/lib
git commit -m "test(e2e): lock Evalomics V0 trust journey"
```

### Task 3: Pass the full CI release pipeline on one unchanged commit

**Files:**
- Inspect: `.github/workflows/ci.yml`
- Modify only for a genuine pipeline defect, never to remove a release gate.

**Interfaces:**
- Consumes: current release candidate commit.
- Produces: one GitHub Actions run where every required gate succeeds.

- [ ] **Step 1: Run local/CI-equivalent checks in order**

```bash
npm ci
npm run check
npm run web:build
npm run test:db
bash scripts/db-backup-restore-drill.sh
npx playwright install --with-deps chromium
npm run web:e2e
npm audit --audit-level=high
docker build --tag ai-efficiency-intelligence:release-candidate .
```

Expected: every command exits 0.

- [ ] **Step 2: Verify gitleaks through GitHub Actions**

Push the candidate and use the CI run that executes:
```yaml
- npm run check
- npm run web:build
- npm run test:db
- bash scripts/db-backup-restore-drill.sh
- npx playwright install --with-deps chromium
- npm run web:e2e
- npm audit --audit-level=high
- docker build --tag ai-efficiency-intelligence:ci .
- gitleaks/gitleaks-action
```

Expected: every step reports `success`.

- [ ] **Step 3: If npm audit fails, inspect the exact advisory**

Acceptable outcomes:
- update a dependency without breaking the app, then rerun all gates; or
- document an explicit non-exploitable exception in the release ledger only if the release owner accepts it.

Do not lower `--audit-level=high`.

- [ ] **Step 4: Record the green commit SHA and CI run ID**

Do not modify code after this point unless a later production gate finds a release blocker. Any modification invalidates the full-green candidate and requires Task 3 again.

### Task 4: Produce and verify a fresh Vercel release candidate

**Files:**
- Inspect: Vercel project configuration.
- No code modification unless deployment reveals a genuine build/runtime defect.

**Interfaces:**
- Consumes: Task 3 green commit SHA.
- Produces: Vercel deployment built from the same SHA.

- [ ] **Step 1: Check the latest Vercel deployment for the recovery branch**

Verify:
- project is `evalomics`;
- deployment source commit equals the Task 3 candidate SHA;
- status is READY.

If Hobby build-rate limiting prevents a new build, classify it as provider quota rather than application failure and use the next permitted build without changing source code.

- [ ] **Step 2: Verify public routes**

Check:
```text
/
 /login
 /tools
 /tools/llm-cost-calculator
 /methodology
```

Expected: HTTP success and intended content.

- [ ] **Step 3: Record deployment ID, URL, and SHA for the release ledger**

### Task 5: Verify production DB and Neon Auth readiness

**Files:**
- Inspect: `apps/web/app/api/health/route.ts`
- Modify only if health output misrepresents actual readiness.

**Interfaces:**
- Consumes: deployed production environment.
- Produces: observed DB and Auth readiness results.

- [ ] **Step 1: Request production health**

Request:
```text
https://evalomics.vercel.app/api/health
```

Expected when healthy:
- database readiness succeeds;
- auth/JWKS readiness succeeds;
- endpoint returns healthy HTTP status.

- [ ] **Step 2: If one subsystem fails, diagnose separately**

Database failure: verify Neon database connectivity/configuration.
Auth failure: verify Neon Auth base URL/JWKS/trusted-origin configuration.

Do not treat one subsystem's success as proof for the other.

- [ ] **Step 3: Record sanitized health result in the release ledger**

Never record secrets, connection strings, tokens, or OAuth client secrets.

### Task 6: Verify production Google authentication

**Files:**
- Inspect: `apps/web/app/login/page.tsx`
- Inspect: `apps/web/app/api/auth/[...all]/route.ts`
- Inspect: `apps/web/lib/neon-auth-proxy.ts`
- Modify only for a reproducible production auth defect.

**Interfaces:**
- Consumes: stable production host `evalomics.vercel.app`, Neon Auth trusted origin, configured Google OAuth client.
- Produces: authenticated Evalomics production session.

- [ ] **Step 1: Start Google sign-in from the stable production login page**

Expected:
- Google OAuth flow opens;
- redirect URI uses the stable Evalomics production callback;
- callback returns to Evalomics;
- session is established.

- [ ] **Step 2: Verify authenticated route access**

Expected: user reaches an organization/workspace route instead of `/unauthorized` or an auth proxy error.

- [ ] **Step 3: Verify arbitrary preview hosts remain guarded**

Expected: social sign-in is not presented as working on untrusted generated preview hosts.

- [ ] **Step 4: Record production-auth result in the release ledger**

### Task 7: Execute the complete production CSV → Verified Net Savings flow

**Files:**
- Use existing product routes and test/demo fixture.
- Modify owning product module only if a production-only defect appears.

**Interfaces:**
- Consumes: authenticated production session, non-customer fixture clearly labeled test/demo.
- Produces: persisted end-to-end evidence and correct final trust state.

- [ ] **Step 1: Import a conforming baseline CSV**

Required columns:
```text
timestamp_start,timestamp_end,provider,model,requests,total_cost,currency
```

Expected: accepted-row counts are visible; missing optional values remain unavailable rather than zero.

- [ ] **Step 2: Confirm diagnosis and strongest opportunity**

Expected: measured facts and potential economics are shown without claiming benchmark success.

- [ ] **Step 3: Define workload constraints**

At minimum, configure the workload-specific quality requirement required by the V0 spec.

Expected: benchmark/verification path becomes eligible only after required constraints exist.

- [ ] **Step 4: Enter a passing current-vs-candidate benchmark**

Expected:
- candidate passes configured performance constraints;
- comparable saving is positive;
- decision becomes `OPTIMIZE`;
- saving state becomes `TESTED`, not `VERIFIED`.

- [ ] **Step 5: Record implementation**

Expected: implementation timestamp/note persists and verification becomes available.

- [ ] **Step 6: Upload a passing post-change evidence window**

Expected:
- same workload/currency/denominator scope;
- post-change performance satisfies constraints;
- verification computes counterfactual post cost and net impact;
- state becomes `VERIFIED`.

- [ ] **Step 7: Run the failing verification fixture**

Use post-change evidence whose quality/performance violates the configured requirement.

Expected: state does not become `VERIFIED`; the product explains the failed verification requirement.

- [ ] **Step 8: Open proof/report**

Expected:
- evidence state is correct;
- formulas/limitations/provenance are visible;
- synthetic/test evidence is clearly labeled;
- negative impact, if present, is not clamped away.

### Task 8: Complete desktop/mobile visual QA

**Files:**
- Modify release-blocking UI defects only.
- Likely surfaces: `apps/web/app/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/o/[organizationId]/**`, `apps/web/app/globals.css`.

**Interfaces:**
- Consumes: final production candidate.
- Produces: screenshot-reviewed desktop/mobile release UI.

- [ ] **Step 1: Capture desktop and mobile views for**

```text
Homepage
Login
Overview
Evidence
Constraints
Test
Verify
Proof/report
```

- [ ] **Step 2: Review each capture against release criteria**

Pass only if:
- no horizontal overflow;
- no clipped primary CTA;
- readable hierarchy;
- accessible foreground/background contrast;
- clear OPPORTUNITY/TESTED/VERIFIED labeling;
- visible demo/test labeling where applicable;
- responsive navigation remains usable;
- keyboard focus is visible on interactive controls.

- [ ] **Step 3: Fix only blocking defects**

Do not add decorative feature work, animation expansion, or unrelated design refactors.

- [ ] **Step 4: Re-run affected E2E plus the full CI if code changes**

Any UI code change after Task 3 requires a fresh complete CI run before release.

### Task 9: Create the release ledger and merge only after all gates pass

**Files:**
- Create: `docs/release/evalomics-v0-release-ledger.md`

**Interfaces:**
- Consumes: observed evidence from Tasks 3–8.
- Produces: auditable release record and merge authorization.

- [ ] **Step 1: Create the release ledger with exact observed results**

Use this structure:

```markdown
# Evalomics V0 Release Ledger

- Final candidate SHA:
- PR: #32
- CI run ID:
- CI result:
- Unit/integration:
- DB test:
- DB backup/restore:
- E2E:
- npm audit:
- Docker:
- gitleaks:
- Vercel deployment ID:
- Deployed SHA:
- Production URL: https://evalomics.vercel.app
- /api/health database:
- /api/health auth:
- Google production auth:
- Passing CSV→VERIFIED journey:
- Failing verification remains non-VERIFIED:
- Desktop QA:
- Mobile QA:

## Known non-blocking limitations

## Post-V0
- Provider expansion
- Billing automation
- Enterprise SSO
- Email/ChatGPT/Claude memory ingestion
- Automatic prompt rewriting
- Marketing automation
```

Every field must contain observed evidence. Do not mark assumed items PASS.

- [ ] **Step 2: Commit the ledger**

```bash
git add docs/release/evalomics-v0-release-ledger.md
git commit -m "docs: record Evalomics V0 release evidence"
```

Because this commit changes the candidate SHA, run the complete CI pipeline one final time and update the ledger CI reference if necessary without changing application code.

- [ ] **Step 3: Mark PR #32 ready only after the final unchanged commit is green**

Expected PR conditions:
- draft removed;
- no unresolved release blocker;
- intended head is the ledger-bearing release candidate.

- [ ] **Step 4: Merge PR #32**

Do not merge PR #31.

- [ ] **Step 5: Verify production after merge**

Confirm:
- merged main SHA is deployed;
- homepage works;
- `/api/health` remains green;
- login path works;
- one authenticated smoke route works;
- no regression in the proof/report path.

- [ ] **Step 6: Mark V0 complete**

V0 is complete only when the production smoke result is recorded and all release-ledger blocking fields are PASS.

## Plan Self-Review

- Spec coverage: Tasks 1–9 cover accessibility, E2E trust journeys, CI/security, deployment, health, production auth, production CSV→verification, visual QA, release evidence, merge, and production smoke verification.
- Scope: no post-V0 connector/billing/marketing work is included.
- Trust invariant: OPPORTUNITY/TESTED/VERIFIED is preserved throughout.
- Candidate immutability: any code change after a full-green run requires a fresh full pipeline.
- Security: secrets are never printed or stored in the ledger.
- Placeholders: none.
- Interface consistency: release candidate SHA from Task 3 is the deployment/auth/production-flow candidate consumed by Tasks 4–8.
