# V0 Release Readiness

This file is the ship gate for the sellable V0. A feature is not considered complete because it renders; it is complete only when its evidence, failure, security, and verification behavior are covered.

## Customer promise

A customer can start with a usage CSV, understand where AI spend or work is inefficient, choose a bounded optimization hypothesis, benchmark it against explicit performance constraints, record implementation, and verify post-change net impact.

The product must never present synthetic, projected, benchmarked, or inferred savings as verified customer savings.

## Chosen launch mode: CSV-first beta + limited provider Admin-API beta

The primary launch path remains the **Evalomics CSV-first pilot / public beta** defined in `docs/product/csv-pilot-release-profile.md`.

A limited OpenAI/Anthropic **provider Admin-API beta** is also enabled for OWNER users. It reads only provider usage/cost reporting endpoints, does not request prompts or responses, and must preserve the same evidence-state boundaries as CSV. Provider evidence has lower capability when request-level quality, retries, latency, or outcome fields are unavailable.

Workspace/content connectors, cross-tool knowledge duplication, semantic embedding clustering, automatic production mutation, and general-availability connector claims remain excluded.

The software surface includes public trust pages for Privacy, Security, Terms, Methodology, and Research. The legal pages are intentionally labeled as prelaunch operational drafts and do **not** close the external legal-review gate.

## Ship gates

### 1. Ingestion and evidence

- [x] CSV-first onboarding without provider credentials.
- [x] Canonical usage model with provenance, checksums, duplicate handling, and partial-import state.
- [x] Exact decimal money handling.
- [x] Same-currency financial aggregation without silent FX conversion.
- [x] Progressive evidence-depth contract.
- [x] Sanitized AI-history normalized import contract, parser, and non-persistent upload/analyze UI.
- [x] OpenAI/Anthropic provider-admin connection storage, encrypted credential handling, resync, and revocation for the limited connector beta.
- [ ] Authorized workspace/content connector storage and revocation model. **Still excluded; this is separate from provider usage/cost Admin APIs.**
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
- [ ] Embedding/semantic repeated-context clustering. **Deferred beyond CSV-first pilot.**
- [x] Exact-repeat recurring-workflow candidates with explicit heuristic limitations.
- [ ] Cross-tool knowledge duplication. **Excluded from CSV-first pilot.**

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
- [x] Encrypted provider-admin credential storage using AES-256-GCM with a dedicated key when configured or a domain-separated HKDF key derived from the deployment auth secret.
- [x] Provider credential revocation/replacement path. Disconnect clears stored ciphertext; reconnect replaces the credential.
- [x] Owner-only organization evidence purge service with explicit confirmation.
- [x] Customer-facing owner-only data export and evidence-purge UI.
- [x] Owner-controlled raw-evidence retention policy with dry-run preview, explicit enforcement, and preserved decision/audit records.
- [x] Internal provider-admin connector threat-model review for the limited beta. See `docs/security/provider-admin-connector-threat-model.md`.
- [ ] Independent/external security assessment of provider-admin connector handling. **Required before describing connector infrastructure as generally available or enterprise-audited.**

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
- [ ] Provider-specific production dashboard/alert destination configured for the deployment. **Production deployment gate, not a local software-completeness claim.**
- [x] PostgreSQL-backed distributed telemetry rate limiting across app instances.
- [x] Server-side upload-size abuse controls for usage, benchmark, sanitized-history, and telemetry evidence.
- [x] Incident severity and response process.
- [ ] Named production incident contact/escalation rotation. **Production operations gate; must be set to a monitored real contact at deployment.**

### 7. Commercial readiness

- [x] Clear positioning around AI Efficiency Intelligence rather than generic FinOps.
- [x] Free/low-friction CSV-first value path.
- [ ] One sanitized prospect dataset producing a credible end-to-end MRI. Product now includes an evidence-bounded prospect proof-pack surface, sanitized JSON export, and a separate real public measured-cost research replay; this gate remains open until a genuine prospect dataset is used.
- [ ] One design-partner benchmark with written permission to use results. Product now includes an OWNER-only written-permission registry with scope and revocation tracking; this gate remains open until a real partner grants permission.
- [x] Founding-pilot pricing page.
- [x] Owner-authenticated fixed-price $299 Optimization Audit invoice-request flow with persisted request state; the $999+ sprint remains scoped before invoicing.
- [ ] Terms, privacy notice, and data-processing language reviewed for the launch jurisdiction. Public prelaunch Privacy/Terms/Security pages exist, but external jurisdiction review remains required.
- [x] Founding-pilot support and onboarding playbook.

## V0 release rule

Do not call the product generally available until every unchecked item required by the chosen launch mode is either completed or explicitly excluded from that launch mode.

The CSV path remains independently usable without provider credentials.

The limited provider Admin-API beta may remain enabled when:

1. only OWNER users can create/read/revoke credential references,
2. credentials are encrypted at rest and never returned to the browser,
3. provider calls are restricted to the supported usage/cost reporting adapters,
4. prompts/responses are not requested or persisted,
5. failed/incomplete syncs cannot become READY dashboard evidence,
6. disconnect clears the stored credential ciphertext,
7. provider-derived claims remain bounded by source capability,
8. CI/build gates are green on the release commit.

Do not describe provider connectors as generally available or enterprise-audited while the independent security-assessment gate remains open.
