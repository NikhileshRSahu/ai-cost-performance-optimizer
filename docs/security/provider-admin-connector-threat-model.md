# Provider Admin Connector Threat Model

**Scope:** limited OpenAI and Anthropic organization usage/cost Admin-API beta  
**Review date:** 2026-09-18  
**Review type:** internal product/security engineering review; no independent external audit has been performed.

## Security objective

Allow an organization OWNER to supply an administrative reporting credential so Evalomics can read bounded usage/cost evidence without exposing the credential to other tenants, client-side code, logs, prompts, or unsupported provider endpoints.

The connector is not a workspace-content connector and does not request prompt/response bodies.

## Trust boundaries

1. Authenticated browser → Evalomics server action.
2. Evalomics server → supported OpenAI/Anthropic reporting adapter.
3. Evalomics server → encrypted provider credential storage.
4. Normalized provider evidence → tenant-scoped analysis/dashboard.

## Primary threats and controls

### Credential disclosure in the browser or API responses

Controls:
- credential field is submitted to a server action as a password input;
- connection summaries never select or return ciphertext;
- stored values are AES-256-GCM ciphertext;
- disconnect overwrites stored ciphertext with an empty value and marks the connection revoked;
- resync decrypts only inside the server process.

Residual risk:
- an application-server compromise can access runtime key material and decrypt active credentials.

### Credential disclosure through logs/errors

Controls:
- provider UI receives categorical safe errors only;
- operational logging rules prohibit authorization headers, credentials, request bodies, and unrestricted provider exceptions;
- provider credential tests assert ciphertext does not contain plaintext.

Residual risk:
- third-party/runtime infrastructure logs still require operational review; no external audit has been performed.

### Cross-tenant credential access

Controls:
- provider repository functions call the tenant authorization guard;
- credential read/write/revoke requires the credential-management permission;
- UI only exposes connection controls to workspace OWNERs.

Residual risk:
- a future repository path that bypasses the shared tenant guard would require separate review.

### Over-broad Admin credential use

Controls:
- connector adapters use hard-coded provider reporting hosts/routes;
- the product uses the credential for reporting/administration usage-cost reads, not inference prompts;
- provider evidence normalization preserves unavailable fields instead of fabricating request-level data.

Residual risk:
- provider Admin credentials may have broader authority than Evalomics needs. OAuth/least-privilege delegated reporting access is preferred when provider support makes it practical.

### Partial sync promoted as valid evidence

Controls:
- dashboard provider evidence requires a non-revoked connection with READY sync status;
- connection status is marked READY only after snapshot persistence and analysis complete;
- failures after credential validation are marked FAILED when the database is reachable;
- explicit analysis-context selection prevents a newer provider snapshot from overriding a requested CSV/demo result.

### Secret/database compromise

Controls:
- AES-256-GCM encryption;
- a dedicated 32-byte environment key is preferred;
- if absent, a 32-byte provider key is domain-separated from the auth secret with HKDF;
- plaintext credentials are not stored.

Residual risk:
- application and encryption key material currently share the deployment trust domain; dedicated managed KMS/HSM-backed envelope encryption is stronger and should be evaluated before enterprise GA.

### Stale or revoked credentials

Controls:
- Check again performs a fresh provider sync;
- disconnect revokes locally and clears ciphertext;
- reconnect replaces the stored credential.

Residual risk:
- Evalomics cannot revoke the credential at the provider itself. Customers should also revoke unused Admin keys in the provider console.

## Data minimization

Provider snapshots contain normalized usage/cost reporting metadata only. Missing quality, latency, retries, success outcomes, or prompt semantics remain missing. Provider evidence must not be presented as equivalent to richer request-level CSV/telemetry evidence.

## Release decision

The controls above are sufficient for a **limited OWNER-only provider Admin-API beta** with clear labeling and bounded claims.

They are not evidence of an independent security certification. Before general-availability or enterprise-audited connector claims, complete an independent security assessment and evaluate dedicated managed key storage / delegated least-privilege authorization.
