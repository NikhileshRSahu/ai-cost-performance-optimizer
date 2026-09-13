# AI Cost & Performance Optimizer

The project is building an evidence-first AI cost optimizer around one promise:

> Find and test ways to reduce AI spend without dropping below the customer's required performance.

The implemented core now covers exact financial arithmetic, canonical CSV usage ingestion, lineage and coverage, deterministic optimization findings, benchmark decisions, confidence/ranking, session-derived workbench authorization, implementation tracking, an append-only savings-state ledger, post-change verification, and a safe product-event boundary.

The trust path is explicit:

`OPPORTUNITY → TESTED → VERIFIED`

A cheaper candidate does not become VERIFIED from a benchmark alone. Verification requires an implementation record, comparable baseline and post-change windows, at least seven complete days in each window, post-change performance evidence, stable attribution/unit definitions, and exact net-impact calculation. Negative verified impact remains visible as a cost increase.

## Run locally

Node.js 24 or newer is required.

```sh
npm ci
npm run check
npm run demo
```

The arithmetic demo is synthetic and shows the exact counterfactual result `7/20` plus its rounded display value, `0.35 USD`. It is not a customer result.

## Evidence and precision rules

- Money and counts cross external boundaries as strings rather than JavaScript floating-point values.
- Source money is validated canonical decimal text with at most 26 integer digits and 12 fractional digits.
- Derived financial values remain reduced exact numerator/denominator pairs. Rounding is a display operation only and uses round-half-to-even.
- Missing supported values remain `null`; they are never silently converted to zero.
- Canonical imports preserve checksums, row fingerprints, source capability metadata, validation issues, duplicate handling, and partial-import state.
- Coverage is based on explicitly complete intervals in the organization's timezone. Missing time is unknown, not zero usage.
- Thirty-day projection requires at least seven complete calendar days.
- Deterministic findings separate measured facts, inference, recommendation, and what is not yet claimed.
- Benchmark decisions can be `OPTIMIZE`, `DO_NOT_CHANGE`, or `INSUFFICIENT_EVIDENCE`; configured performance constraints use unrounded measurements.
- Savings-state history is append-only. Evidence corrections create invalidation events instead of rewriting history.
- OWNER, OPERATOR, and VIEWER authorization is derived from authenticated-session membership. VIEWER is read-only; OWNER alone may manage membership and credential references.
- Product events accept only allowlisted scalar metadata and reject prompt, response, credential, secret, header/body, uploaded-row, and unrestricted error-message fields.

## Current package surfaces

The package root and focused exports expose:

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

The locked tools include Zod 4.6.4 and Vitest 5.0.0; see the authoritative [Zod API](https://zod.dev/api) and [Vitest guide](https://vitest.dev/guide/).

## Remaining V0 work

This repository is **not yet the finished sellable V0**. The persistence foundation now includes PostgreSQL/Drizzle storage, tenant-scoped repositories, a trusted passwordless identity-to-session adapter, append-only evidence persistence, import idempotency, and resumable job state. The next bounded milestone is the authenticated founder dashboard, Optimization Lab, print-optimized report, and end-to-end/accessibility/security validation.

Provider connectors remain deliberately gated. OpenAI and Anthropic administrative credentials must not be enabled until encrypted secret storage, redaction, tenant-isolation tests, credential deletion/rotation, security review, and explicit product-owner approval all pass. Commercial validation with real prospects also remains a separate gate; synthetic fixtures must never be presented as customer proof.
