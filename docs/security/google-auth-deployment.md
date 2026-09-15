# Google sign-in deployment

Evalomics uses Better Auth for Google OAuth and cookie-backed authentication. Application authorization remains in the existing Evalomics users/memberships/organizations model.

## Required environment

- DATABASE_URL
- BETTER_AUTH_URL
- BETTER_AUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

`BETTER_AUTH_SECRET` must be a high-entropy secret with at least 32 characters.

## Google Cloud configuration

Create a Web OAuth client and configure:

Local callback:

`http://localhost:3000/api/auth/callback/google`

Production callback:

`https://<production-domain>/api/auth/callback/google`

The production origin must also be the value of `BETTER_AUTH_URL`.

## Database migration

Run the auth migration as a deployment step before enabling Google sign-in:

```sh
npm run web:auth:migrate
```

The application does not auto-migrate auth tables on normal requests.

## Security model

- OAuth tokens are encrypted before database storage.
- Only Google profile/login scopes are required for authentication.
- Workspace/Drive/Gmail connector permissions are not requested during sign-in.
- A verified Better Auth identity is mapped into the existing Evalomics tenant/RBAC system.
- First authenticated access provisions one private workspace with OWNER membership.
- Repeated logins are idempotent.
- Same-email/different-identity conflicts are rejected rather than silently linked.
- Environment-derived identity remains only as a development/test fallback when Google auth is not configured.

## Launch checklist

Before production enablement:

1. Set the final domain in BETTER_AUTH_URL.
2. Register the exact production callback URI in Google Cloud.
3. Generate and store BETTER_AUTH_SECRET in the deployment secret manager.
4. Run `npm run web:auth:migrate`.
5. Verify Google sign-in, sign-out, session expiry, and cross-tenant denial.
6. Confirm no Google Drive/Gmail scopes appear in consent.
7. Confirm production HTTPS and secure cookies.
