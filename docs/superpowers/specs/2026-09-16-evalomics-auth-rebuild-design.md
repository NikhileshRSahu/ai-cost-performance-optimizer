# Evalomics Auth Rebuild Design

## Problem

Production Google sign-in reaches `POST /api/auth/sign-in/social` successfully, but the managed Neon Auth server still constructs Google's OAuth request with the Neon callback URL. The production diagnostic `NEON_AUTH_CALLBACK_REWRITE_MISSED` proves the callback URL is not present in the proxy response body or headers, so response rewriting cannot reliably change it.

The current reverse-proxy architecture is therefore the wrong abstraction for Evalomics authentication.

## Decision

Replace the managed-Neon-Auth proxy flow with a self-hosted Better Auth server mounted inside the Evalomics Next.js app.

Evalomics will own the OAuth callback and session cookie directly. Neon remains the PostgreSQL database provider, but managed Neon Auth is removed from the browser/session path.

## Architecture

### Server

Create `apps/web/lib/auth.ts` exporting a Better Auth instance.

- Database: PostgreSQL `pg.Pool` using `DATABASE_URL`.
- Better Auth tables: dedicated PostgreSQL schema `auth` so existing Evalomics product tables remain untouched.
- Base URL: `BETTER_AUTH_URL`, production value exactly `https://evalomics.vercel.app`.
- Secret: `BETTER_AUTH_SECRET`.
- Google provider: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Google callback: explicitly `https://evalomics.vercel.app/api/auth/callback/google` in production.
- Email/password authentication: enabled.
- Session cookie: issued directly by the Evalomics origin; no cookie-domain rewriting.

Mount Better Auth with `toNextJsHandler(auth)` at `apps/web/app/api/auth/[...all]/route.ts`.

### Client

Keep `apps/web/lib/auth-client.ts` using `createAuthClient()`; same-origin `/api/auth` remains the browser-facing API.

Replace the Google-only login control with a single auth panel that supports:

1. Continue with Google.
2. Continue with email and password.
3. Create account with email and password.

After successful authentication, redirect to `/start`.

### Application identity bridge

Replace `readNeonAuthIdentity` with a Better Auth session reader that calls the local Better Auth server/session API or server auth API directly and converts the authenticated Better Auth user to the existing `RuntimeIdentity` contract.

The downstream Evalomics membership/session adapter remains unchanged. Existing product authorization and organization provisioning logic must continue to receive:

```ts
{
  provider: 'better-auth',
  subject: user.id,
  email: user.email,
  emailVerified: user.emailVerified
}
```

No product authorization logic moves into Better Auth.

## Database isolation

Better Auth tables live under PostgreSQL schema `auth`. Existing Evalomics application tables and Drizzle migrations remain unchanged.

Use Better Auth's PostgreSQL adapter with an explicit schema, or an equivalent PostgreSQL connection configured so Better Auth creates/queries only `auth.*`.

The auth migration must be generated and committed as SQL or executed through the Better Auth migration tooling before production traffic is switched.

## Environment

Required production variables:

- `DATABASE_URL` — existing production database.
- `BETTER_AUTH_URL=https://evalomics.vercel.app`.
- `BETTER_AUTH_SECRET` — random high-entropy secret.
- `GOOGLE_CLIENT_ID` — Evalomics Web OAuth client ID.
- `GOOGLE_CLIENT_SECRET` — matching Google OAuth client secret.

The existing `NEON_AUTH_BASE_URL` is no longer required by the application after cutover.

## Google Cloud

Authorized JavaScript origin:

`https://evalomics.vercel.app`

Authorized redirect URI:

`https://evalomics.vercel.app/api/auth/callback/google`

No Neon-hosted callback URI should be used for the rebuilt flow.

## Removal

Delete the custom managed-Neon proxy/rewrite path after the replacement passes tests:

- `apps/web/lib/neon-auth-proxy.ts`
- proxy-specific unit tests
- proxy-specific diagnostics and cookie rewriting
- runtime dependency on `NEON_AUTH_BASE_URL`

Do not remove Neon PostgreSQL usage.

## Verification

Automated gates:

- unit test proves Google authorization URL contains the Evalomics callback;
- unit test proves email/password sign-in and sign-up client paths render and submit;
- server session-to-`RuntimeIdentity` tests;
- protected-route E2E remains green;
- full CI: formatting, lint, typecheck, unit tests, web build, DB tests, DB backup/restore, Playwright, npm audit, Docker, gitleaks.

Production gates:

1. `/api/health` reports DB and self-hosted auth readiness.
2. Google opens with `redirect_uri=https://evalomics.vercel.app/api/auth/callback/google`.
3. Google callback reaches Evalomics.
4. Session persists after redirect to `/start`.
5. Refresh preserves the session.
6. Email/password account creation and login work.
7. Protected workspace opens.
8. Sign-out clears the session.

## Rollout

Build and verify on the recovery branch first. Do not merge PR #32 until the new auth flow works on the stable production hostname and the existing release gates remain green.

The previous managed Neon Auth proxy is considered deprecated immediately after the self-hosted flow passes production verification.
