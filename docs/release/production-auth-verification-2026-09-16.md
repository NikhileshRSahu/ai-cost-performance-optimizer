# Production auth verification — 2026-09-16

Purpose: force a production build from the current `main` after PR #34 merged so Vercel includes the final `ffebfef` recursion fix rather than the earlier `53e0c78` artifact.

Observed before redeploy:
- `https://evalomics.vercel.app/` -> 200
- `https://evalomics.vercel.app/api/health` -> 200 with database/auth `ok`
- `https://evalomics.vercel.app/login` -> 200
- `https://evalomics.vercel.app/api/auth/session` -> 500
- Production artifact was `53e0c78`, while `main` was `fd816c8a` and included `ffebfef` (`fix(auth): resolve direct Neon URL without recursion`).

Post-deploy gate: `/api/auth/session` must stop returning 500 before the release is considered auth-ready.
