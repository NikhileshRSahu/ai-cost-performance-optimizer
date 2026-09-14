# Proovance

**Proovance** is an AI Efficiency Intelligence system for improving how a team uses AI across cost, model choice, retries, tokens, prompts, workflows, knowledge, implementation, and verified outcomes.

The product is designed around one operating loop:

`INGEST → UNDERSTAND → DIAGNOSE → TEST → IMPLEMENT → VERIFY → LEARN`

A customer can start with a usage CSV. Deeper access is optional and must unlock deeper analysis without becoming a prerequisite for proving initial value.

## Core trust model

The product keeps three financial states separate:

`OPPORTUNITY → TESTED → VERIFIED`

A cheaper candidate is not called safe merely because it costs less. A tested candidate is not called verified merely because it passed a benchmark. Verified impact requires implementation evidence plus comparable post-change data.

Missing data is unknown, not zero. Mixed currencies are not silently converted. Synthetic demo evidence is always labeled.

## AI Work MRI

The Work MRI turns supported evidence into an executive diagnosis rather than a wall of observability charts.

The current CSV-first MRI can measure, when the required evidence exists:

- observed spend
- exact cost per request
- exact cost per successful outcome
- model cost concentration
- repeated-attempt cost
- output tokens per request
- cache-hit coverage
- strongest persisted optimization action
- verified net savings

Unsupported conclusions are explicitly withheld. For example, a billing CSV cannot prove prompt-quality problems or repeated semantic context.

## Progressive privacy

### Level 1 — Usage CSV

Supports cost/model/retry/token/cache/outcome economics without provider credentials.

### Level 2 — Sanitized AI history

Planned support for prompt structure, repeated context, and recurring-workflow diagnosis.

### Level 3 — Authorized workspace

Planned support for cross-tool duplication, buried decisions, and knowledge waste using explicitly authorized sources.

### Level 4 — Production telemetry

Supports the path toward continuous verification, drift detection, and cost per successful outcome.

Provider administrative credentials remain gated until encrypted secret storage, rotation, deletion, tenant isolation, redaction tests, and security review pass.

## Existing optimization loop

The repository already includes:

- exact rational financial arithmetic
- canonical CSV usage ingestion with provenance and duplicate handling
- evidence coverage rules
- deterministic optimization detectors
- benchmark constraints and decisions
- confidence and recommendation ranking
- authenticated tenant-scoped founder workbench
- AI Work MRI
- implementation records and rollback instructions
- append-only savings-state ledger
- post-change verification
- print-optimized reports
- product-event privacy boundary
- PostgreSQL persistence and tenant isolation tests
- responsive Next.js application
- Playwright end-to-end and accessibility checks
- dependency audit and secret scanning in CI
- production container definition


## Self-serve authentication

The public beta supports a Google OAuth path through Better Auth. Google authentication is mapped into the existing Proovance tenant/RBAC model; Better Auth is not the authorization source of truth.

Production setup requires the Google OAuth environment variables documented in `docs/security/google-auth-deployment.md` and an explicit auth-schema migration:

```sh
npm run web:auth:migrate
```

The public calculator, research, methodology, and pricing surfaces remain usable without Google OAuth configuration.

## Run locally

Node.js 24 or newer and PostgreSQL are required.

```sh
cp .env.example .env
npm ci
npm run check
npm run web:build
npm run test:db
npm run web:dev
```

For database tests, provide `DATABASE_URL`.

The repository also contains synthetic fixtures and demos. They must never be represented as customer proof.

## Package surfaces

The root package exposes:

- `./economics`
- `./usage`
- `./ingestion`
- `./coverage`
- `./detectors`
- `./benchmarks`
- `./ranking`
- `./workbench`
- `./ledger`
- `./implementation`
- `./verification`
- `./product-events`
- `./auth`
- `./persistence`
- `./efficiency`

## Evidence and precision rules

- Money and counts cross external boundaries as strings instead of JavaScript floating point values.
- Derived financial values remain exact reduced numerator/denominator pairs until display.
- Display rounding uses round-half-to-even.
- Missing supported values remain `null`.
- Coverage is based on explicit complete intervals in the organization timezone.
- Thirty-day projections require at least seven complete calendar days.
- Findings separate measured facts, inference, recommendation, and what is not claimed.
- Benchmark decisions can be `OPTIMIZE`, `DO_NOT_CHANGE`, or `INSUFFICIENT_EVIDENCE`.
- Negative verified impact remains visible as a cost increase.
- Product events reject prompt, response, credential, secret, uploaded-row, and unrestricted error-message fields.

## Release status

This is not yet being represented as a generally available finished product.

The authoritative ship checklist is:

- `docs/product/v0-release-readiness.md`
- `docs/security/privacy-model.md`

The highest-value remaining V0 work includes sanitized AI-history analysis, automatic hypothesis generation, counterfactual replay for supported workloads, user-facing evidence drill-down, deletion/retention controls, deployment operations, and real design-partner proof.

A CSV-only pilot may ship before connected-source support if its narrower release gates are satisfied and the release commit is fully green.
