# Public research validation

This fixture is **real public research evidence, not customer or prospect evidence**.

## Primary cost source

- Dataset: `mario0369/llm-cost-same-prompt`
- Public surface: Hugging Face / AI NetCafe
- License: CC BY 4.0
- Retrieved: 2026-09-14
- Fields used: timestamp, task, model, provider-reported prompt/completion/cached tokens, measured USD cost, latency, success status.
- Source methodology states that cost is computed from provider-reported token usage and the price actually paid; rows without usage are not estimated.

The checked-in sample contains only successful calls with non-empty measured USD and token evidence. Missing-cost failures are intentionally excluded instead of being assigned zero cost.

### Timestamp normalization

The public viewer exposes timestamps without an explicit UTC offset. For deterministic local replay only, the adapter appends `Z` before constructing canonical intervals. This normalization is not a claim about the source system's original timezone and must not be used for time-of-day conclusions.

### Latency normalization

Each source row is one request. A one-sample distribution has the same P50 and P95 observation, so the request latency is mapped to both canonical latency fields for research replay.

## Secondary workload-pattern source

BurstGPT v2.0 (HPMLL/BurstGPT) is a CC BY 4.0 real-world Azure-backed ChatGPT/GPT-4 serving trace with millions of requests. It is retained as a workload-pattern reference because it has request timing/token/session evidence but does not provide exact billed USD per request.

## Claim boundary

- Never call this a customer result.
- Never use it to check the sanitized-prospect-data readiness gate.
- Never use it as VERIFIED savings.
- It is allowed for engineering validation, detector regression tests, and explaining how the Work MRI behaves on real measured public evidence.
- Any public reuse must retain source attribution and CC BY 4.0 notice.
