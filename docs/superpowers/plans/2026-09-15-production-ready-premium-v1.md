# Evalomics Production-Ready Premium V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Evalomics as a reliable, production-verified, premium V1 across authentication, the full evidence workflow, public UI, authenticated workbench UI, and deployment QA.

**Architecture:** Preserve the existing domain and persistence services. Harden the Neon Auth browser/session handoff first, then build a shared premium presentation system around the existing server-rendered workflow. Figma is the visual source of truth for the new public hero and authenticated shell; React/Tailwind/shadcn implement the validated system.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn-compatible component structure, Framer Motion, Lucide React, Neon Postgres/Auth, Drizzle, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-15-production-ready-premium-v1-design.md`

## Global Constraints

- Brand is exactly **Evalomics**.
- Core promise: **Find AI waste. Test safer fixes. Prove what actually improved.**
- Potential, Tested, and Verified savings MUST remain distinct.
- Research/demo evidence MUST NOT be presented as customer savings.
- Provider secrets MUST remain server-side and MUST NOT be logged.
- No silent FX conversion.
- Google Auth -> session -> application workspace provisioning must be deterministic and idempotent.
- UI must support `prefers-reduced-motion`.
- Existing domain services remain the source of truth; UI must not invent savings.

---

### Task 1: Harden production authentication and provisioning

**Files:**
- Modify: `apps/web/app/api/auth/[...all]/route.ts`
- Modify: `apps/web/lib/neon-auth.ts`
- Modify: `apps/web/lib/runtime-session.ts`
- Modify: `apps/web/components/google-sign-in-button.tsx`
- Test: `apps/web/e2e/google-auth.e2e.ts`
- Test: `tests/db/self-serve-provisioning.db.test.ts` or nearest existing provisioning DB test

**Interfaces:**
- Consumes: Neon Auth `get-session` response and browser cookies.
- Produces: `resolveRuntimeSession(): Promise<AuthenticatedSession | null>` with at least one membership after a successful first login.

- [ ] Add regression coverage for callback cookie rewriting and first-login workspace provisioning.
- [ ] Ensure the auth proxy rewrites callback locations and cookie domain/path safely without rewriting unrelated OAuth URLs.
- [ ] Make session parsing tolerate provider payload fields that are semantically verified booleans while rejecting unverified identities.
- [ ] Preserve idempotency: repeated `/start` requests must not create duplicate users, organizations, or memberships.
- [ ] Verify DB tests and auth E2E.

### Task 2: Create the premium Figma V2 source of truth

**Figma file:** `Evalomics Premium V2`

**Surfaces:**
- Public homepage desktop
- Public homepage mobile
- Authenticated workbench shell
- Work MRI overview
- Benchmark state
- Verification state

- [ ] Build token foundations: graphite, neutral, emerald, blue, amber; Geist/Inter-compatible type scale; spacing/radius/elevation.
- [ ] Build reusable components for nav item, metric tile, evidence badge, signal row, proof step, recommendation panel.
- [ ] Build public hero around live Work MRI, not a generic illustration.
- [ ] Build authenticated shell and Work MRI overview.
- [ ] Add motion intent markers / timeline for evidence flow and proof-state transitions.
- [ ] Validate screenshots for clipping, hierarchy, contrast, and responsive structure.

### Task 3: Implement the shared premium design system

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`
- Create/modify: `apps/web/components/ui/*`
- Create: `apps/web/components/product-shell.tsx`
- Create: `apps/web/components/evidence-state-pill.tsx`
- Create: `apps/web/components/metric-tile.tsx`
- Create: `apps/web/components/proof-timeline.tsx`

- [ ] Add semantic Tailwind theme tokens.
- [ ] Add Geist typography through Next font or safe local fallback.
- [ ] Add reduced-motion rules.
- [ ] Build reusable primitives with accessible focus and states.
- [ ] Keep heavy motion components client-only and isolated.

### Task 4: Rebuild the public homepage around the product

**Files:**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/components/home/work-mri-hero.tsx`
- Create: `apps/web/components/home/proof-scroll-story.tsx`
- Create: `apps/web/components/home/evidence-boundary.tsx`
- Modify: `apps/web/e2e/public-beta.e2e.ts`

- [ ] Write E2E assertions for CTA visibility, trust copy, proof states, and reduced-motion-safe structure.
- [ ] Replace the oversized static hero with a balanced copy + live product surface.
- [ ] Replace generic feature-card sections with sticky product walkthrough sections.
- [ ] Fix spacing/clipping/contrast from the current production screenshots.
- [ ] Verify desktop/mobile responsive behavior.

### Task 5: Rebuild the authenticated workbench shell

**Files:**
- Modify: `apps/web/app/o/[organizationId]/layout.tsx`
- Create: `apps/web/components/workbench/workbench-shell.tsx`
- Create: `apps/web/components/workbench/workbench-nav.tsx`
- Create: `apps/web/components/workbench/mobile-workbench-nav.tsx`
- Modify: `apps/web/e2e/founder-flow.e2e.ts`

- [ ] Make primary workflow navigation obvious and group secondary/admin routes.
- [ ] Show workspace identity and role without exposing raw IDs as the main label.
- [ ] Add responsive mobile navigation.
- [ ] Preserve cross-tenant authorization behavior.
- [ ] Verify keyboard/accessibility behavior.

### Task 6: Upgrade Work MRI overview to an operational dashboard

**Files:**
- Modify: `apps/web/app/o/[organizationId]/page.tsx`
- Modify: `apps/web/components/work-mri.tsx`
- Modify: `apps/web/components/recommendation-card.tsx`
- Modify: `apps/web/components/workflow-progress.tsx`
- Add focused component tests/E2E assertions.

- [ ] Show Observed / Potential / Tested / Verified metrics without fabricating unavailable values.
- [ ] Present Work MRI facts as dense signal rows with evidence references.
- [ ] Make the strongest action visually dominant with limitation + next action.
- [ ] Convert workflow progress into a compact proof timeline.
- [ ] Design no-data and withheld-claim states.

### Task 7: Polish benchmark, implementation, verification, import, and proof screens

**Files:**
- Modify relevant pages under `apps/web/app/o/[organizationId]/{import,workloads,benchmark,implement,verify,proof}`
- Reuse shared workbench primitives.

- [ ] Standardize page headers, state badges, forms, evidence panels, and next actions.
- [ ] Use clear benchmark comparison hierarchy.
- [ ] Make quality-floor failures visually unmistakable and never celebratory.
- [ ] Make Verified state the only green success state for savings.
- [ ] Keep demo disclaimers persistent.

### Task 8: Full production-equivalent verification

**Files:**
- Modify: `apps/web/e2e/customer-loop.e2e.ts`
- Modify: `apps/web/e2e/google-auth.e2e.ts`
- Add any missing fixtures only if required.

- [ ] Run `npm run check`.
- [ ] Run `npm run web:build`.
- [ ] Run `npm run test:db`.
- [ ] Run the DB backup/restore drill.
- [ ] Run Playwright E2E.
- [ ] Run `npm audit --audit-level=high`.
- [ ] Build Docker image.
- [ ] Run gitleaks.
- [ ] Request code review and fix all Critical/Important findings.
- [ ] Merge only after all checks pass.

### Task 9: Production deployment and live-state proof

**Systems:** GitHub main, Vercel production, Neon production.

- [ ] Confirm the Vercel deployment for the merge commit is READY.
- [ ] Check production runtime logs for auth or server errors.
- [ ] Verify Neon Auth provider remains custom/standard and trusted origins are correct.
- [ ] After one real Google login, verify exactly one application user, one primary organization, and one OWNER membership exist for the identity.
- [ ] Verify repeat login does not create duplicates.
- [ ] Complete or reproduce the customer loop against production-equivalent data.
- [ ] Only then declare the V1 ready to sell.


## Final public-beta clarity pass

- Pricing presents only the current public-beta product ($0) and the bounded $299 founding optimization audit.
- Roadmap capabilities are explicitly not sold as product tiers.
- Calculator currency is defined as the denomination of user-entered rates; changing the label never performs FX conversion.
- The generic feature-card middle of the homepage has been replaced by a pinned, progress-driven evidence story inspired by 21st.dev scroll patterns while preserving native scrolling and reduced-motion fallbacks.
