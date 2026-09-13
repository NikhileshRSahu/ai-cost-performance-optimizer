# Persistent Workbench Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the existing optimizer evidence engine safely in PostgreSQL so the upcoming authenticated founder dashboard, Optimization Lab, and report can operate on durable tenant-isolated data.

**Architecture:** Add a `persistence` module using PostgreSQL + Drizzle behind organization-scoped repositories. Authentication remains vendor-neutral: a passwordless identity adapter resolves a trusted external identity into a persisted user and memberships, then emits the existing `AuthenticatedSession`; no caller-supplied role or organization is treated as authority. PostgreSQL integration tests run against a CI service database rather than adding a Docker/Testcontainers dependency.

**Tech Stack:** Node 24, TypeScript 6 strict mode, Drizzle ORM 0.45.2, Drizzle Kit 0.31.10, pg 8.23.0, @types/pg 8.23.1, PostgreSQL 16, Zod 4, Vitest 5, GitHub Actions.

**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md` sections 6, 8, 20-22, 24, 26-27, 29.1, and 29.6.

## Global Constraints

- Every repository read/write is organization-scoped and receives an authenticated session; organization IDs never confer authority by themselves.
- Cross-tenant access must fail even when two organizations reuse the same recommendation, workload, import, or evidence identifiers.
- Money and financial evidence remain decimal strings or exact numerator/denominator strings; no JavaScript floating-point financial arithmetic is introduced.
- Ledger/state history is append-only; corrections append invalidation events instead of rewriting prior evidence.
- Provider credentials, raw prompts/responses, request headers/bodies, and unrestricted error strings are not persisted by this milestone.
- Passwordless authentication is represented by trusted identity claims plus persisted users/memberships; sending email magic links belongs to the web/auth delivery slice.
- Production provider adapters, paid API calls, deployment, and outreach remain out of scope.
- CI continues to require formatting, lint, typecheck, tests/build, high-severity dependency audit, and Gitleaks.

---

### Task 1: PostgreSQL dependency and schema foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `drizzle.config.ts`
- Create: `src/persistence/schema.ts`
- Create: `src/persistence/index.ts`
- Create: `drizzle/0000_persistent_workbench.sql`
- Test: `tests/persistence/schema.test.ts`

**Interfaces:**
- Produces Drizzle tables: `organizations`, `users`, `memberships`, `workloads`, `importRuns`, `usageRecords`, `recommendations`, `ledgerEvents`, `implementationRecords`, `verificationWindows`, and `jobs`.
- IDs are text/UUID-compatible opaque strings supplied by application services.
- Every tenant-owned table contains `organization_id`; composite uniqueness and foreign keys include tenant identity where practical.

- [ ] **Step 1: Write failing schema tests.** Assert every tenant-owned table exports an `organizationId` column; memberships are unique on `(organizationId,userId)`; ledger event IDs are unique and include immutable evidence fields; usage dedupe supports `(organizationId,source,sourceEventId)` plus fingerprint; financial columns are text/exact evidence fields rather than floating-point.
- [ ] **Step 2: Run `npm test -- tests/persistence/schema.test.ts`; verify RED because the persistence module does not exist.**
- [ ] **Step 3: Pin stable dependencies.** Add `drizzle-orm@0.45.2` and `pg@8.23.0`; add `drizzle-kit@0.31.10` and `@types/pg@8.23.1` as dev dependencies. Add scripts `db:generate`, `db:migrate`, and `test:db`.
- [ ] **Step 4: Implement `schema.ts` with PostgreSQL enums/checks/indexes.** Use text for exact money/rational evidence, timestamp-with-time-zone for instants, boolean `is_demo`, JSONB only for bounded non-secret metadata, and explicit organization foreign keys.
- [ ] **Step 5: Generate and commit the initial SQL migration.** Migration must create foreign keys and indexes needed by organization-scoped lookups; no destructive migration commands.
- [ ] **Step 6: Run schema tests, typecheck, and migration generation consistency; verify GREEN.**
- [ ] **Step 7: Commit as `feat: add persistent workbench schema`.**

### Task 2: Database client and mandatory tenant repository guard

**Files:**
- Create: `src/persistence/database.ts`
- Create: `src/persistence/tenant.ts`
- Create: `src/persistence/repositories/organizations.ts`
- Create: `src/persistence/repositories/memberships.ts`
- Create: `src/persistence/repositories/index.ts`
- Test: `tests/persistence/tenant.test.ts`
- Test: `tests/persistence/repositories.db.test.ts`

**Interfaces:**
```ts
export type PersistenceDatabase = ReturnType<typeof createDatabase>;

export function createDatabase(connectionString: string): {
  db: NodePgDatabase<typeof schema>;
  pool: Pool;
  close(): Promise<void>;
};

export function requireOrganizationAccess(input: Readonly<{
  session: AuthenticatedSession;
  organizationId: string;
  action: WorkbenchAction;
}>): AuthorizationResult;

export interface MembershipRepository {
  sessionForIdentity(identity: TrustedPasswordlessIdentity): Promise<AuthenticatedSession | null>;
  listForOrganization(session: AuthenticatedSession, organizationId: string): Promise<readonly SessionMembership[]>;
}
```

- [ ] **Step 1: Write failing guard tests.** OWNER/OPERATOR/VIEWER behavior must match existing `authorize`; absent membership and cross-tenant requests throw typed authorization errors.
- [ ] **Step 2: Write failing PostgreSQL integration tests.** Seed org A and org B with overlapping opaque IDs; assert a session for A cannot read B memberships/organization rows and a B session cannot mutate A.
- [ ] **Step 3: Run focused tests; verify RED.**
- [ ] **Step 4: Implement pooled `pg` + Drizzle database creation and `requireOrganizationAccess`.** Repositories must call the guard before constructing tenant queries.
- [ ] **Step 5: Implement organization/membership repositories with `WHERE organization_id = ...` in every tenant query.**
- [ ] **Step 6: Run focused unit + DB tests; verify GREEN.**
- [ ] **Step 7: Commit as `feat: enforce tenant scoped persistence`.**

### Task 3: Passwordless identity-to-session adapter

**Files:**
- Create: `src/auth/contracts.ts`
- Create: `src/auth/session-adapter.ts`
- Create: `src/auth/index.ts`
- Test: `tests/auth/session-adapter.test.ts`
- Test: `tests/auth/session-adapter.db.test.ts`

**Interfaces:**
```ts
export type TrustedPasswordlessIdentity = Readonly<{
  provider: string;
  subject: string;
  email: string;
  emailVerified: true;
}>;

export interface PasswordlessSessionAdapter {
  resolve(identity: TrustedPasswordlessIdentity): Promise<AuthenticatedSession | null>;
}
```

- [ ] **Step 1: Write failing tests.** Unverified/malformed identity input is rejected; a verified known identity resolves persisted user memberships; unknown identity returns null; roles come only from membership rows, never from identity payload extras.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement strict Zod parsing for trusted identity claims and a repository-backed session adapter.** Normalize email for lookup but bind durable identity using `(provider,subject)`; do not store login tokens or email contents.
- [ ] **Step 4: Run unit + DB tests and typecheck; verify GREEN.**
- [ ] **Step 5: Commit as `feat: add passwordless session adapter`.**

### Task 4: Persist evidence flow without weakening trust states

**Files:**
- Create: `src/persistence/repositories/imports.ts`
- Create: `src/persistence/repositories/evidence.ts`
- Create: `src/persistence/repositories/jobs.ts`
- Test: `tests/persistence/evidence.db.test.ts`
- Test: `tests/persistence/jobs.db.test.ts`

**Interfaces:**
```ts
export interface EvidenceRepository {
  appendLedgerEvent(session: AuthenticatedSession, event: LedgerEvent): Promise<void>;
  listLedgerEvents(session: AuthenticatedSession, organizationId: string, recommendationId: string): Promise<readonly LedgerEvent[]>;
  saveImplementation(session: AuthenticatedSession, record: ImplementationRecord): Promise<void>;
  saveVerification(session: AuthenticatedSession, input: PersistedVerificationWindow): Promise<void>;
}

export interface JobRepository {
  create(session: AuthenticatedSession, job: PersistedJob): Promise<void>;
  markSucceeded(session: AuthenticatedSession, organizationId: string, jobId: string, cursor: string | null): Promise<void>;
  markFailed(session: AuthenticatedSession, organizationId: string, jobId: string, safeErrorCategory: string): Promise<void>;
}
```

- [ ] **Step 1: Write failing DB tests for append-only state.** Persist OPPORTUNITY→TESTED→VERIFIED, reject cross-tenant writes, reject duplicate ledger event IDs, preserve invalidated rows, and reconstruct `currentValidState` from persisted history.
- [ ] **Step 2: Write failing import/job tests.** Import checksum/idempotency is organization-scoped; last successful import remains queryable after a later failed run; failed jobs store only safe error category; cursor can resume.
- [ ] **Step 3: Verify RED.**
- [ ] **Step 4: Implement repositories using transactions where one logical evidence write spans multiple rows.** Reuse existing domain validation before inserts; database constraints provide a second boundary.
- [ ] **Step 5: Run DB tests; verify GREEN.**
- [ ] **Step 6: Commit as `feat: persist optimizer evidence and jobs`.**

### Task 5: CI database gate, exports, and security documentation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `src/index.ts`
- Modify: `package.json`
- Modify: `README.md`
- Test: `tests/persistence/security.db.test.ts`

**Interfaces:**
- `./persistence` and `./auth` package exports become stable module entry points.
- GitHub Actions provides PostgreSQL 16 only to the DB-test step using a test-only credential.

- [ ] **Step 1: Write failing security integration tests.** Verify repository reads/writes fail across tenants for organizations, memberships, import runs, usage records, ledger, implementation, verification, and jobs. Verify persisted job/import errors cannot contain raw request/body/header/token/secret fields.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Add PostgreSQL 16 service to CI and run `npm run test:db` after the normal pure test gate.** Wait on `pg_isready`; apply migrations against a disposable `optimizer_test` database.
- [ ] **Step 4: Add `.env.example` containing only `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimizer_dev` and ensure real `.env*` stay ignored except the example.**
- [ ] **Step 5: Export auth/persistence modules and document current scope.** State clearly that email delivery, UI, provider credentials, and production deployment are not included yet.
- [ ] **Step 6: Run full CI: `npm run check`, `npm run test:db`, `npm audit --audit-level=high`, and Gitleaks.**
- [ ] **Step 7: Request pre-merge code review, fix Critical/Important findings, then open/merge the PR only on a fully green final head.**
- [ ] **Step 8: Commit as `chore: gate persistent workbench foundation`.**

## Acceptance Boundary

This slice is complete when PostgreSQL can durably store the optimizer's tenant, import, usage, trust-state, implementation, verification, and job evidence; every repository proves tenant isolation against a real PostgreSQL database; a verified passwordless identity resolves roles from persisted membership rather than caller payloads; append-only trust semantics survive persistence; and CI exercises migrations plus cross-tenant security.

It deliberately does **not** add the founder dashboard, Optimization Lab, print report, live email-link delivery, provider credentials, or paid inference. The next slice consumes these repositories to build the authenticated web workbench and report.
