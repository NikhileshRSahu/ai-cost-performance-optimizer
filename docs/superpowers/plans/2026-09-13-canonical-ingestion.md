# Canonical Usage, CSV Ingestion, Lineage, and Coverage Plan

**Status:** Approved spec continuation; implementation pending  
**Repository:** `NikhileshRSahu/ai-cost-performance-optimizer`  
**Depends on:** merged financial foundation PR #1  
**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md`

## Goal

Build the next independently testable V0 milestone: ingest a conforming customer CSV, preserve provenance and capability gaps, produce canonical usage records, deduplicate safely, and compute trustworthy complete-day coverage without inventing zero usage or prorating ambiguous buckets.

This milestone does **not** assign savings trust states, run benchmarks, enable provider credentials, or claim VERIFIED savings.

## Deliverables

- Canonical usage and source-capability contracts.
- Strict CSV schema and parser for the approved V0 contract.
- Import validation with accepted / duplicate / rejected / warning counts.
- Deterministic source-row fingerprints and source-event-id deduplication.
- Immutable import lineage and evidence metadata.
- Complete-day coverage service using organization timezone.
- Detection of overlapping / unreconciled exports.
- Synthetic deterministic fixtures.
- Unit and integration tests.
- README/demo updates describing limits honestly.

## 1. Canonical Contracts

Create `src/usage/contracts.ts` with strict Zod schemas and inferred types for:

- `DataSource = DEMO | CSV | OPENAI_ADMIN_API | ANTHROPIC_ADMIN_API`
- `Granularity = REQUEST | AGGREGATE_BUCKET`
- `UsageRecord`
- `SourceCapability`
- `ImportRun`
- `ImportIssue`
- `CoverageInterval`
- `CoverageSummary`

Canonical usage fields follow spec sections 8, 10, and 29.3. Missing optional values remain `null`; no missing numeric value becomes zero.

Required CSV fields:

- timestamp_start
- timestamp_end
- provider
- model
- requests
- total_cost
- currency

Optional fields:

- source_event_id
- project
- workspace
- workload
- input_tokens
- cached_input_tokens
- cache_write_tokens
- output_tokens
- output_cost
- tool_calls
- tool_cost
- successes
- failures
- latency_p50_ms
- latency_p95_ms
- granularity
- configuration_id
- operation_id
- attempt_number
- retry_count
- stable_prefix_hash
- stable_prefix_tokens
- cache_eligible_input_tokens

Server-owned organization_id and is_demo must never be accepted from CSV.

## 2. CSV Boundary

Create `src/ingestion/csv.ts`.

Rules:

- UTF-8 only.
- Maximum 10 MiB.
- Maximum 50,000 data rows.
- Maximum decoded cell length 64 KiB.
- Reject duplicate headers.
- Reject unsupported columns.
- Strict ISO-8601 timestamps with offset or Z.
- end > start.
- Money uses the exact decimal contract already implemented.
- Count/token fields are canonical non-negative integer strings.
- successes + failures <= requests when both are provided.
- attempt_number >= 1.
- retry_count >= 0.
- Default granularity is AGGREGATE_BUCKET; never infer REQUEST from requests=1.
- Formula-leading cells are escaped only in generated downloadable artifacts, not mutated in canonical evidence.
- A failed row is never partially converted to zero-valued data.

Use a small, maintained CSV parser dependency only if needed; otherwise implement a focused RFC-4180-compatible parser with explicit tests. Do not use spreadsheets or execute formulas.

## 3. Normalization and Fingerprints

Create `src/usage/normalize.ts` and `src/usage/fingerprint.ts`.

- Canonicalize validated fields without losing source strings needed for evidence.
- Compute SHA-256 deterministic canonical-row fingerprint over an explicit ordered serialization.
- Primary dedupe key:
  - `(organization, source, source_event_id)` when source_event_id exists.
  - otherwise canonical-row fingerprint.
- Exact duplicates are idempotently skipped.
- Conflicting duplicate keys reject only the affected rows and create explicit issues.
- Repeated attempts sharing operation_id are **not** duplicates.
- Do not fabricate request-level joins from aggregate buckets.

## 4. Lineage

Create `src/ingestion/import.ts`.

Each import records:

- immutable checksum of uploaded bytes;
- source;
- received time supplied by caller;
- requested/effective interval;
- accepted/skipped/rejected/warning counts;
- row-level source line number;
- deterministic row fingerprint;
- validation issues;
- source capability metadata;
- partial-import status.

Analysis is blocked when all rows fail. Partial success is explicit.

## 5. Coverage

Create `src/coverage/coverage.ts`.

Coverage rules from spec section 29.2:

- Coverage is the union of explicitly complete source intervals.
- Evaluate calendar days in organization timezone.
- Missing intervals are unknown, never zero-use days.
- Complete zero-use days count only with explicit coverage evidence.
- Overlaps count once.
- Aggregate buckets crossing selected boundaries are excluded unless exact subdivision exists; no time proration.
- Monthly projection eligibility requires >=7 complete calendar days.
- Export a summary containing complete day identifiers, incomplete intervals, exclusions, and eligibleForThirtyDayProjection.

Use `Intl.DateTimeFormat`/Temporal-compatible logic available in Node 24; no floating-point financial operations.

## 6. Overlap and Reconciliation Safety

Create `src/usage/overlap.ts`.

- Flag request/aggregate overlap for the same attributable scope.
- Flag overlapping exports that cannot be deterministically reconciled.
- Exclude unresolved overlaps from combined financial totals.
- Emit evidence explaining which records were excluded and why.

## 7. Fixtures

Add `fixtures/demo/`:

- valid-usage.csv
- partial-invalid.csv
- duplicates.csv
- overlapping-exports.csv
- coverage-gaps.csv

Fixtures are synthetic, deterministic, version-controlled, and visibly labeled as demo data.

## 8. Tests

Add focused tests covering:

- required/optional headers;
- duplicate/unsupported headers;
- UTF-8, size, row, and cell limits;
- timestamp boundaries;
- money/count validation;
- missing optional values remain null;
- default granularity;
- exact duplicate skip;
- conflicting duplicate rejection;
- repeated operation attempts retained;
- fingerprint stability;
- import checksum stability;
- partial import counts;
- all-invalid import blocks analysis;
- coverage union;
- timezone calendar-day boundaries;
- DST boundary behavior where applicable;
- missing-day behavior;
- explicit zero-use complete days;
- cross-boundary aggregate exclusion;
- overlap exclusion;
- seven-day projection eligibility.

Integration golden path:

`CSV bytes -> parse -> validate -> normalize -> deduplicate -> lineage -> coverage summary`

No paid API calls and no network calls in tests.

## 9. Public API

Add `src/usage/index.ts`, `src/ingestion/index.ts`, and `src/coverage/index.ts`.

Update the package root exports to expose the new modules while preserving existing economics exports.

## 10. CI and Acceptance

Existing CI remains the gate:

- format
- lint
- strict typecheck
- all tests
- build
- npm audit high
- Gitleaks

Acceptance for this milestone:

1. A valid synthetic CSV produces canonical records and traceable lineage.
2. Invalid rows are rejected without silent coercion.
3. Duplicate behavior is deterministic and safe.
4. Complete-day coverage is trustworthy enough to gate 30-day projection eligibility.
5. Unresolved overlap cannot inflate totals.
6. No module can claim OPPORTUNITY, TESTED, or VERIFIED from ingestion alone.
7. All tests and CI pass.

## Next Milestone

After this milestone passes, implement deterministic opportunity detectors plus benchmark ingestion, constraint evaluation, confidence, and recommendation ranking. Persistence/authentication/UI/reporting remain a later workbench milestone. Provider adapters remain gated until the credential security gate and owner approval pass.
