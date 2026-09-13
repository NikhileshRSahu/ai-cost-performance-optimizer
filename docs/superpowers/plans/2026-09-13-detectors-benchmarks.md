# Detectors, Benchmarks, Confidence, and Ranking Plan

**Goal:** Turn canonical usage evidence into deterministic optimization findings, evaluate imported current/candidate benchmark evidence against workload constraints, calculate evidence confidence, and rank eligible recommendations without claiming verification.

**Spec:** Sections 13-16 and 29.4-29.5 of `docs/superpowers/specs/-ai-optimizer-v0-design.md`.

## Scope

1. Deterministic detectors:
   - excessive output
   - retry/repeated-call
   - prompt caching
   - model right-sizing hypothesis
   - cost anomaly
2. Benchmark case contracts and deterministic aggregation.
3. Constraint decision precedence: `DO_NOT_CHANGE` > `INSUFFICIENT_EVIDENCE` > `OPTIMIZE`.
4. Confidence components and bands.
5. Priority ranking and stable tie-breaking.
6. Synthetic fixtures/tests.

## Safety boundaries

- A detector separates measured fact, inference, recommendation, and explicitly-not-claimed text.
- No detector claims a candidate preserves quality before benchmark evidence.
- Benchmark equality at a configured boundary passes.
- Any measured constraint failure or non-positive comparable saving yields `DO_NOT_CHANGE`, even if other evidence is missing.
- Missing mandatory quality, missing required measurements, inadequate distinct paired cases, or Low confidence yields `INSUFFICIENT_EVIDENCE`.
- No code assigns `VERIFIED`.
- Financial arithmetic uses the exact rational module; display rounding never feeds comparisons.
- Normal tests make no network or paid API calls.

## Acceptance

- Each detector declines safely when required evidence is absent.
- Cost anomaly uses 14 prior complete comparable days and excludes the assessed day from history.
- Benchmark p95 uses nearest-rank latency samples, never averages bucket p95 values.
- Distinct paired case count, not repetitions, controls sample adequacy.
- Confidence exposes D/B/S/R components and High/Medium/Low band.
- Ranking follows savings potential × confidence × ease × performance safety and stable tie breaks.
- Formatting, lint, strict typecheck, tests, build, audit, and secret scan pass.
