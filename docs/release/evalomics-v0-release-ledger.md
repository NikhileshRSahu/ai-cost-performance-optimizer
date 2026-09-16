# Evalomics V0 Release Ledger

**Release branch:** `fix/recovery-ui-backend`

**Release PR:** #32

**Recorded:** 2026-09-16

## Candidate

- Candidate SHA: `7185f8bc21fb4c89b0d499baa875400b7b23522c`
- CI run: `35058289299`
- CI job: `104672975753`
- PR state at verification: draft, mergeable, clean
- Fresh Vercel preview deployment: `dpl_Hd1XGpYGewGcU1VqkF2BqRhx6xsW`
- Preview URL: `https://evalomics-ea7e0xcb8-evalomics.vercel.app`
- Preview deployed SHA: `7185f8bc21fb4c89b0d499baa875400b7b23522c`
- Preview state: READY

## Automated release gates

- npm ci: PASS — CI run `35058289299`
- npm run check: PASS — CI run `35058289299`
- web build: PASS — CI run `35058289299`
- DB tests: PASS — CI run `35058289299`
- DB backup/restore drill: PASS — CI run `35058289299`
- Playwright install: PASS — CI run `35058289299`
- Full web E2E: PASS — CI run `35058289299`
- Accessibility assertions: PASS — included in passing Playwright E2E
- npm audit --audit-level=high: PASS — CI run `35058289299`
- Docker build: PASS — CI run `35058289299`
- gitleaks: PASS — CI run `35058289299`

## Preview runtime verification

- Fresh deployment from candidate SHA: PASS — `dpl_Hd1XGpYGewGcU1VqkF2BqRhx6xsW`
- Preview state: PASS — READY
- Preview `/api/health`: BLOCKED — 503 with `database=not_configured` and `auth=not_configured`
- Preview DB runtime: BLOCKED — preview environment has no `DATABASE_URL`
- Preview auth runtime: BLOCKED — preview environment has no `NEON_AUTH_BASE_URL`

The preview runtime failure is configuration-specific. It is not an application build failure: the exact candidate built successfully in GitHub CI and Vercel, and the deployment is READY.

## Current production state

- Stable URL: `https://evalomics.vercel.app`
- Current production deployment: `dpl_HEeA6uyBfMrKEhmAn4fKocf2qREp`
- Current production SHA: `d70151a080f62e63755ed71746ed3148b2d9cb72`
- Current production SHA is **not** the V0 release candidate.
- Production homepage: PASS (HTTP 200 observed)
- Production login page: PASS (HTTP 200 observed)
- Production DB health on the old deployment: PASS
- Production candidate auth: NOT TESTED because production still points to old main.
- Production candidate CSV -> VERIFIED journey: NOT TESTED because production still points to old main.

A runtime scan of the existing production deployment showed no current application error group. The only reported item was a PostgreSQL SSL-mode deprecation/security warning recommending explicit `sslmode=verify-full` for future pg versions.

## Remaining blocking release gates

1. Put the release candidate on a trusted runtime that has the production DB/Auth environment.
2. Verify candidate `/api/health` returns both `database: ok` and `auth: ok`.
3. Verify Google sign-in on the stable trusted hostname.
4. Verify an authenticated organization/workspace route.
5. Execute the complete production CSV -> diagnosis -> constraints -> benchmark -> implementation -> post-change verification -> proof journey.
6. Verify the failing post-change-quality fixture remains below VERIFIED.
7. Capture desktop/mobile visual QA for homepage, login, Overview, Evidence, Constraints, Test, Verify, and report.
8. Re-run full CI if any application code changes.
9. Merge PR #32 only after all above blocking gates pass.
10. Smoke-test production after merge.

## Release decision

**NOT READY TO MERGE YET.**

Reason: all code/CI/security gates are green, but trusted-host production auth and end-to-end runtime verification have not yet been observed on the release candidate. Preview cannot satisfy those gates because its DB/Auth environment is not configured.

## Post-V0

- broader provider connector catalogue
- billing automation
- enterprise SSO
- email/ChatGPT/Claude memory ingestion
- automatic prompt rewriting
- generalized workflow reconstruction
- marketing automation
