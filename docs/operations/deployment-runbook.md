# Production Deployment Runbook

## Release prerequisites

A release candidate must satisfy all applicable gates in `docs/product/v0-release-readiness.md`.

Minimum CSV-only pilot gate:

1. CI is green on the exact release commit.
2. Database migrations have been reviewed and backed up.
3. `DATABASE_URL` is provided through the hosting platform's secret manager.
4. `TELEMETRY_CREDENTIAL_PEPPER` is provided through the secret manager when unattended telemetry is enabled.
5. The telemetry pepper is at least 16 characters, unique to the deployment, and never logged or committed.
6. No production secrets are committed to the repository or image.
7. Synthetic/demo mode is not confused with customer evidence.
8. The health endpoint returns HTTP 200 after deployment.
9. Customer-facing deletion and retention behavior is documented for the pilot.

## Container build

The repository includes a multi-stage `Dockerfile`.

```sh
docker build -t ai-efficiency-intelligence:<commit-sha> .
```

Run with the database connection injected at runtime:

```sh
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  ai-efficiency-intelligence:<commit-sha>
```

Never bake `DATABASE_URL` or connector credentials into the image.

## Database migration

Before application rollout:

1. take a verified database backup,
2. record the release commit and migration set,
3. run migrations against staging,
4. execute database and E2E tests against staging,
5. run the migration against production,
6. verify schema health before switching traffic.

If a migration is destructive, require an explicit rollback/recovery plan before execution.

## Health verification

Check:

`GET /api/health`

Expected ready response:

```json
{
  "status": "ok",
  "checks": {
    "database": "ok"
  }
}
```

A missing or unreachable database returns HTTP 503 and must block promotion.

## Rollout

Prefer a staged rollout:

1. deploy the new image without deleting the prior image,
2. verify health,
3. smoke-test sign-in/session resolution,
4. test one synthetic CSV import,
5. verify Work MRI rendering,
6. verify benchmark/report pages,
7. route production traffic,
8. retain the prior image until the stabilization window passes.

## Rollback

Rollback when:

- health repeatedly returns 503,
- authentication/tenant boundaries fail,
- imports corrupt or misattribute evidence,
- verified financial calculations change unexpectedly,
- customer data appears in logs,
- a high-severity dependency or secret-scanning issue is detected.

Rollback steps:

1. stop new writes where practical,
2. restore the previous application image,
3. restore the database only if the migration or data writes require it,
4. preserve incident evidence without copying customer prompt/content bodies,
5. record the affected release commit and safe error category.

## Backups

For PostgreSQL:

- take encrypted backups on a schedule appropriate to the pilot,
- store backups outside the application container,
- restrict restore access,
- periodically restore into an isolated environment and verify row counts and tenant boundaries,
- define and publish pilot RPO/RTO only after restore drills establish realistic values.

Do not claim an RPO/RTO that has not been tested.

## Observability

Operational logs should contain:

- request/correlation identifier,
- route or job kind,
- organization-safe internal identifier where necessary,
- status,
- latency,
- safe error category.

Operational logs must not contain raw prompts, responses, connector tokens, authorization headers, uploaded rows, or unrestricted exception bodies.

## Release record

For each production release record:

- commit SHA,
- container image digest,
- migration version,
- CI run,
- deploy timestamp,
- operator,
- rollback image,
- material known limitations.

## Unattended telemetry credentials

When machine telemetry is enabled:

1. configure `TELEMETRY_CREDENTIAL_PEPPER` in the platform secret manager,
2. create a telemetry credential from the owner-only Telemetry screen,
3. copy the token once into the sending agent's secret store,
4. never persist the raw token in application logs, source code, tickets, or analytics,
5. rotate the credential if its handling is uncertain,
6. revoke the old credential before decommissioning an agent,
7. treat a pepper compromise as requiring rotation of every telemetry credential because hashes are keyed with that pepper.

The server stores only the credential identifier and keyed hash, never the raw bearer token.
