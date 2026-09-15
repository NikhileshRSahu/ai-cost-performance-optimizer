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

Default V0 support: disabled.

Administrative provider credentials must not be collected until encrypted secret storage, rotation, deletion, audit logging, tenant isolation, redaction tests, and explicit product-owner approval pass.

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

The product may generate a change package, but production changes require explicit customer authorization. Automatic production mutation is outside the CSV-only V0.

Every implementation path should include:

- intended mechanism,
- affected workload,
- expected impact,
- quality/performance constraint,
- staged rollout guidance,
- rollback trigger,
- rollback instructions,
- post-change verification window.
