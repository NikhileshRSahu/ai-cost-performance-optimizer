# Evalomics

Evalomics is an AI cost & performance optimization product built around one evidence rule:

**Observed → Potential → Tested → Verified**

A detected opportunity is not called savings. A test result is not called savings. A number becomes savings only after rollout and a production verification window show the delta in observed spend while guardrails remain intact.

## Production app

The deployable Next.js application lives in `apps/web` because the preserved Vercel project uses that root directory.

It includes:

- evidence-led marketing site and pricing
- real Neon Managed Better Auth sign-up / sign-in / sign-out
- protected onboarding and dashboard routes
- read-only provider/CSV onboarding UX
- partial-sync and honest empty states
- dashboard evidence ladder
- opportunity evidence detail
- controlled experiment and Approver-only rollout flow
- verification window and finance-ready verified report
- alerts, integrations, team/RBAC, billing, settings
- responsive desktop/mobile UI
- `/api/health` deployment health endpoint

## Local development

```bash
cd apps/web
npm install
cp ../../.env.example .env.local
npm run dev
```

## Required environment

```bash
NEON_AUTH_BASE_URL=https://ep-green-night-b4iaryax.neonauth.c-6.us-east-2.aws.neon.tech/evalomics/auth
NEON_AUTH_COOKIE_SECRET=<32+ character random secret>
```

The preserved Vercel project may also supply the legacy `BETTER_AUTH_SECRET`; the app accepts it as a backwards-compatible secure cookie secret.

## Production boundaries

Authentication is real. The current product data and provider/experiment flows are a clearly labeled sample workspace and safe interaction model. Real provider credential persistence, production traffic mutation, payment processing, custom production SMTP, and customer-owned Google OAuth branding require their respective production credentials and commercial configuration and are not faked in this repository.
