# Incident Response

## Severity guide

### SEV-1

Examples:

- cross-tenant data exposure,
- committed or exposed production credential,
- unauthorized destructive action,
- evidence corruption that can materially misstate customer financial outcomes.

Action: contain access immediately, preserve safe forensic evidence, rotate affected secrets, and stop affected customer workflows.

### SEV-2

Examples:

- imports broadly failing,
- verification results unavailable,
- sustained production outage,
- incorrect but non-exposed customer calculations.

Action: disable the affected path if needed, restore the last known safe version, and investigate with safe logs.

### SEV-3

Examples:

- isolated UI failure,
- degraded non-critical analysis,
- recoverable background-job failure.

Action: record, repair, and verify without overstating customer impact.

## First-response checklist

1. Identify the affected release and component.
2. Determine whether customer content or credentials may be exposed.
3. Stop ongoing exposure or destructive writes.
4. Preserve safe metadata and timestamps.
5. Rotate/revoke secrets if exposure is plausible.
6. Restore a known-safe application version if the incident is release-related.
7. Validate tenant isolation and financial evidence after recovery.
8. Document what happened, what was affected, and what prevents recurrence.

## Data-handling constraint

Do not copy raw prompts, responses, customer exports, connector tokens, or unrestricted request bodies into incident tickets, chat messages, or logs.

Use safe identifiers and redacted evidence.

## Customer communication

Communications must distinguish confirmed impact from investigation hypotheses. Do not minimize, exaggerate, or fabricate financial/security impact.

Any legally required notification timing should be determined with qualified legal/security counsel for the customer's and operator's jurisdictions.
