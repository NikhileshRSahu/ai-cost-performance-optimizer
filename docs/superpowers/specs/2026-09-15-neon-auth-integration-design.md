# Neon Auth Integration Design

## Goal

Move Evalomics production identity/session handling to Neon Auth while preserving the existing Evalomics authorization and product-data model.

## Architecture

Neon Auth becomes the source of truth for authentication identity and session state. Evalomics keeps its existing `public.users`, `public.organizations`, and `public.memberships` tables for application authorization, tenancy, and product ownership. On the first authenticated request, Evalomics maps the Neon Auth user identity into the existing self-serve provisioning flow, creating or reusing the application user, organization, and OWNER membership.

The MRI, benchmark, implementation, verification, telemetry, billing, and evidence-ledger services are unchanged.

## Data flow

1. User signs in through Neon Auth.
2. The web application resolves the authenticated Neon Auth session.
3. The authenticated identity is converted into the existing trusted identity contract: provider, subject, verified email.
4. `provisionSelfServeIdentity` creates or reuses the Evalomics application user/workspace.
5. `resolveRuntimeSession` returns the existing `AuthenticatedSession` used by all authorization checks.
6. Unauthorized requests continue to resolve to null and cannot access organization-scoped actions.

## Boundaries

- Neon Auth credentials/session data stay in the `neon_auth` schema.
- Evalomics product authorization remains in the existing public application tables.
- No duplicate application organization/membership model is introduced.
- No MRI, economics, benchmark, or verification semantics change.
- No provider API key is persisted as part of auth.
- Production database remains Neon Postgres.

## Files

- Modify `apps/web/lib/runtime-session.ts` to resolve Neon Auth identity first.
- Replace self-hosted auth wiring in `apps/web/lib/auth.ts` with a Neon Auth client/session adapter boundary.
- Modify `apps/web/components/google-sign-in-button.tsx` and login page as needed for Neon Auth.
- Add a focused Neon Auth adapter module under `apps/web/lib/`.
- Add tests under `tests/web/` and/or `tests/auth/` for authenticated provisioning, reuse, and unauthorized access.
- Update `.env.example` with the Neon Auth base URL/public config required by the deployed web app.

## Error handling

- Missing Neon Auth configuration disables sign-in UI without breaking public tools.
- Invalid or expired auth session resolves to unauthenticated.
- Database provisioning failures surface safe application errors and do not create partial membership state.
- Existing organization authorization continues to enforce OWNER/OPERATOR/VIEWER rules.

## Verification

- Unit tests for session-to-identity mapping.
- DB-backed test for first-session provisioning and repeat-session reuse.
- Unauthorized-session test.
- Existing web build, DB tests, E2E, audit, Docker build, and secret scan must stay green.
- Deploy to Vercel preview and verify login/public pages before production promotion.
