# V0 Release Readiness

This file is the ship gate for the sellable V0. A feature is not considered complete because it renders; it is complete only when its evidence, failure, security, and verification behavior are covered.

## Customer promise

A customer can start with a usage CSV, understand where AI spend or work is inefficient, choose a bounded optimization hypothesis, benchmark it against explicit performance constraints, record implementation, and verify post-change net impact.

The product must never present synthetic, projected, benchmarked, or inferred savings as verified customer savings.

## Ship gates

### 1. Ingestion and evidence

- [x] CSV-first onboarding without provider credentials.
- [x] Canonical usage model with provenance, checksums, duplicate handling, and partial-import state.
- [x] Exact decimal money handling.
- [x] Same-currency financial aggregation without silent FX conversion.
- [x] Progressive evidence-depth contract.
- [x] Sanitized AI-history normalized import contract, parser, and non-persistent upload/analyze UI.
- [ ] Authorized workspace connector storage and revocation model.
- [x] Privacy-safe production telemetry event/batch contract and usage normalizer.
- [x] Session-authenticated production telemetry ingestion endpoint with bounded batches and idempotent event deduplication.
- [x] Machine-to-machine telemetry credentials with one-time secrets, hash-only storage, owner UI, rotation, and revocation for unattended agents.

### 2. AI Work MRI

- [x] Observed spend.
- [x] Cost per request.
- [x] Cost per successful outcome only when a complete non-zero denominator exists.
- [x] Model cost concentration.
- [x] Request-level retry cost where attempt evidence exists.
- [x] Output-token intensity.
- [x] Cache-hit coverage.
- [x] Explicit withheld-claim explanations.
- [x] Deterministic prompt-structure diagnosis from sanitized content.
- [x] Exact repeated-context detection without echoing raw prompt text.
- [x] Privacy-safe bounded lexical near-duplicate context detection.
- [ ] Embedding/semantic repeated-context clustering, if required for a later release.
- [x] Exact-repeat recurring-workflow candidates with explicit heuristic limitations.
- [ ] Cross-tool knowledge duplication.

### 3. Optimization loop

- [x] Deterministic findings.
- [x] Benchmark constraints and decisions.
- [x] OPPORTUNITY → TESTED → VERIFIED state separation.
- [x] Implementation record and rollback instructions.
- [x] Comparable baseline/post-change verification.
- [x] Negative verified impact remains visible.
- [x] Cost-only historical counterfactual replay core for comparable workloads.
- [x] Customer-facing historical replay input and result surface with explicit non-verified claim boundary.
- [x] Policy-bounded automatic hypothesis generation from MRI findings.
- [x] Generated guarded implementation package for supported optimization hypotheses.

### 4. Security and privacy

- [x] Tenant-scoped persistence tests.
- [x] Session-derived roles.
- [x] Read-only VIEWER boundary.
- [x] Product-event metadata allowlist.
- [x] Secret scanning in CI.
- [ ] Encrypted connector-secret storage.
- [ ] Connector token rotation/revocation.
- [x] Owner-only organization evidence purge service with explicit confirmation.
- [x] Customer-facing owner-only data export and evidence-purge UI.
- [x] Owner-controlled raw-evidence retention policy with dry-run preview, explicit enforcement, and preserved decision/audit records.
- [ ] Threat-model review before provider admin connectors are enabled.

### 5. UX and trust

- [x] CSV-first progressive privacy onboarding.
- [x] Founder dashboard.
- [x] AI Work MRI evidence surface.
- [x] Optimization Lab.
- [x] Implementation and verification flow.
- [x] Print-optimized report.
- [x] Responsive layouts.
- [x] Accessibility checks in E2E.
- [x] First-run guided synthetic sample with preselected demo labeling and downloadable fixtures.
- [x] Empty/loading/error/recovery states reviewed with safe retry paths and failed-import recovery actions.
- [x] User-facing evidence drill-down for MRI metrics with structured calculation evidence.

### 6. Operations

- [x] Build, unit, database, E2E, audit, secret-scan, and production-container CI gate.
- [x] Production deployment and rollback runbook.
- [x] Automated guarded PostgreSQL backup/restore drill verified in CI with isolated source/restore databases, migration history, sentinel data, and critical-table count comparison.
- [x] Stable safe-error taxonomy that prevents raw internal exception leakage.
- [x] Privacy-safe structured production observability sink for health and telemetry paths.
- [x] Signed timeout-bounded external alert webhook routing from the allowlisted operational event schema.
- [ ] Provider-specific production dashboard/alert destination configured for the deployment.
- [x] PostgreSQL-backed distributed telemetry rate limiting across app instances.
- [x] Server-side upload-size abuse controls for usage, benchmark, sanitized-history, and telemetry evidence.
- [x] Incident severity and response process.
- [ ] Named production incident contact/escalation rotation.

### 7. Commercial readiness

- [x] Clear positioning around AI Efficiency Intelligence rather than generic FinOps.
- [x] Free/low-friction CSV-first value path.
- [ ] One sanitized prospect dataset producing a credible end-to-end MRI. Product now includes an evidence-bounded prospect proof-pack surface and sanitized JSON export; this gate remains open until a genuine prospect dataset is used.
- [ ] One design-partner benchmark with written permission to use results.
- [x] Founding-pilot pricing page.
- [x] Owner-authenticated fixed-price $299 Optimization Audit invoice-request flow with persisted request state; the $999+ sprint remains scoped before invoicing.
- [ ] Terms, privacy notice, and data-processing language reviewed for the launch jurisdiction.
- [x] Founding-pilot support and onboarding playbook.

## V0 release rule

Do not call the product generally available until every unchecked item required by the chosen launch mode is either completed or explicitly excluded from that launch mode.

A limited CSV-only pilot may ship before connector work if:

1. connector UI is not presented as available,
2. no provider admin secret is requested,
3. all customer-facing claims are supported by uploaded evidence,
4. deletion/retention behavior is documented,
5. CI is green on the release commit.
