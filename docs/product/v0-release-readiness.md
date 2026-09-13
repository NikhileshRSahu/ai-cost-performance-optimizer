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
- [ ] Sanitized AI-history import format and parser.
- [ ] Authorized workspace connector storage and revocation model.
- [ ] Production telemetry ingestion contract.

### 2. AI Work MRI

- [x] Observed spend.
- [x] Cost per request.
- [x] Cost per successful outcome only when a complete non-zero denominator exists.
- [x] Model cost concentration.
- [x] Request-level retry cost where attempt evidence exists.
- [x] Output-token intensity.
- [x] Cache-hit coverage.
- [x] Explicit withheld-claim explanations.
- [ ] Prompt-structure diagnosis from sanitized content.
- [ ] Repeated-context clustering.
- [ ] Recurring-workflow detection.
- [ ] Cross-tool knowledge duplication.

### 3. Optimization loop

- [x] Deterministic findings.
- [x] Benchmark constraints and decisions.
- [x] OPPORTUNITY → TESTED → VERIFIED state separation.
- [x] Implementation record and rollback instructions.
- [x] Comparable baseline/post-change verification.
- [x] Negative verified impact remains visible.
- [ ] Counterfactual replay for supported workload types.
- [ ] Automatic hypothesis generation from MRI findings.
- [ ] Generated implementation package for supported fixes.

### 4. Security and privacy

- [x] Tenant-scoped persistence tests.
- [x] Session-derived roles.
- [x] Read-only VIEWER boundary.
- [x] Product-event metadata allowlist.
- [x] Secret scanning in CI.
- [ ] Encrypted connector-secret storage.
- [ ] Connector token rotation/revocation.
- [ ] Data deletion/export workflow.
- [ ] Retention-policy controls.
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
- [ ] First-run guided sample with unmistakable synthetic-data labeling.
- [ ] Empty/error/recovery states reviewed screen-by-screen.
- [ ] User-facing evidence drill-down for every MRI metric.

### 6. Operations

- [x] Build, unit, database, E2E, audit, and secret-scan CI gate.
- [ ] Production deployment runbook.
- [ ] Database backup/restore drill.
- [ ] Observability and safe-error taxonomy for production.
- [ ] Rate limiting and abuse controls.
- [ ] Incident-response contact and process.

### 7. Commercial readiness

- [x] Clear positioning around AI Efficiency Intelligence rather than generic FinOps.
- [x] Free/low-friction CSV-first value path.
- [ ] One sanitized prospect dataset producing a credible end-to-end MRI.
- [ ] One design-partner benchmark with written permission to use results.
- [ ] Pricing page and checkout/invoice flow.
- [ ] Terms, privacy notice, and data-processing language reviewed for the launch jurisdiction.
- [ ] Support/onboarding playbook.

## V0 release rule

Do not call the product generally available until every unchecked item required by the chosen launch mode is either completed or explicitly excluded from that launch mode.

A limited CSV-only pilot may ship before connector work if:

1. connector UI is not presented as available,
2. no provider admin secret is requested,
3. all customer-facing claims are supported by uploaded evidence,
4. deletion/retention behavior is documented,
5. CI is green on the release commit.
