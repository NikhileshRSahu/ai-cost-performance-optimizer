# CSV Ingestion and Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn bounded CSV uploads into immutable canonical records, explain rejected/duplicate rows, and calculate defensible observed and projected spend from explicit coverage evidence.

**Architecture:** Three server-side TypeScript modules: normalization, streaming CSV ingestion, and coverage assessment. They consume the exact arithmetic foundation and return immutable records for a future transactional persistence adapter. No HTTP endpoint, authentication substitute, database persistence, detector, benchmark, or VERIFIED-state assignment is introduced here.

**Tech Stack:** Existing strict TypeScript/Node 24/Zod/Vitest toolchain, Node crypto, pinned `csv-parse`, and pinned `@js-temporal/polyfill` for offset timestamps and timezone-aware calendar boundaries.

**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md`, particularly sections 8, 10, 11, 20, 21, 24 and 29.

## Global Constraints

- Missing fields remain `null` with a capability reason. They are never converted silently to zero.
- Money is a non-negative decimal string with at most 12 fractional digits.
- JavaScript floating-point arithmetic is forbidden for financial results.
- Exact duplicates are idempotently skipped; conflicting duplicates reject the affected row.
- Mixed currencies are retained but may not be aggregated without an explicit stored FX rate and rate date.
- CSV limits are 10 MiB and 50,000 data rows per import, with UTF-8 encoding and 64 KiB maximum decoded cell length.
- Every demo screen/report must say `Synthetic demo data — not a customer result`.
- All intervals are half-open [start, end). End must be strictly later than start.
- Context organization/source/demo identity is supplied by a trusted application service, never CSV columns. This library validates context shape; it does not authenticate a caller.
- History records and import receipts are trusted internal canonical objects; a future HTTP service must not accept them from a client as authority.
- Imports are staged until complete structural parsing succeeds. Fatal syntax/encoding/limit/source-read errors yield no accepted records and never mutate history.
- Derived totals and projections stay as exact rational pairs, even when larger than source-money limits. Do not route them through a display decimal or bounded source-money schema.

## Milestone and Publication Boundary

This implements canonical CSV records, metadata/lineage, deduplication, safe diagnostic export, calendar coverage, and a runnable synthetic import demo. Detectors/benchmark decisions, storage/authorization, UI/reports and the actual verification state machine remain subsequent milestones under the approved spec. Imported files are not secretly retained or uploaded anywhere by these pure modules.

PR 1 was merged with expected-head protection as GitHub commit `b452d2830ea6005bc014e0f82b7a4a48978255e0`. Its tree matches local `bbaeda2`. Work is isolated in `/workspace/scratch/3e4d15147ac5/ai-optimizer-ingestion` on `codex/csv-ingestion`. GitHub API publication must preserve the real remote ancestry and match the local tree hash. Open a new PR after review and verification; no automatic merge of that new PR is part of this plan.

## Interfaces and File Map

| Module | Files | Responsibility |
|---|---|---|
| normalization | `src/ingestion/contracts.ts`, `src/ingestion/normalize.ts` | Validate CSV cells, canonicalize values, fingerprint rows, expose missing-field reasons |
| import | `src/ingestion/csv.ts`, `src/ingestion/diagnostics.ts`, `src/ingestion/index.ts` | Bounded streaming parse, immutable receipt, duplicate checks, escaped error CSV |
| coverage | `src/coverage/contracts.ts`, `src/coverage/assess.ts`, `src/coverage/index.ts` | Scope selection, explicit coverage attestations, timezone days, overlap exclusions, exact totals |
| consumer | `src/index.ts`, `examples/import-demo.ts`, `fixtures/usage-demo.csv`, `README.md` | Root exports, deterministic demonstration, honest usage and remaining work |

## Task 1: Canonical Usage and Lineage

**Files:** Create normalization files above and `tests/ingestion/normalize.test.ts`; update package files only to pin Temporal.

**Consumes:** Exact exports from `src/economics/exact.ts`.

**Produces:** Export these types from contracts and functions from normalize. Every nested returned object/array is frozen.

```ts
export type Source = 'CSV' | 'DEMO';
export type NormalizationContext = Readonly<{ organizationId: string; source: Source }>;
export type Provenance = Readonly<{ importId: string; rowNumber: number; checksum: string }>;
export type UsageRecord = Readonly<{
  recordId: string; fingerprint: string;
  organizationId: string; source: Source; isDemo: boolean;
  data: CanonicalUsageData;
  missingFields: Readonly<Partial<Record<keyof CanonicalUsageData, 'NOT_PROVIDED'>>>;
  tokenSemantics: 'UNKNOWN';
  provenance: Provenance;
}>;
export function normalizeUsageRow(row: unknown, context: NormalizationContext, provenance: Provenance): UsageRecord;
export function canonicalInstant(value: string): string;
export const CSV_REQUIRED_COLUMNS: readonly string[];
export const CSV_OPTIONAL_COLUMNS: readonly string[];
```

`CanonicalUsageData` has exactly the CSV field names below. Required fields and `granularity` are strings, and every other field is `string | null`. Declare explicit typed properties, not an unrestricted index signature.

- Required: timestamp_start, timestamp_end, provider, model, requests, total_cost, currency.
- Optional text: source_event_id, project, workspace, workload, configuration_id, stable_prefix_hash.
- Optional counts: input_tokens, cached_input_tokens, cache_write_tokens, output_tokens, tool_calls, successes, failures, attempt_number, retry_count, stable_prefix_tokens, cache_eligible_input_tokens.
- Optional decimal fields: tool_cost, output_cost, latency_p50_ms, latency_p95_ms.
- Optional enum: granularity = REQUEST or AGGREGATE_BUCKET; absent/blank means AGGREGATE_BUCKET, never inferred from requests = 1.
- Optional text also includes operation_id.

Blank optional cells become null with NOT_PROVIDED; required blanks reject. Text fields are trimmed, nonempty when present, at most 256 characters, and exclude control characters. Provider is lowercased; model and other identifiers retain case. Money and latency accept unsigned decimal text with at most 26 integer digits and 12 fractional digits; normalize redundant integer leading zeros, preserve fractional scale in the record. Counts accept at most 26 digits and canonicalize via BigInt.toString(); attempt_number must be at least 1. A missing attempt number remains null.

Use Zod at the row and context/provenance boundaries. Reject unknown row keys, non-string cells, non-ISO currencies, invalid timestamps, non-increasing windows, REQUEST rows where requests is not 1, known successes/failures individually or together exceeding requests, and p50 > p95 when both are known. Do not infer absent success/failure or token values. Do not infer cache eligibility or overlapping token semantics. For currency, use the existing runtime-supported ISO currency rule from economics.

`canonicalInstant` accepts only a four-digit-year ISO timestamp with seconds, optional 1–9 fractional digits, and Z or an explicit HH:mm offset; use Temporal.Instant.from to reject calendar errors and retain nanoseconds. Return the normalized UTC instant string. Do not pass timestamps through Date, which would truncate precision. Provenance checksum is 64 lowercase hex characters; rowNumber is a positive logical data-row index (not a physical line number), max 50,000. IDs in trusted context/provenance follow the same nonempty bounded text validation.

Fingerprint the sorted canonical data object with SHA-256, normalizing numeric values for comparison (1.0 and 1.00 are equal) while preserving the original validated scale in `data`. Include all canonical data fields, including explicit/default granularity and nullable dimensions. Do not include filename, import ID, received time, row number, or checksum in the fingerprint. Derive recordId as SHA-256 of JSON.stringify([organizationId, source, source_event_id === null ? 'fingerprint' : 'event', source_event_id ?? fingerprint]). This separates tenants and demo identity and makes stable event conflicts detectable.

- [ ] Write failing tests first, including this independent baseline:

```ts
const row = { timestamp_start: '2026-09-01T00:00:00Z', timestamp_end: '2026-09-02T00:00:00Z', provider: 'OpenAI', model: 'demo-model', requests: '1', total_cost: '0.100000000001', currency: 'USD' };
const r = normalizeUsageRow(row, { organizationId: 'org-a', source: 'CSV' }, { importId: 'import-1', rowNumber: 1, checksum: 'a'.repeat(64) });
expect(r.data.granularity).toBe('AGGREGATE_BUCKET');
expect(r.data.successes).toBeNull();
expect(r.missingFields.successes).toBe('NOT_PROVIDED');
expect(r.data.total_cost).toBe('0.100000000001');
expect(r.isDemo).toBe(false);
```

Add tests for nanosecond preservation, equal instants with different offsets, impossible calendar dates, missing offsets, zero/reversed windows, counts above Number.MAX_SAFE_INTEGER, decimal/count bounds, unknown/forged tenant/demo columns, REQUEST validation, nullable count consistency, latency ordering, numeric-equivalent fingerprints, changed-data event conflicts (same recordId, different fingerprint), distinct tenant/source IDs, and deep immutability. New tests must name the real broken behavior they catch.

- [ ] Run `npm test -- tests/ingestion/normalize.test.ts` and capture the expected RED failure before implementation.
- [ ] Implement using strict schemas and canonical sorted data; use crypto and Temporal rather than custom hashing/calendar code. Install the stable compatible Temporal package with `npm install --save-exact @js-temporal/polyfill`; commit its lockfile changes. A normalization helper for exact comparable decimal text may use `formatDecimal(parseDecimal(canonicalInput), 12)` and trim only fractional trailing zeros, never integer zeros.
- [ ] Run focused tests, then `npm run check`; commit `feat: normalize usage records with immutable lineage`. Report RED/GREEN commands and results in ignored task workspace only.

## Task 2: Bounded CSV Import and Idempotency

**Files:** Create import files above and `tests/ingestion/csv.test.ts`; pin csv-parse in package files.

**Consumes:** Task 1 types, allowed columns, normalization and recordId/fingerprint rules.

**Produces:** Types exported from `src/ingestion/csv.ts`, reexported by `src/ingestion/index.ts` together with Task 1 exports and diagnostics.

```ts
export type ImportContext = NormalizationContext & Readonly<{
  importId: string; receivedAt: string; fileName: string; mimeType: string;
}>;
export type ImportStatus = 'READY' | 'PARTIAL_DATA' | 'ZERO_USAGE' | 'NO_DATA' | 'VALIDATION_ERROR';
export type RowError = Readonly<{ rowNumber: number; code: 'INVALID_ROW' | 'COLUMN_COUNT' | 'CONFLICTING_DUPLICATE'; column: string; message: string }>;
export type ImportRun = Readonly<{
  importId: string; organizationId: string; source: Source; isDemo: boolean;
  receivedAt: string; fileName: string; checksum: string | null;
  status: ImportStatus; rowsRead: number; accepted: number; skipped: number;
  rejected: number; warnings: readonly string[];
  recordIds: readonly string[]; errors: readonly RowError[];
  fileError: Readonly<{ code: string; message: string }> | null;
}>;
export type ImportResult = Readonly<{ run: ImportRun; records: readonly UsageRecord[] }>;
export async function importUsageCsv(chunks: AsyncIterable<Uint8Array>, context: ImportContext, history?: readonly UsageRecord[]): Promise<ImportResult>;
export function escapeCsvCell(value: string): string;
export function exportImportErrors(run: ImportRun): string;
```

Context is validated; malformed trusted org/source/import identity throws a Zod error rather than fabricating an import identity. Invalid filename/MIME yields a typed fileError result. Accept filenames ending .csv case-insensitively, max 255 characters, and media types text/csv or application/csv (case-insensitive, optional charset parameter). Never read a supplied filesystem path; fileName is metadata only.

Parse with csv-parse's stream/async-iterator API, not split(','). Install a stable exact package version. Count original raw bytes and SHA-256 them while decoding UTF-8 incrementally with fatal decoding. Support BOM, LF/CRLF, quoted commas/newlines/escaped quotes, and split multibyte chunk boundaries. Keep strict quotes; skip truly empty lines. Validate headers once: all required columns, no duplicates, no unsupported names. Retain rows with wrong cell count as rejected COLUMN_COUNT rows; do not silently drop cells. Parser-level malformed quotes or unreadable streams are fatal. Never echo raw upstream errors or row values in diagnostics.

Limits are enforced during consumption, before admitting records: 10*1024*1024 raw bytes; 50,000 logical data records; 64*1024 UTF-8 bytes per decoded cell. Header cells count toward the cell limit. Use a parser record-buffer bound as well. Stage bounded parsed rows; once structural parsing completes, finalize the full-file checksum, normalize each row with that checksum, and deduplicate. Fatal errors return accepted/skipped/rejected = 0, recordIds/records/errors empty, VALIDATION_ERROR and a safe fileError category (FILE_TYPE, HEADER_ERROR, FILE_LIMIT, ROW_LIMIT, CELL_LIMIT, INVALID_UTF8, CSV_SYNTAX, SOURCE_READ_ERROR). checksum is null when a full successful source read is not established; never label a partial hash a full-file checksum.

Index existing history by recordId only for the selected organization and source. Duplicate fingerprint matches skip; the same stable event ID with changed fingerprint rejects that incoming row. Apply the same logic within the upload. Never mutate history, and preserve the original record's provenance on skips. run.recordIds contains distinct valid accepted/skipped IDs; result.records contains only newly accepted records. Mixed currencies produce the stable warning MIXED_CURRENCIES and remain separate; no total is calculated here.

Status: no data rows -> NO_DATA; rows but all rejected -> VALIDATION_ERROR; any valid rows plus rejected rows -> PARTIAL_DATA; otherwise ZERO_USAGE if every valid row has zero requests and all present activity counts zero (input_tokens, cached_input_tokens, cache_write_tokens, output_tokens, tool_calls, successes, failures, retry_count; static prefix lengths and attempt numbers are not activity totals); otherwise READY. Duplicate-only uploads retain the valid-row status. Optional absent columns do not by themselves make a valid minimal spend export partial. Counts must reconcile accepted + skipped + rejected = rowsRead after structurally successful parsing. Warnings are deterministic, and all output objects/arrays are deeply frozen.

`escapeCsvCell` always applies standard CSV quoting/quote doubling and prefixes an apostrophe for cells beginning (after optional spaces) with =, +, -, @, tab, CR or LF. Escape before CSV quoting. Error export has fixed headers row,code,column,message and uses this helper for every cell; do not export original uploaded rows.

- [ ] Write failing tests with real async byte generators and real csv-parse, never mocked parsing. Golden upload: two valid rows cost 0.1 and 0.2; both accepted, exact raw-byte checksum matches an independent crypto hash, no input mutation, lineage points to logical rows 1 and 2. Reimport with history skips 2 and accepts 0; another org accepts both; changed data under a stable event ID rejects the changed row.
- [ ] Add named tests for same-file duplicates/conflicts, partial rows, all-invalid/empty/zero-usage statuses, mixed currencies, bad/duplicate/unknown headers including org/demo injection, quoted values, BOM and multibyte chunk splitting, invalid calendar row, ragged columns, malformed quotes after a valid row rolling back all output, stream errors without leaking raw messages, byte/row/cell limits, and formula-safe diagnostic export. Test actual limits with bounded generated inputs; no inflated repetition or benchmarking suite.
- [ ] Run `npm test -- tests/ingestion/csv.test.ts` and record RED.
- [ ] Implement staged parsing and maps. Core duplicate decision:

```ts
const existing = seen.get(record.recordId);
if (!existing) { seen.set(record.recordId, record); acceptedRecords.push(record); }
else if (existing.fingerprint === record.fingerprint) { skipped += 1; }
else { errors.push({ rowNumber, code: 'CONFLICTING_DUPLICATE', column: 'source_event_id', message: 'Existing source event has different values' }); }
```

Use stable safe error text and bounded logical row indices. This function returns a transaction candidate; a future storage adapter must atomically store records, receipt, and unique keys together. Do not claim process-memory results are database persistence or concurrency-safe transactions.

- [ ] Run focused tests, `npm run check`, and `npm audit --audit-level=high`; commit `feat: import bounded CSV usage with idempotent lineage`.

## Task 3: Calendar Coverage, Safe Spend Totals, and Import Demo

**Files:** Create coverage and consumer files in the map, `tests/coverage/assess.test.ts`, `tests/ingestion/journey.test.ts`; update package exports/scripts and README. Existing economics root exports must remain compatible.

**Consumes:** Task 1 UsageRecord and exact operations; Task 2 ImportRun/ImportResult.

**Produces:** Export these types/interfaces; input scope and attestations are Zod-validated external data, while records/receipts are trusted internal canonical values.

```ts
export type CoverageScope = Readonly<{ organizationId: string; workload: string | null; currency: string; isDemo: boolean; timeZone: string; start: string; end: string }>;
export type CoverageAttestation = Readonly<{ importId: string; checksum: string; organizationId: string; workload: string | null; currency: string; isDemo: boolean; start: string; end: string }>;
export type CoverageResult = Readonly<{
  status: 'READY' | 'PARTIAL_DATA' | 'NO_DATA' | 'ZERO_USAGE';
  scope: CoverageScope; coveredDays: number; completeDays: readonly string[];
  includedRecordIds: readonly string[]; comparableRecordIds: readonly string[];
  excluded: readonly Readonly<{ recordId: string; reason: string }>[];
  issues: readonly string[];
  observedCost: Readonly<{ numerator: string; denominator: string }> | null;
  comparableCost: Readonly<{ numerator: string; denominator: string }> | null;
  projectedThirtyDayCost: Readonly<{ numerator: string; denominator: string }> | null;
  projectionUnavailableReason: 'INSUFFICIENT_COVERAGE' | 'NO_COMPARABLE_DATA' | null;
  formulaVersion: 'coverage-v1';
}>;
export function assessCoverage(input: { scope: unknown; attestations: unknown; records: readonly UsageRecord[]; imports: readonly ImportRun[] }): CoverageResult;
```

Select the exact organization, workload (including null), currency, and demo flag. Foreign-scope records are excluded with OUTSIDE_SCOPE and never affect sums or status. Entirely out-of-window rows likewise do not create a financial exclusion or block projection. Record intervals straddling the selected window are excluded with WINDOW_BOUNDARY; intervals wholly outside have OUTSIDE_WINDOW. Do not prorate aggregate costs. Deduplicate identical recordId/fingerprint inputs defensively; conflicting fingerprints under one ID exclude all instances as CONFLICTING_ID. Match output references to canonical records and source receipt IDs. Missing/mismatched receipt linkage excludes the record with MISSING_LINEAGE; receipt linkage uses run.recordIds and organization/source/demo identity. PARTIAL_DATA receipts allow explicitly partial observed spend but may never supply complete coverage.

Prevent uncertain request/aggregate double counting. Group by provider/model/workload/currency and by project/workspace/configuration dimensions only where all group records provide those dimensions; a missing dimension cannot prove two exports disjoint. Within each attribution group, sort intervals and form overlapping connected components (touching endpoints do not overlap). A component with more than one record and any AGGREGATE_BUCKET is wholly excluded as AMBIGUOUS_OVERLAP; REQUEST-only concurrent components remain valid. This conservative policy can exclude some individually separable requests, and diagnostics/README must disclose it. Use a sort/sweep, not an all-pairs scan of 50,000 records. Aggregate duplicate records must be deduplicated before overlap detection.

Attestations are explicit operator/source completeness declarations, not evidence inferred from first/last timestamps. Validate scope equality, positive interval, checksum format, and a referenced matching complete import receipt (READY or ZERO_USAGE, rejected = 0, no fileError, checksum equal). Ignore unverifiable or out-of-scope declarations with a stable issue code; never silently count them. Match the declared scope exactly. The future authenticated service is responsible for who may make an attestation; this milestone does not independently verify a customer's declaration.

Union and clip valid attested intervals to the selected window. Enumerate timezone calendar dates with Temporal.PlainDate and toZonedDateTime, using the actual start of each local day and the next calendar day, not 24-hour millisecond increments. Count only complete local days fully inside both the window and interval union. DST 23/25-hour days count once; skip nonexistent dates whose start maps to another date. Cap selection at 3,660 calendar dates and input records/attestations at 50,000; reject larger requests explicitly.

Observed cost sums included safe records even without complete-day evidence. If no records survive, observedCost is null, not zero. Comparable cost sums only safe records wholly contained in the union of complete days. Never assume that excluded overlap/boundary/missing-lineage records cost zero: any such financial exclusion in scope blocks the monthly projection (NO_COMPARABLE_DATA) and yields PARTIAL_DATA. A partial source receipt similarly blocks projection. Missing attestations yield INSUFFICIENT_COVERAGE; explicitly attested empty days can count, but at least one comparable canonical record must exist before publishing a cost projection. Valid explicit zero-usage records permit a genuine zero result.

For at least seven complete days with comparable records and no financial exclusions, calculate projected cost as comparableCost / coveredDays * 30 using rational helpers directly. Otherwise return null and the precise reason. Under seven days takes precedence as INSUFFICIENT_COVERAGE. Status is NO_DATA when no rows match the selected scope and intersect its window; PARTIAL_DATA for financial exclusions intersecting the selected scope/window, partial receipts, incomplete days or rejected declarations; ZERO_USAGE only for valid explicit zero-activity records; otherwise READY. Every result is deeply frozen and contains no savings or VERIFIED claim.

- [ ] Write failing tests for the hand-derived seven-day fixture: seven adjacent daily buckets, each 100 requests and 10.00 USD, plus a matching complete attestation -> observedCost 70/1, comparableCost 70/1, coveredDays 7, projected cost 300/1. With six days, projection is null. With no attestations, observed spend remains 70 but monthly projection is unavailable.
- [ ] Cover interval-union duplicates, gaps, source-checksum mismatch, partial receipts, tenant/currency/workload/demo isolation, unknown lineage, boundary-straddling buckets, aggregate overlap exclusions without fake zero totals, concurrent REQUEST records, same-ID duplication/conflict, zero usage, empty inputs, out-of-window records, invalid dates/timezones/ranges, and DST day boundaries. Required DST fixtures: America/New_York 2026-03-08 (23 hours) and 2026-11-01 (25 hours) each count as exactly one complete day.
- [ ] Run `npm test -- tests/coverage/assess.test.ts tests/ingestion/journey.test.ts` and capture RED before implementation.
- [ ] Implement normalized interval union and attribution sweep helpers in focused private functions. A complete-day boundary is computed as follows:

```ts
const day = Temporal.PlainDate.from('2026-03-08');
const start = day.toZonedDateTime('America/New_York').toInstant();
const end = day.add({ days: 1 }).toZonedDateTime('America/New_York').toInstant();
// Compare epochNanoseconds; do not substitute 24 hours for a local day.
```

- [ ] Add `fixtures/usage-demo.csv` with those seven deterministic UTC daily rows from 2026-09-01 through 2026-09-08. `examples/import-demo.ts` streams that file, imports as source DEMO, builds a clearly declared synthetic completeness attestation using the returned checksum, and prints accepted/duplicate/rejected counts, missing-field limitations, 70 USD observed spend, 7 covered days, and a labeled 300 USD projected 30-day cost. It must print `Synthetic demo data — not a customer result` and `Observed/projected spend only — no optimization or verified savings claim`. A second import demonstrates seven idempotent skips. Use `npm run demo:import` with the existing compiled demo tsconfig and typecheck/lint coverage.
- [ ] Add `src/index.ts` reexports for economics, ingestion, and coverage; point root package exports to dist/index.js. Preserve `npm run demo` and all existing economics imports. README documents both demos, exact CSV headers and limits, how to inspect errors, source-context authority, in-memory staging/transaction-adapter boundary, attestation limitations, conservative overlap exclusions, and the next detector/benchmark milestone. Use official reference links https://csv.js.org/parse/ and https://tc39.es/proposal-temporal/docs/.
- [ ] Run `npm run check`, both demos, `npm audit --audit-level=high`, and a package-root import smoke check. Commit `feat: assess covered spend and demonstrate CSV import`.

## Completion and Review

- [ ] Review each task against the plan and its consuming interfaces; fix material findings with focused regression tests.
- [ ] Complete one whole-branch review and final checks; persist milestone status so the next session does not repeat completed work.
- [ ] Publish an exact matching Git tree on codex/csv-ingestion, verify the commit, open a PR, and verify latest-head CI including Gitleaks before reporting success.
