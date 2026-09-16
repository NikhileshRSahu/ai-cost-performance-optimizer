# Evalomics Auth Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the failing managed-Neon OAuth proxy with a self-hosted Better Auth flow on `evalomics.vercel.app`, supporting Google and email/password sign-in while preserving Evalomics authorization and provisioning.

**Architecture:** Better Auth runs inside the Next.js app at `/api/auth/[...all]` and stores its own tables in PostgreSQL schema `auth` using the existing `DATABASE_URL`. Google OAuth and session cookies terminate on the Evalomics origin; the existing product membership/session adapter continues to consume a small `RuntimeIdentity` bridge.

**Tech Stack:** Next.js 16.3.4, React 19.3.0, Better Auth 1.7.4, PostgreSQL/pg 8.23.0, Vitest 5, Playwright 1.63, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-16-evalomics-auth-rebuild-design.md`

## Global Constraints

- Production auth origin is exactly `https://evalomics.vercel.app`.
- Production Google redirect URI is exactly `https://evalomics.vercel.app/api/auth/callback/google`.
- Better Auth tables must live under PostgreSQL schema `auth`; existing Evalomics product tables remain untouched.
- Existing organization membership, self-serve provisioning, trust-state, and authorization logic must remain unchanged.
- No managed-Neon callback URI may remain in the browser-facing OAuth flow after cutover.
- Do not merge PR #32 until production Google login, email/password login, session persistence, and workspace access are verified.

---

### Task 1: Create the self-hosted Better Auth server and isolated auth schema

**Files:**
- Create: `apps/web/lib/auth.ts`
- Modify: `apps/web/scripts/migrate-auth.ts`
- Create: `tests/web/auth-server.test.ts`

**Interfaces:**
- Produces: `auth` Better Auth instance from `apps/web/lib/auth.ts`.
- Produces: `authBaseUrl(): string`, `hasSelfHostedAuthConfiguration(): boolean`.
- Consumes: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

- [ ] **Step 1: Write failing configuration tests**

Create `tests/web/auth-server.test.ts` covering:
- production base URL resolves to `https://evalomics.vercel.app`;
- Google provider redirect URI resolves to `https://evalomics.vercel.app/api/auth/callback/google`;
- missing `BETTER_AUTH_SECRET` or `DATABASE_URL` is reported as not configured;
- no Neon Auth base URL is consulted.

Use module helpers that can be tested without opening a real DB connection.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npx vitest run tests/web/auth-server.test.ts
```

Expected: FAIL because the self-hosted auth helpers/module do not exist yet.

- [ ] **Step 3: Implement `apps/web/lib/auth.ts`**

Implement a configuration layer equivalent to:

```ts
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export function authBaseUrl(): string {
  return process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:3000';
}

export function hasSelfHostedAuthConfiguration(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim() &&
      process.env.BETTER_AUTH_SECRET?.trim() &&
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl?.trim()) throw new Error('DATABASE_URL_REQUIRED');
if (!secret?.trim() || secret.trim().length < 32) {
  throw new Error('BETTER_AUTH_SECRET_REQUIRED');
}

const pool = new Pool({
  connectionString: databaseUrl,
  options: '-c search_path=auth',
});

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const auth = betterAuth({
  appName: 'Evalomics',
  secret,
  baseURL: authBaseUrl(),
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  account: {
    encryptOAuthTokens: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            redirectURI: new URL(
              '/api/auth/callback/google',
              authBaseUrl(),
            ).toString(),
          },
        }
      : {},
});
```

Do not use `NEON_AUTH_BASE_URL`.

- [ ] **Step 4: Replace the migration script with auth-schema-aware migration**

Update `apps/web/scripts/migrate-auth.ts` so it:

1. opens an administrative pool with `DATABASE_URL`;
2. executes `create schema if not exists auth`;
3. closes that pool;
4. constructs the same Better Auth configuration with a Pool using `options: '-c search_path=auth'`;
5. calls `getMigrations(auth.options).runMigrations()`;
6. closes the auth pool.

- [ ] **Step 5: Run tests and migration against CI/local Postgres**

Run:

```bash
npx vitest run tests/web/auth-server.test.ts
npm run web:auth:migrate
```

Expected: tests PASS and migration prints `Better Auth schema migration complete.`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/auth.ts apps/web/scripts/migrate-auth.ts tests/web/auth-server.test.ts
git commit -m "feat(auth): self-host Better Auth on Evalomics"
```

---

### Task 2: Replace the Neon proxy route and session identity bridge

**Files:**
- Replace: `apps/web/app/api/auth/[...all]/route.ts`
- Create: `apps/web/lib/better-auth-session.ts`
- Modify: `apps/web/lib/runtime-session.ts`
- Test: `tests/web/better-auth-session.test.ts`

**Interfaces:**
- Produces: Next.js Better Auth `GET` and `POST` handlers.
- Produces: `readBetterAuthIdentity(requestHeaders: Headers): Promise<RuntimeIdentity | null>`.
- Preserves: existing `RuntimeIdentity` and downstream `resolveWebSession` / provisioning behavior.

- [ ] **Step 1: Write failing session bridge tests**

Create `tests/web/better-auth-session.test.ts` with a fake Better Auth session reader and assert:

```ts
{
  provider: 'better-auth',
  subject: 'auth-user-1',
  email: 'founder@example.com',
  emailVerified: true
}
```

is returned when the Better Auth session contains a verified user.

Also assert null for:
- no session;
- missing user ID;
- missing email;
- unverified email.

- [ ] **Step 2: Run focused test and verify failure**

```bash
npx vitest run tests/web/better-auth-session.test.ts
```

Expected: FAIL because the bridge does not exist.

- [ ] **Step 3: Mount Better Auth directly in the API route**

Replace `apps/web/app/api/auth/[...all]/route.ts` with:

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '../../../../lib/auth';

export const { GET, POST } = toNextJsHandler(auth);
```

No upstream proxy fetch, response mutation, cookie rewriting, or Neon callback rewriting remains.

- [ ] **Step 4: Implement the Better Auth session bridge**

Create `apps/web/lib/better-auth-session.ts` using the server auth API:

```ts
import { auth } from './auth';
import type { RuntimeIdentity } from './neon-auth';

export async function readBetterAuthIdentity(
  requestHeaders: Headers,
): Promise<RuntimeIdentity | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  const user = session?.user;
  if (
    !user ||
    typeof user.id !== 'string' ||
    !user.id ||
    typeof user.email !== 'string' ||
    !user.email ||
    user.emailVerified !== true
  ) {
    return null;
  }

  return Object.freeze({
    input: Object.freeze({
      provider: 'better-auth',
      subject: user.id,
      email: user.email,
      emailVerified: true,
    }),
    allowProvision: true,
  });
}
```

Move the `RuntimeIdentity` type to a neutral file if needed so the new bridge does not depend semantically on `neon-auth.ts`.

- [ ] **Step 5: Switch runtime session resolution**

In `apps/web/lib/runtime-session.ts`, replace:

```ts
readNeonAuthIdentity(requestHeaders)
```

with:

```ts
readBetterAuthIdentity(requestHeaders)
```

Keep the environment-trusted test identity fallback and all membership/provisioning logic unchanged.

- [ ] **Step 6: Run session tests**

```bash
npx vitest run tests/web/better-auth-session.test.ts tests/auth/session-adapter.db.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/api/auth/[...all]/route.ts apps/web/lib/better-auth-session.ts apps/web/lib/runtime-session.ts tests/web/better-auth-session.test.ts
git commit -m "feat(auth): terminate sessions on Evalomics origin"
```

---

### Task 3: Rebuild the login UI with Google plus direct email/password

**Files:**
- Replace: `apps/web/components/google-sign-in-button.tsx` with `apps/web/components/auth-panel.tsx`
- Modify: `apps/web/app/login/page.tsx`
- Keep: `apps/web/lib/auth-client.ts`
- Test: `tests/web/auth-panel.test.tsx` or Playwright login assertions in the existing E2E suite

**Interfaces:**
- Google: `authClient.signIn.social({ provider: 'google', callbackURL: '/start', errorCallbackURL: '/login?error=auth' })`.
- Email login: `authClient.signIn.email({ email, password, callbackURL: '/start' })`.
- Email signup: `authClient.signUp.email({ name, email, password, callbackURL: '/start' })`.

- [ ] **Step 1: Write failing login UI tests**

Assert the login page exposes:
- `Continue with Google`;
- `Continue with email`;
- email field;
- password field;
- a toggle/action to create an account;
- accessible labels and visible error text.

- [ ] **Step 2: Verify the tests fail**

Run the focused UI/E2E test.

Expected: FAIL because only Google exists today.

- [ ] **Step 3: Implement `AuthPanel`**

Create a client component with:
- Google button;
- email/password form;
- sign-in/sign-up mode;
- name field only in sign-up mode;
- pending state;
- normalized, non-sensitive error messages;
- redirect to `/start` after successful email auth;
- no logging of passwords, OAuth codes, session tokens, or raw provider errors.

- [ ] **Step 4: Update login page configuration check**

Replace `hasNeonAuthConfiguration()` with `hasSelfHostedAuthConfiguration()`.

Keep the production-host guard so arbitrary preview hosts do not start Google OAuth. Email/password may remain disabled on untrusted preview hosts as well to keep cookie/origin behavior deterministic.

- [ ] **Step 5: Run accessibility and login tests**

Run:

```bash
npm run web:test
npm run web:e2e
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/auth-panel.tsx apps/web/components/google-sign-in-button.tsx apps/web/app/login/page.tsx tests/web
git commit -m "feat(auth): add Google and email sign-in UI"
```

Delete `google-sign-in-button.tsx` once no imports remain.

---

### Task 4: Replace auth readiness checks and remove the managed-Neon proxy

**Files:**
- Modify: `apps/web/app/api/health/route.ts`
- Delete: `apps/web/lib/neon-auth-proxy.ts`
- Delete or replace: `tests/web/neon-auth-proxy.test.ts`
- Delete or replace: `apps/web/lib/neon-auth.ts`
- Update: `docs/release/evalomics-v0-release-ledger.md`

**Interfaces:**
- Health response retains `checks.database` and `checks.auth`.
- `auth: ok` now means self-hosted Better Auth is configured and its schema is present.

- [ ] **Step 1: Write a failing auth-readiness test**

Test that auth readiness is:
- `not_configured` when required Better Auth variables are absent;
- `unavailable` when `auth.user`, `auth.session`, `auth.account`, or `auth.verification` are absent;
- `ok` when configuration and schema exist.

- [ ] **Step 2: Replace `checkAuthProvider()`**

Stop fetching Neon JWKS.

Use the existing DB connection and check:

```sql
select
  to_regclass('auth.user') is not null
  and to_regclass('auth.session') is not null
  and to_regclass('auth.account') is not null
  and to_regclass('auth.verification') is not null as ready
```

Combine this with `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` presence.

- [ ] **Step 3: Delete obsolete proxy code/tests**

Delete:
- `apps/web/lib/neon-auth-proxy.ts`;
- `tests/web/neon-auth-proxy.test.ts`;
- `apps/web/lib/neon-auth.ts` after `RuntimeIdentity` has moved to a neutral auth identity module.

Search the branch for:

```text
NEON_AUTH_BASE_URL
NEON_AUTH_PROXY_ERROR
NEON_AUTH_CALLBACK_REWRITE_MISSED
neon-auth-proxy
readNeonAuthIdentity
```

Expected: no runtime references remain.

- [ ] **Step 4: Run full local/CI-equivalent verification**

```bash
npm ci
npm run check
npm run web:build
npm run test:db
bash scripts/db-backup-restore-drill.sh
npm run web:e2e
npm audit --audit-level=high
docker build --tag ai-efficiency-intelligence:ci .
```

Gitleaks remains the GitHub Actions gate.

- [ ] **Step 5: Update release ledger**

Record:
- managed Neon Auth proxy retired;
- self-hosted Better Auth candidate SHA;
- required production env values;
- auth migration status;
- Google/email production verification status.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(auth): remove managed Neon Auth proxy"
```

---

### Task 5: Configure, migrate, deploy, and verify production

**Files/Systems:**
- Vercel production environment
- Google Cloud OAuth client
- Neon production database
- PR #32 / release ledger

**Interfaces:**
- Production URL: `https://evalomics.vercel.app`.
- Google callback: `https://evalomics.vercel.app/api/auth/callback/google`.

- [ ] **Step 1: Set production environment variables in Vercel**

Required values:

```text
BETTER_AUTH_URL=https://evalomics.vercel.app
BETTER_AUTH_SECRET=<32+ byte random secret>
GOOGLE_CLIENT_ID=<Evalomics Web client ID>
GOOGLE_CLIENT_SECRET=<matching Google client secret>
DATABASE_URL=<existing production database URL>
```

Do not add the Neon hosted callback as a Google redirect URI.

- [ ] **Step 2: Run the auth migration against production**

From a trusted environment with production `DATABASE_URL` and `BETTER_AUTH_SECRET`:

```bash
npm run web:auth:migrate
```

Verify the `auth` schema contains Better Auth core tables.

- [ ] **Step 3: Run final GitHub CI on one unchanged SHA**

Require green:
- formatting/lint/typecheck/unit;
- web build;
- DB tests;
- DB backup/restore;
- Playwright E2E;
- npm audit;
- Docker;
- gitleaks.

- [ ] **Step 4: Promote the matching Vercel deployment**

Promote only the deployment whose Git SHA exactly matches the green CI SHA.

- [ ] **Step 5: Verify production health**

Open:

```text
https://evalomics.vercel.app/api/health
```

Expected:

```json
{"status":"ok","checks":{"database":"ok","auth":"ok"}}
```

- [ ] **Step 6: Verify Google OAuth**

Start at:

```text
https://evalomics.vercel.app/login
```

Google's request must contain:

```text
redirect_uri=https://evalomics.vercel.app/api/auth/callback/google
```

Complete login and verify:
- callback hits `/api/auth/callback/google`;
- redirect reaches `/start`;
- refresh remains authenticated;
- protected workspace opens.

- [ ] **Step 7: Verify direct email authentication**

Create a new test account via the email/password form, sign out, then sign back in with the same credentials.

Verify the same `/start` and workspace behavior.

- [ ] **Step 8: Verify sign-out**

Sign out and verify a protected route returns to `/login`.

- [ ] **Step 9: Finish the release branch**

After all production auth and existing V0 release gates pass:
- update the release ledger with final SHA/deployment evidence;
- use the finishing-a-development-branch skill;
- merge PR #32;
- smoke-test `evalomics.vercel.app` after merge.
