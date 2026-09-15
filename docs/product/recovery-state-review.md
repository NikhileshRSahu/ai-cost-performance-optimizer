# V0 Screen Recovery Review

This review covers the customer-facing CSV-first pilot surfaces. The goal is not merely to avoid crashes; each expected empty, blocked, missing-evidence, permission, and unexpected-error state must tell the user what happened without leaking internal exception details and provide a safe next action when one exists.

## Global states

| Surface                      | Empty / error / recovery behavior                                              | Recovery action                                              |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Application loading          | Accessible `aria-live` loading state while route evidence resolves.            | Wait for route completion.                                   |
| Unexpected application error | Safe error boundary does not render raw exception messages or request content. | **Retry** or **Return home**.                                |
| Unknown route                | Explains that the workbench page/link is unavailable.                          | **Return home**.                                             |
| Unauthorized organization    | Explains membership/access mismatch without revealing tenant data.             | **Return home** and use an authorized identity/organization. |

## Organization workflow

| Screen               | Empty / blocked state                                                                                                                                                                                                 | Recovery path                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Overview             | No trustworthy spend renders as unavailable; no rank-1 recommendation renders an explicit empty state; monthly projection remains withheld when evidence is insufficient.                                             | Workflow progress sends the user back to import/workload steps.                                        |
| Guided demo          | Synthetic-data status remains explicit and never presented as customer proof.                                                                                                                                         | Download fixtures or open demo import.                                                                 |
| Import               | Initial state is the upload form. Failed/zero-valid-row imports show a blocking note rather than proceeding. Partial imports expose accepted/skipped/rejected/warning counts.                                         | Correct the CSV and re-upload; successful/partial usable evidence can proceed to workload constraints. |
| Sanitized AI history | Initial upload state persists no raw chat. Request/schema/size failures render a client alert with safe error category. No repeat findings are rendered explicitly rather than fabricated.                            | Correct the sanitized JSON and retry.                                                                  |
| Workloads            | No existing workload is valid: the constraint creation form remains the primary state.                                                                                                                                | Create the first safety constraint.                                                                    |
| Benchmark            | No workload constraints produces an explicit empty state. Missing/failed candidate evidence does not advance to implementation.                                                                                       | **Define constraints** or upload corrected benchmark evidence.                                         |
| Optimization Lab     | Missing recommendation or incomplete current-vs-candidate evidence renders a dedicated recovery state.                                                                                                                | **Return to benchmark** or **Back to overview**.                                                       |
| Implementation       | Missing recommendation returns to overview. Existing implementation evidence is idempotently displayed instead of asking the user to re-confirm it.                                                                   | Continue to verification or return through workflow navigation.                                        |
| Verification         | Missing recommendation returns to overview; missing implementation routes back to implementation. Failed/insufficient verification remains visible and never becomes VERIFIED.                                        | Supply comparable post-change evidence or return to implementation/report flow.                        |
| Report               | Missing recommendation or incomplete benchmark evidence renders a dedicated report-unavailable recovery state. Pending implementation/verification remains explicitly labeled as a limitation rather than fabricated. | **Return to benchmark** or **Back to overview**.                                                       |
| Data & privacy       | Non-owner users see role-blocked controls. Disabled retention is explicit. Purge requires organization-ID confirmation.                                                                                               | Owner can configure/enforce retention, export, or deliberately purge.                                  |
| Telemetry            | Non-owner users see role-blocked credential controls. No credentials is an explicit empty state. Credential API failures surface safe categories. Raw machine token is shown only after issue/rotation.               | Owner can create, rotate, or revoke credentials; agent uses `/telemetry/ingest`.                       |

## Operational/API recovery

- Health endpoint returns HTTP 503 for unconfigured/unavailable database and emits only safe operational metadata.
- Telemetry authentication failure returns HTTP 401 without distinguishing secret details.
- Telemetry abuse limit returns HTTP 429 with `Retry-After`.
- Upload-size violations return bounded safe errors before parsing oversized evidence.
- Invalid telemetry/history schemas return safe client errors rather than raw parser/exception output.
- Identical telemetry batch retries are idempotent; overlapping event batches skip already-seen event IDs.
- The backup/restore CI drill is guarded to disposable `*_test` and `*_restore` databases.

## Browser proof

The Playwright customer suite verifies:

1. unknown route recovery,
2. unauthorized organization recovery,
3. incomplete Optimization Lab recovery,
4. incomplete report recovery,
5. accessibility on those recovery screens,
6. the full successful customer loop,
7. blocked post-change verification,
8. guided synthetic-demo state,
9. owner telemetry credential issuance.

Unexpected runtime exceptions are handled by the application error boundary; known business/evidence failures should continue to use their narrower screen-specific states instead.
