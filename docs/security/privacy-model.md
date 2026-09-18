# Security and Privacy Model

## Principle

The product earns access progressively. A customer should be able to receive useful analysis from the minimum evidence they are comfortable sharing.

## Data classes

### Class A — usage metadata

Examples: timestamps, provider, model, token counts, costs, latency, success/failure counts, workload identifiers.

Default V0 support: allowed.

### Class B — sanitized AI content

Examples: prompts, responses, conversation exports supplied by the customer after redaction.

Default V0 support: planned, not yet enabled as a production connector.

Requirements before enabling:

- explicit customer action,
- content-size and type limits,
- redaction guidance,
- no training on customer content by this product,
- deletion path,
- tenant isolation tests,
- safe logging that excludes content bodies.

### Class C — connected workspace content

Examples: Gmail, Drive, Slack, GitHub, or AI-history sources authorized by the customer.

Default V0 support: gated.

Requirements before enabling:

- OAuth or equivalent delegated authorization,
- least-privilege scopes,
- encrypted token storage,
- revocation and rotation,
- source-level access visibility,
- deletion and retention controls,
- connector-specific threat-model review.

### Class D — provider administrative credentials

Default V0 support: **limited beta for OpenAI and Anthropic usage/cost reporting**.

The provider connector is intentionally narrower than a workspace/content connector:

- OWNER-only setup and revocation;
- organization Admin API credential entered over the authenticated server action;
- server-side validation against supported provider reporting APIs;
- AES-256-GCM encrypted ciphertext at rest;
- no credential value returned in connection summaries;
- disconnect clears the stored ciphertext;
- prompts and responses are not requested;
- normalized snapshots contain usage/cost metadata only;
- failed or incomplete syncs are not eligible as READY dashboard evidence;
- raw provider exceptions are mapped to safe error categories.

The connector does **not** make consumer ChatGPT or Claude app usage available. The internal threat model is documented in `docs/security/provider-admin-connector-threat-model.md`. Independent security assessment remains a precondition for general-availability or enterprise-audited connector claims.

## Logging rules

Never log:

- raw prompts or responses,
- credentials or authorization headers,
- uploaded CSV rows,
- connector tokens,
- request/response bodies containing customer content,
- unrestricted exception messages that may contain customer data.

Allowed operational logging should use safe categorical codes and non-sensitive identifiers.

## Evidence rules

The system must distinguish:

- measured fact,
- inference,
- recommendation,
- tested result,
- verified result.

Missing data is unknown, not zero.

Cross-currency values are not silently converted.

Synthetic demo evidence must remain visibly labeled and must never be represented as a customer result.

## Production change boundary

The product may generate a change package, but production changes require explicit customer authorization. Automatic production mutation is outside the current V0/beta boundary.

Every implementation path should include:

- intended mechanism,
- affected workload,
- expected impact,
- quality/performance constraint,
- staged rollout guidance,
- rollback trigger,
- rollback instructions,
- post-change verification window.
