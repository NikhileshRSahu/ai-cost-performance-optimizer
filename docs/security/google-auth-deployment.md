# Google sign-in deployment

Evalomics production identity uses **Neon Auth** with Google OAuth. Neon Auth owns the authenticated identity/session. Evalomics keeps its existing `public.users`, `public.organizations`, and `public.memberships` tables for application authorization, tenancy, and product ownership.

## Required environment

- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`

The production application does not require Google client credentials in the Vercel runtime. Google credentials are configured in Neon Auth.

## Google Cloud configuration

Create a Web OAuth client for Evalomics.

Authorized JavaScript origin:

`https://evalomics.vercel.app`

Production callback:

`https://evalomics.vercel.app/api/auth/callback/google`

The callback intentionally returns through the Evalomics origin. The app then proxies the OAuth callback to Neon Auth and rewrites the resulting session cookie for the Evalomics origin.

## Neon Auth configuration

Production Neon Auth must use the custom/standard Google OAuth provider, not shared development keys.

Trusted origins include:

- `https://evalomics.vercel.app`
- the Vercel production alias when required

The application proxy strips forwarding headers that would make Neon Auth infer the wrong host.

## Session and workspace flow

1. Browser starts Google sign-in at `/api/auth/sign-in/social`.
2. Evalomics proxies the request to Neon Auth.
3. Google returns to `/api/auth/callback/google` on the Evalomics origin.
4. Evalomics proxies the callback to Neon Auth.
5. Neon Auth session cookies are rewritten without the Neon domain and with `Path=/`.
6. The browser lands on `/start`.
7. `resolveRuntimeSession` reads the Neon Auth session server-side.
8. First access transactionally creates or reuses one Evalomics application user, one private organization, and one OWNER membership.
9. Repeated access is idempotent and redirects to the existing workspace.

## Security model

- OAuth/provider secrets remain in Neon Auth.
- Evalomics does not persist plaintext provider OAuth credentials.
- Sign-in requests only identity access; AI-provider/workspace connectors are separately authorized.
- Verified Neon Auth identity is mapped into the existing Evalomics tenant/RBAC system.
- First authenticated access provisions one private workspace with OWNER membership.
- Repeated logins are idempotent.
- Same-email/different-identity conflicts are rejected rather than silently linked.
- Cross-tenant URL access remains denied by the existing organization authorization layer.
- Session/proxy errors must never log OAuth credentials or session-cookie values.

## Launch checklist

Before declaring production authentication ready:

1. Confirm the Google OAuth client has the exact Evalomics callback URI.
2. Confirm Neon Auth reports Google as a custom/standard provider.
3. Confirm `NEON_AUTH_BASE_URL` is set in Vercel production.
4. Complete a real Google sign-in.
5. Verify the browser returns through `/api/auth/callback/google` and then `/start`.
6. Verify exactly one application user, primary organization, and OWNER membership exist.
7. Repeat login and confirm those rows are not duplicated.
8. Verify sign-out and expired-session behavior.
9. Verify cross-tenant denial.
10. Confirm no Google Drive/Gmail scopes appear in consent.
