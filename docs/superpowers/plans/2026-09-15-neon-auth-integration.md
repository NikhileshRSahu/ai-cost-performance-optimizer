# Neon Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use Neon Auth for production authentication while preserving Evalomics' existing application authorization and workspace model.

**Architecture:** Neon Auth owns login/session state. A small adapter maps an authenticated Neon Auth user into the existing trusted identity contract, then reuses `provisionSelfServeIdentity` and the existing membership/session model. Product services remain unchanged.

**Tech Stack:** Next.js 16, React 19, Neon Auth, Better Auth-compatible session semantics, PostgreSQL/Neon, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-neon-auth-integration-design.md`

## Global Constraints

- Neon Auth is the authentication source of truth.
- Existing Evalomics `users`, `organizations`, and `memberships` remain the authorization source of truth.
- Do not change MRI, benchmark, implementation, or verification semantics.
- Missing/invalid auth must fail closed.
- Do not persist provider API secrets in auth code.
- Production DB is Neon Postgres.

---

### Task 1: Neon Auth identity adapter

**Files:**
- Create: `apps/web/lib/neon-auth.ts`
- Test: `tests/web/neon-auth.test.ts`

**Interfaces:**
- Produces: `readNeonAuthIdentity(headers: Headers): Promise<RuntimeIdentity | null>`
- Produces: `hasNeonAuthConfiguration(): boolean`

- [ ] Write failing tests for valid session mapping, unverified/missing session, and missing configuration.
- [ ] Run focused tests and confirm RED.
- [ ] Implement minimal adapter using configured Neon Auth base URL and request cookies/headers.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit.

### Task 2: Runtime session provisioning

**Files:**
- Modify: `apps/web/lib/runtime-session.ts`
- Test: `tests/auth/self-serve-provisioning.db.test.ts` or new focused DB test.

**Interfaces:**
- Consumes: `readNeonAuthIdentity`
- Produces: unchanged `resolveRuntimeSession(): Promise<AuthenticatedSession | null>`

- [ ] Write failing DB-backed test for first Neon session creating app user/workspace/OWNER membership.
- [ ] Add repeat-session reuse assertion.
- [ ] Add unauthenticated assertion.
- [ ] Implement Neon-first runtime identity resolution and keep trusted env fallback only for tests/operations.
- [ ] Run DB tests.
- [ ] Commit.

### Task 3: Login UI

**Files:**
- Modify: `apps/web/app/login/page.tsx`
- Modify/Create: `apps/web/components/google-sign-in-button.tsx`
- Test: `tests/web/` login tests.

**Interfaces:**
- Consumes: Neon Auth public/base URL configuration.
- Produces: working Google sign-in entry point and safe disabled state when config is missing.

- [ ] Add failing render/behavior tests.
- [ ] Implement Neon Auth sign-in redirect/button behavior.
- [ ] Preserve public calculator/methodology links.
- [ ] Run web tests.
- [ ] Commit.

### Task 4: Environment contract and deployment

**Files:**
- Modify: `.env.example`
- Modify deployment configuration only if required.

**Interfaces:**
- Adds: Neon Auth base URL/public variables.
- Keeps: `DATABASE_URL` for Evalomics application persistence.

- [ ] Update environment documentation with exact variable names.
- [ ] Run `npm run check`.
- [ ] Run `npm run web:build`.
- [ ] Run `npm run test:db`.
- [ ] Run `npm run web:e2e`.
- [ ] Verify audit, Docker build, and secret scan through CI.
- [ ] Deploy Vercel preview.
- [ ] Verify login, public tools, and authenticated redirect behavior.
- [ ] Promote only after preview verification.
