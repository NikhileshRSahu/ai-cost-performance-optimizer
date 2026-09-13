# AI Efficiency Intelligence — Product Direction

## Product thesis

The product is no longer limited to cost visibility. It should help a team improve the way it uses AI across spend, prompts, workflows, knowledge and implementation.

The system must remain evidence-first:

`INGEST → UNDERSTAND → DIAGNOSE → TEST → ADVISE → IMPLEMENT → VERIFY → LEARN`

The product may ingest either a small customer-controlled export or explicitly authorized connected sources. Deeper access must unlock deeper analysis, but must never be required to prove initial value.

## Core promise

> Give us the minimum AI-work evidence you are comfortable sharing. We will show you what can be improved, test the highest-value changes where possible, and verify the outcome without hiding uncertainty.

## Progressive privacy model

### Level 1 — Usage evidence

Examples: billing CSV, request-level usage CSV, cost/latency export.

Can support:

- cost-efficiency analysis
- retry/repeated-call waste
- model-right-sizing candidates
- token/output inflation
- anomaly detection
- benchmark candidates

Cannot claim:

- prompt quality problems
- repeated semantic context
- workflow automation opportunities
- organizational memory gaps

### Level 2 — Content-assisted evidence

Examples: sanitized prompts/responses, ChatGPT/Claude exports explicitly supplied by the customer.

Adds:

- repeated-context analysis
- prompt-structure analysis
- recurring-task detection
- candidate reusable prompt/workflow templates

### Level 3 — Authorized workspace evidence

Examples: customer-authorized Gmail/Drive/Slack/GitHub/AI-history sources.

Adds:

- cross-tool duplicated work
- buried decision retrieval
- workflow fragmentation
- organizational AI habits
- richer automation opportunities

### Level 4 — Continuous production evidence

Examples: API traces, production telemetry, evaluation streams.

Adds:

- continuous verification
- quality-drift monitoring
- cost per successful outcome
- closed-loop optimization

## AI Work MRI

The MRI is not a dashboard score invented from weak evidence. It is a structured diagnosis composed of evidence-backed observations.

Primary buckets:

1. Money waste
2. Token/context waste
3. Human-time waste
4. Prompt/workflow waste
5. Knowledge/retrieval waste

Each diagnosis must state:

- what was measured
- what is inferred
- what is still unknown
- what should be tested
- what evidence would unlock the next level

## Signature experience

A customer should be able to see the engine working without being shown fake certainty:

- rows/requests/conversations analyzed
- patterns discovered
- hypotheses generated
- candidates rejected by constraints
- candidates entering benchmark
- tested result
- verified result

Never animate fictional work. Every progress state must correspond to real completed work or an explicitly labeled planned step.

## Advisor contract

Advice must be specific and actionable, but recommendations remain hypotheses until benchmarked.

Examples:

- restructure a repeated long system prompt
- introduce prompt caching
- route simple tasks to a smaller model
- convert a repeated manual task into a reusable workflow
- build retrieval around repeatedly pasted reference material
- change batching/retry behavior

The Advisor must always preserve:

- evidence reference
- confidence/limitations
- expected mechanism
- test plan
- rollback/verification plan when implementation is proposed

## Cost per successful outcome

Request-level cost is not the final business metric.

When a reliable success denominator exists, compare:

`effective_cost_per_success = total_cost / successful_outcomes`

A more expensive model per request can still be the cheaper choice if its success rate materially improves.

This metric must not be produced when the success denominator is missing or ambiguous.

## Non-goals

- generic chat-history search as the main product
- replacing observability platforms
- demanding provider admin credentials before value is demonstrated
- claiming prompt quality from cost-only data
- presenting synthetic demo metrics as customer evidence
- auto-applying production changes without explicit authorization

## Moat direction

The defensible system is the combination of:

- progressive-trust ingestion
- structured AI-work diagnosis
- counterfactual/benchmark testing
- quality constraints
- implementation evidence
- post-change verification
- reusable optimization knowledge without exposing customer data

The goal is not to be surprising through spectacle. It is to make customers surprised by how much reliable, actionable work can be produced from evidence they already own.
