# Evalomics CSV-First Pilot Release Profile

## Status

This document defines the launch mode for the founding/public beta.

The product may be described as an **Evalomics CSV-first pilot** or **public beta** after the exact release commit is green. It must not be described as generally available enterprise connector infrastructure.

## Included

The CSV-first pilot includes:

- public LLM Cost Calculator
- Google self-serve authentication when production credentials are configured
- first-login private workspace provisioning
- CSV usage-evidence import
- AI Work MRI
- evidence drill-down
- deterministic findings and bounded hypotheses
- workload quality/performance constraints
- benchmark decisions
- historical cost replay with non-verified labeling
- implementation guidance
- post-change verification
- Potential / Tested / Verified claim separation
- organization evidence export
- retention preview/enforcement
- organization evidence purge
- telemetry credentials and bounded telemetry ingestion where explicitly deployed
- print-ready reports
- founding-pilot commercial request flows

## Explicitly excluded from this launch mode

The following roadmap capabilities are **not available in the CSV-first pilot** and must not be marketed as live:

- Gmail, Google Drive, Slack, or broad workspace connectors
- provider-admin credential ingestion
- automatic production model or prompt mutation
- encrypted third-party connector-secret vault
- connector token rotation/revocation UI
- cross-tool knowledge duplication
- semantic/embedding repeated-context clustering
- connector-specific threat-model approval
- generalized continuous optimization across customer workspaces

## Evidence rules

- PUBLIC_RESEARCH is not customer proof.
- SYNTHETIC_DEMO is not customer proof.
- BENCHMARKED is not verified production savings.
- CUSTOMER_VERIFIED requires comparable post-change evidence.
- Missing values remain unknown.
- Cross-currency values are not silently converted.
- Generated implementation guidance requires customer authorization before production use.

## Remaining real-world gates

These cannot be completed truthfully by code alone:

1. Final legal review of terms, privacy, and data-processing language for the chosen launch jurisdiction.
2. A genuine sanitized prospect dataset completing the end-to-end MRI.
3. A real design-partner benchmark with written permission before any public case-study claim.
4. Production hosting configuration, monitored incident contact, and provider-specific alert destination.
5. Final production Google OAuth credentials/callback configuration.

These gates must remain visible rather than being marked complete by placeholder data.

## Ship rule

A release is eligible for the CSV-first pilot only when:

1. the exact release commit passes all CI gates,
2. public product copy does not present excluded connectors as live,
3. public legal/trust surfaces remain accurate,
4. no provider-admin secret is requested by the pilot flow,
5. customer-facing savings claims follow the Potential → Tested → Verified boundary.
