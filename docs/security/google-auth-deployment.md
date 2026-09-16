# Google sign-in deployment

Evalomics production identity is self-hosted with Better Auth inside the Next.js application. Neon provides PostgreSQL storage only; managed Neon Auth is not in the browser OAuth or session path.

## Required environment

- `DATABASE_URL`
- `BETTER_AUTH_URL=https://evalomics.vercel.app`
- `BETTER_AUTH_SECRET` with at least 32 random characters
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

`NEON_AUTH_BASE_URL` is not used by the application after this cutover.

## Google Cloud configuration

Authorized JavaScript origin:

`https://evalomics.vercel.app`

Authorized redirect URI:

`https://evalomics.vercel.app/api/auth/callback/google`

Better Auth is configured with the same explicit callback, so Google never receives a Neon-hosted redirect URI.

## Database

Better Auth uses the existing Neon PostgreSQL database through `DATABASE_URL`, but its core tables are isolated under the `auth` schema.

The existing Evalomics application tables in `public` remain the source of truth for users, organizations, memberships, evidence, recommendations, and verification.

Run the committed Better Auth schema migration before production cutover.

## Session and workspace flow

1. Browser starts Google sign-in at `/api/auth/sign-in/social`.
2. Evalomics Better Auth constructs the Google authorization request.
3. Google returns directly to `/api/auth/callback/google` on `evalomics.vercel.app`.
4. Better Auth exchanges the code and writes its own same-origin session cookie.
5. The browser lands on `/start`.
6. `resolveRuntimeSession` reads the Better Auth session server-side.
7. Only a verified Google identity is mapped into the existing Evalomics tenant/RBAC system.
8. First authenticated access transactionally creates or reuses one application user, one private organization, and one OWNER membership.
9. Repeated access is idempotent and redirects to the existing workspace.

## Security model

- OAuth client secrets stay in Vercel server environment variables.
- Provider tokens are encrypted at rest by Better Auth.
- Better Auth tables are isolated in the `auth` schema.
- Google sign-in requires the provider email to be verified before a session is accepted.
- Evalomics never rewrites OAuth URLs or authentication cookies.
- Existing cross-tenant authorization remains unchanged.
- Authentication errors must never log OAuth credentials, authorization codes, passwords, or session-cookie values.

## Production checklist

1. Create/apply the `auth` schema migration.
2. Set all five required Vercel production environment variables.
3. Confirm Google Cloud has the exact Evalomics callback URI.
4. Deploy a commit with fully green CI.
5. Verify `/api/health` returns database and auth `ok`.
6. Complete a real Google sign-in.
7. Verify `/api/auth/callback/google` reaches Evalomics and redirects to `/start`.
8. Refresh and confirm the session persists.
9. Verify exactly one application user, primary organization, and OWNER membership exist.
10. Verify sign-out and cross-tenant denial.
