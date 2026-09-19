# Evalomics

AI cost & performance optimization with an evidence ladder: **Observed → Potential → Tested → Verified**.

## What is included

- Marketing site and interactive evidence-ladder demo
- Real email/password authentication using Neon Managed Better Auth
- Protected onboarding and dashboard routes
- Provider connection / CSV onboarding UI, partial-sync state, honest empty state
- Dashboard, opportunities, experiment flow, reports, alerts, integrations, team/RBAC, billing, settings
- Responsive desktop/mobile layout matching the locked Evalomics visual direction
- Health endpoint at `/api/health`

## Required production environment variables

```bash
NEON_AUTH_BASE_URL=https://ep-green-night-b4iaryax.neonauth.c-6.us-east-2.aws.neon.tech/evalomics/auth
NEON_AUTH_COOKIE_SECRET=<32+ character random secret>
```

The existing Neon Auth project already trusts `https://evalomics.vercel.app`.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Product integrity rule

Potential and Tested values are never labeled saved. A number is called savings only after rollout and a production verification window shows the delta in observed spend with guardrails intact.
