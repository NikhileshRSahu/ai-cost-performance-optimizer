# Backend architecture

## Hard separation

Evalomics has two intentionally different data planes.

### Public demo
- Route: `/demo`
- Source: static application fixture data
- Authentication: none
- Database writes: none
- Provider credentials: none
- Experiment state: browser-only demonstration state
- Purpose: let prospects understand the evidence ladder without creating an account

### Authenticated product
- Routes: `/onboarding`, `/dashboard/**`, `/api/providers/**`, `/api/imports/**`
- Authentication: Auth.js + Google
- Persistence: production Neon Postgres
- Tenant boundary: `organization_id` on every evidence record
- Demo rows: forbidden by database CHECK constraints
- Provider credentials: AES-256-GCM encrypted; the key is derived from a dedicated provider encryption key when configured, otherwise the production auth secret through HKDF domain separation
- Provider validation: uses provider organization usage/cost reporting APIs before a connection is marked ready
- CSV imports: parsed against the canonical usage contract, deduplicated, analyzed, and written only with `is_demo=false`

## Evidence model

The database keeps separate state for:
- observed usage/import/provider snapshots
- Potential recommendations
- Tested recommendations
- implementation records
- verification windows
- immutable ledger events

The UI must never derive Verified savings from Potential or Tested data.

## Tenant provisioning

A verified Google session is mapped to `public.users` by email. Existing users are reused to avoid duplicate organizations after the auth migration. New users receive one non-demo organization and an OWNER membership.

Onboarding state and workspace name are persisted in `public.organizations`, not cookies.

## Health invariant

`/api/health` checks:
1. database connectivity
2. zero demo organizations/imports/usage/recommendations/provider snapshots in production Postgres

A demo isolation violation returns HTTP 503.
