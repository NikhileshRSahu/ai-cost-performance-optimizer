# Production Telemetry Agent Guide

## Purpose

Production telemetry is optional. It exists for customers who want continuous request-level cost, latency, model, retry, cache, and outcome evidence without uploading CSV files.

The telemetry schema rejects raw prompt and response fields.

## Create a credential

An organization owner opens:

`/o/<organizationId>/telemetry/ingest`

Create a labeled credential such as `production-agent`.

The raw bearer token is shown once. Only a keyed hash is stored in the database.

## Send telemetry

POST batches to:

`/o/<organizationId>/telemetry`

Use:

`Authorization: Bearer <one-time-token>`

and:

`Content-Type: application/json`

The request body must match `production-telemetry-batch-v1`.

## Rate limit

The endpoint uses a PostgreSQL-backed distributed limit of 120 requests per minute per authenticated session or machine credential.

When the limit is exceeded:

- HTTP status: 429
- `Retry-After` header: number of seconds until the current window ends

## Rotation

Rotation creates a new raw token and revokes the previous credential in one database transaction.

After rotation:

- the previous token stops authenticating,
- the replacement token is shown once,
- only the replacement's keyed hash is stored.

## Revocation

Revocation immediately disables the selected machine credential.

## Operational logging

Telemetry operational logs may contain:

- correlation/request ID,
- route,
- organization-safe internal ID,
- session or machine actor kind,
- status code,
- latency,
- safe error category,
- accepted and skipped event counts.

They must never contain:

- bearer tokens,
- authorization headers,
- raw request bodies,
- prompts or responses,
- connector credentials,
- uploaded customer content,
- unrestricted exception bodies.
