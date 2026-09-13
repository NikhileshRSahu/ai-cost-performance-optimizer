# AI Cost & Performance Optimizer V0 Design

**Status:** Proposed design approved in principle on 2026-09-13; written specification awaiting review  
**Product owner:** Nikhilesh R. Sahu  
**North-star metric:** Verified net savings  
**Repository:** `NikhileshRSahu/ai-cost-performance-optimizer`

## 1. Problem

Small and growing AI companies can see tokens, calls, and spend in provider consoles and observability tools, but they still have to answer the commercially important question themselves:

> Which cheaper configuration can we adopt without violating the performance our product requires?

V0 turns usage evidence into a controlled optimization decision:

`OBSERVE → DETECT → HYPOTHESIZE → BENCHMARK → RECOMMEND → IMPLEMENT → MEASURE → VERIFY`

The product is not a generic token dashboard. Its unit of value is an evidence-backed change whose economic impact can later be verified.

## 2. Initial ICP and Buyer

The initial ideal customer is an AI SaaS company or AI-heavy startup with roughly 10–100 employees and meaningful production LLM API spend. The initial sales focus is the US, UK, and similar foreign markets.

The primary buyer is a founder, CTO, or engineering leader who:

- can identify one production workload and its performance requirement;
- has enough usage to make optimization economically material;
- wants an audit before granting persistent provider access;
- will pay for an economic outcome, not another monitoring dashboard.

Companies with only consumer AI subscriptions are outside the initial ICP.

## 3. Commercial Promise

> Find and test ways to reduce AI spend without dropping below the customer's required performance.

The first commercial motion is service-first:

1. Free or low-friction AI Cost Check.
2. Paid AI Optimization Audit.
3. Optional implementation assistance.
4. Recurring monitoring and verification.

Human-assisted analysis is allowed in V0. The customer-facing evidence must disclose its source and may never imply automation that did not occur.

## 4. V0 Scope

### 4.1 Included

- CSV/manual usage and cost import as the default onboarding path.
- A normalized usage/cost model with explicit granularity and provenance.
- Exact cost, savings, and cost-per-success calculations.
- Deterministic opportunity detectors supported by available fields.
- A benchmark-result ingestion and decision engine.
- Evidence-derived confidence and ranked recommendations.
- One strongest recommended action on the founder dashboard.
- Current-versus-candidate Optimization Lab.
- Implementation guidance without automatic customer-side changes.
- Post-change measurement and verified net-savings calculation.
- A print-optimized professional optimization report.
- Clearly marked synthetic demo scenarios.
- Product event instrumentation that excludes prompts and responses.
- Provider adapters for OpenAI and Anthropic, implemented only after the CSV-first core is proven and the credential security gate passes.

### 4.2 Non-goals

- Generic LLM tracing or full prompt observability.
- Twenty provider integrations.
- Automatic production model changes.
- A universal LLM quality score.
- Billing, subscription tiers, or usage-based invoicing.
- Enterprise SSO, procurement workflows, or complex RBAC.
- Storing raw customer prompts or responses by default.
- Automated prompt rewriting by an LLM.
- Consumer subscription optimization.
- A primary “AI health score.”

## 5. Product Decisions and Alternatives

### 5.1 Chosen: service-first optimization workbench

Build a modular monolith whose first complete loop uses CSV usage data, imported benchmark results, implementation tracking, and post-change verification. Provider adapters plug into the same normalized interfaces later.

This approach reaches a billable audit fastest, minimizes credential friction, and tests whether customers value evidence-backed savings before broad integration work.

### 5.2 Rejected for V0: integration-first SaaS

Starting with live provider connections would improve convenience but delay the core value proof and require prospects to grant organization-level credentials before the product has earned trust.

### 5.3 Rejected for V0: report-only generator

A static report could sell an audit quickly, but it would not support repeat measurement, state transitions, or verified savings. The chosen workbench retains a focused dashboard and evidence ledger while keeping report export central.

## 6. Architecture

V0 is a TypeScript modular monolith:

- **Web application:** Next.js with server-rendered application routes and accessible responsive components.
- **Application services:** TypeScript modules for ingestion, normalization, detectors, benchmarks, confidence, ranking, savings verification, and reports.
- **Validation:** Zod schemas at every external boundary.
- **Persistence:** PostgreSQL with Drizzle ORM and organization-scoped queries.
- **Background work:** an in-process job interface with persisted job state; local synchronous execution is allowed in V0, and the interface permits a durable queue later.
- **Testing:** Vitest for unit/integration tests and Playwright for critical user journeys.
- **Money:** decimal strings at boundaries and fixed-scale decimal values in application/database code; JavaScript floating-point arithmetic is forbidden for financial results.
- **Deployment:** one web service and one PostgreSQL database. No microservices in V0.

Modules communicate through typed application interfaces rather than importing provider-specific payloads. UI components consume view models, never raw ingestion records.

### 6.1 Module boundaries

| Module | Responsibility | Must not do |
|---|---|---|
| `ingestion` | accept files/provider pages, validate rows, deduplicate, record lineage | calculate recommendations |
| `normalization` | map source records to canonical records and capability flags | infer absent values |
| `economics` | exact spend, unit cost, savings, and verification math | choose a recommendation |
| `detectors` | produce measured findings and optimization hypotheses | claim benchmark success |
| `benchmarks` | evaluate current/candidate measurements against workload constraints | treat cheaper as automatically better |
| `confidence` | score evidence strength from deterministic components | ask an LLM for a confidence percentage |
| `ranking` | order eligible recommendations | hide low-confidence status |
| `reports` | render evidence and claims with provenance | convert potential savings into verified savings |
| `providers` | authenticate, page, rate-limit, and normalize provider responses | expose credentials to other modules |
| `product-events` | record funnel/operation events without content | store prompts, responses, or secrets |

## 7. Core Data and Decision Flow

1. Customer selects demo data, uploads CSV, or later connects a provider.
2. Ingestion validates the source and creates an immutable import record.
3. Normalization emits canonical usage records plus field-availability metadata.
4. Data-quality assessment returns `READY`, `PARTIAL_DATA`, `ZERO_USAGE`, `NO_DATA`, or a source error.
5. Eligible deterministic detectors emit findings separated into measured facts, inferences, and recommendations.
6. Ranking selects the strongest opportunity using potential savings, evidence confidence, implementation ease, and performance safety.
7. The operator/customer supplies a representative benchmark dataset and workload-specific constraints.
8. Benchmark results are evaluated; a candidate becomes `OPTIMIZE`, `DO_NOT_CHANGE`, or `INSUFFICIENT_EVIDENCE`.
9. The product produces implementation instructions; the customer makes the change outside the product.
10. A later import supplies post-change data.
11. The verification engine checks comparability, performance constraints, and net economic impact before assigning `VERIFIED`.

Every displayed financial claim links to its source window, included records, exclusions, formula, and evidence state.

## 8. Normalized Data Model

Provider APIs often return aggregated buckets, while customer instrumentation may provide request-level events. V0 must preserve that difference.

### 8.1 Organization and workload

- `Organization`: tenant, reporting currency, timezone, materiality threshold.
- `Workload`: customer-defined production task such as classification, extraction, support answer, or agent workflow.
- `WorkloadConstraintSet`: required quality, maximum p95 latency, maximum failure rate, evaluation method, and effective date.

Quality, latency, or failure constraints may be absent individually, but a benchmark recommendation requires every constraint configured for that workload to have a measurement. At least one workload-specific quality requirement is mandatory before `OPTIMIZE` can be issued.

### 8.2 Source and import

- `DataSource`: `DEMO`, `CSV`, `OPENAI_ADMIN_API`, or `ANTHROPIC_ADMIN_API`.
- `ImportRun`: source reference, time range, received time, status, row counts, validation errors, checksum, and demo flag.
- `SourceCapability`: declares whether a source provides request granularity, model, project/workspace, API-key identifier, token classes, cost, latency, success, tool usage, and stable event identifier.
- `PricingSnapshot`: provider/model price dimensions, currency, effective time, official source URL, retrieval time, and immutable version. Candidate projections must reference a snapshot; provider-billed actual cost remains authoritative for observed spend.

### 8.3 Canonical usage record

Each `UsageRecord` contains:

- organization and optional workload identifiers;
- provider and source;
- granularity: `REQUEST` or `AGGREGATE_BUCKET`;
- interval start and end;
- optional provider project/workspace and pseudonymous API-key identifier;
- optional model and service tier;
- input, cached-input, cache-write, and output token quantities when available;
- request count;
- optional tool-call counts or provider line-item quantities;
- optional input, output, tool, and total cost;
- ISO-4217 currency;
- optional success count, failure count, p50 latency, and p95 latency;
- source event identifier when provided;
- deterministic source-row fingerprint;
- provenance metadata and data-quality flags.

Missing fields remain `null` with a capability reason. They are never converted silently to zero.

### 8.4 Findings, benchmarks, and savings

- `Finding`: detector version, measured facts, inference, hypothesis, eligible scope, evidence links, exclusions, and potential economics.
- `BenchmarkSuite`: workload, dataset version, evaluation method, constraints, and redaction declaration.
- `BenchmarkRun`: current/candidate configuration, repetitions, case results, token/cost/latency/failure measurements, evaluator output, and provenance.
- `Recommendation`: decision, priority components, confidence components, performance margins, evidence state, and implementation guide.
- `ImplementationRecord`: recommendation, customer-marked implementation time, deployment note, and rollback instructions.
- `VerificationWindow`: baseline/post windows, normalization denominator, comparability checks, performance checks, and verified net impact.

## 9. Provider Boundaries

Provider integrations are optional adapters. They may populate only fields the official API actually returns. They must attach capability metadata so detectors can decline safely.

### 9.1 OpenAI

Official OpenAI documentation exposes organization usage endpoints by service and a separate `GET /organization/costs` endpoint. Completion usage can include cached and uncached input token dimensions, requests, model, project, user, and API-key grouping; cost results expose amount/currency and optional API-key, project, line-item, and quantity dimensions.

The Administration API requires an Admin API key, and OpenAI states that Admin API keys are limited to administration endpoints. The connector therefore requires organization-level trust rather than an ordinary project inference key.

V0 adapter rules:

- hard-code only official OpenAI API hosts and supported endpoints;
- permit only `GET` requests to the exact usage/cost routes from the reporting connector, even when the supplied credential has broader administrative power;
- request the minimum groupings needed for the selected analysis;
- page until `has_more` is false and persist a resumable cursor;
- reconcile usage and cost as related aggregates, not fabricated request-level joins;
- treat undocumented retention/history and rate limits as unknown until verified at implementation time;
- record permission and partial-page failures distinctly;
- never send the Admin API key to an inference endpoint or LLM prompt.

### 9.2 Anthropic

Anthropic's Usage & Cost Admin API requires an Admin API credential, OAuth with `org:admin`, or a non-workspace-scoped personal/service key. Workspace API keys do not work, and the API is unavailable for individual accounts. Claude Enterprise uses a different Analytics API. Anthropic's AWS platform does not expose these programmatic usage/cost endpoints.

The usage endpoint reports fixed time buckets with uncached input, cached input, cache creation, output tokens, request-related dimensions, and server-tool usage. The cost endpoint reports daily USD amounts as decimal strings in cents, including token, web-search, and code-execution cost categories. Priority Tier cost is explicitly absent from that cost endpoint. Both endpoints paginate with `has_more` and `next_page`; published usage-bucket maxima are 1,440 minute buckets, 168 hourly buckets, or 31 daily buckets. Anthropic says data typically appears within five minutes and recommends sustained polling no faster than once per minute.

V0 adapter rules:

- detect Console Platform versus Enterprise before requesting credentials;
- reject workspace keys locally without logging the value;
- permit only `GET` requests to the exact usage/cost routes from the reporting connector;
- preserve cents as exact integers before converting to canonical decimals;
- flag Priority Tier cost as unavailable rather than estimating it as provider-billed truth;
- respect documented bucket maxima, pagination, and polling guidance;
- represent default workspace and playground API-key dimensions as nullable values;
- do not support Claude Platform on AWS in V0.

### 9.3 Credential shipping gate

CSV and demo workflows ship first. A provider connector may ship only after all of these pass:

- encrypted production secret storage is configured;
- logs and errors pass secret-redaction tests;
- tenant isolation and authorization tests pass;
- credential deletion and rotation flows work;
- the UI accurately explains the organization-level permission;
- a security review accepts the residual risk;
- the product owner explicitly approves enabling the connector.

## 10. CSV Import Contract

The required V0 CSV columns are:

- `timestamp_start`
- `timestamp_end`
- `provider`
- `model`
- `requests`
- `total_cost`
- `currency`

Optional columns are:

- `source_event_id`, `project`, `workspace`, `workload`;
- `input_tokens`, `cached_input_tokens`, `cache_write_tokens`, `output_tokens`;
- `tool_calls`, `tool_cost`;
- `successes`, `failures`, `latency_p50_ms`, `latency_p95_ms`.

Rules:

- timestamps are ISO-8601 with an offset or `Z`;
- money is a non-negative decimal string with at most 12 fractional digits;
- token and count fields are non-negative integers;
- `successes + failures` may not exceed `requests`;
- end time must be greater than start time;
- duplicate detection uses `(organization, source, source_event_id)` when present, otherwise a deterministic canonical-row fingerprint;
- exact duplicates are idempotently skipped; conflicting duplicates reject the affected row;
- mixed currencies are retained but may not be aggregated without an explicit stored FX rate and rate date;
- formula-leading cells are escaped in downloadable error files and reports to prevent CSV injection;
- a failed row is never silently converted into a partial zero-valued record.

Import completion reports accepted, skipped duplicate, rejected, and warning counts. Analysis is blocked if all rows fail. Partial imports are visibly marked.

## 11. Economic Mathematics

All calculations operate on exact decimals. Rounding occurs only for display. Stored values retain source precision and formula versions.

### 11.1 Core metrics

For a comparable scope and period:

`TotalAICost = Σ valid included cost`

`CostPerRequest = TotalAICost / Requests`

`CostPerSuccessfulOutcome = TotalAICost / SuccessfulOutcomes`

If the denominator is zero or unknown, the result is unavailable, not zero.

`GrossSavings = CounterfactualBaselineCost - ActualOrCandidateCost`

`NetSavingsForHorizon = GrossSavingsForHorizon - ImplementationCostIncurredInHorizon - IncrementalOperatingCostForHorizon`

`SavingsPercentage = NetSavings / CounterfactualBaselineCost × 100`

When the baseline is zero, savings percentage is unavailable. Every net-savings value names its time horizon. Recurring monthly savings exclude one-time implementation cost and show that cost separately with `PaybackMonths = OneTimeImplementationCost / RecurringMonthlyNetSaving`. First-period and verified-window net impact subtract implementation cost actually incurred in that period. A zero or negative recurring saving has no payback value.

### 11.2 Potential and tested projections

For a detector or benchmark, baseline and candidate cost are compared at the same eligible workload volume. Monthly projection requires at least seven covered days and is:

`Projected30DayCost = ObservedComparableCost / CoveredCalendarDays × 30`

The UI names the observation window and labels projections. Fewer than seven covered days may show observed-period economics but not a monthly headline.

### 11.3 Verified net savings

Verification uses a baseline unit rate and a post-change denominator chosen in this order:

1. successful outcomes, when available in both windows;
2. requests, when request definitions are stable in both windows;
3. no verification when neither comparable denominator exists.

`CounterfactualPostCost = BaselineCostPerUnit × PostUnits`

`VerifiedNetImpact = CounterfactualPostCost - ActualPostCost - IncrementalOperatingCostInWindow - ImplementationCostIncurredInWindow`

The baseline and post windows must use the same workload, currency, denominator definition, attribution scope, and minimum coverage. The post window must satisfy the configured performance constraints. If comparability or performance fails, the saving remains `TESTED`; the product explains which verification requirement failed.

Negative verified impact is displayed as a verified cost increase, never hidden or clamped to zero.

## 12. Savings Trust States

Savings state is independent of implementation status.

| State | Required evidence | Permitted claim |
|---|---|---|
| `OPPORTUNITY` | deterministic detector and comparable baseline economics | “Potential saving” |
| `TESTED` | benchmark candidate passes configured constraints with calculable comparable cost | “Tested saving” |
| `VERIFIED` | implemented change plus comparable post-change data, constraints passing, and net-impact calculation | “Verified saving” |

Allowed transitions are `OPPORTUNITY → TESTED → VERIFIED`. A failed benchmark remains `OPPORTUNITY` with decision `DO_NOT_CHANGE`. A later evidence correction may invalidate a state; invalidation creates an audit event and preserves the old calculation rather than rewriting history.

Demo records carry `is_demo = true`, and every screen/report containing them shows “Synthetic demo data — not a customer result.”

## 13. Initial Detectors

V0 implements only deterministic detectors whose input requirements can be checked.

### 13.1 Excessive output opportunity

Requirements: workload, output tokens, requests, model/configuration, and cost or applicable pricing snapshot.

Measured fact: output tokens per request and output-cost share are above configured workload thresholds.  
Inference: a lower output cap or more concise configuration may reduce cost.  
Recommendation: benchmark a candidate output limit.  
Not claimed: that shorter output preserves quality.

### 13.2 Retry/repeated-call opportunity

Requirements: request-level data with a customer-supplied stable operation ID and attempt number, or explicit retry counts. Aggregated provider usage alone is insufficient.

Measured fact: repeated attempts consume measurable cost.  
Inference: retry policy, timeout, or idempotency behavior may be contributing.  
Recommendation: inspect causes and benchmark a bounded retry policy.  
Not claimed: that all repeats are waste.

### 13.3 Prompt caching opportunity

Requirements: request-level stable-prefix hash/length supplied by customer instrumentation, or explicit cache-eligible and cached-token fields. Raw prompt content is not required.

Measured fact: repeated eligible prefix tokens are uncached or cache-hit ratio is below the configured threshold.  
Inference: provider-supported caching may reduce input cost.  
Recommendation: test caching with the same workload.  
Not claimed: cache eligibility when only aggregate tokens are available.

### 13.4 Model right-sizing opportunity

Requirements: workload/model attribution, cost, volume, and an available lower-cost candidate configuration.

Measured fact: eligible volume and baseline model cost.  
Inference: a lower-cost candidate could be material.  
Recommendation: run the workload benchmark.  
Not claimed: acceptable candidate quality before testing.

### 13.5 Cost anomaly

Requirements: at least 14 comparable daily buckets and stable scope.

Use median and median absolute deviation (MAD), which are robust to spikes. When `MAD > 0`:

`RobustZ = 0.6745 × (CurrentDailyCost - MedianDailyCost) / MAD`

Flag when `RobustZ ≥ 3.5` and the absolute increase exceeds the organization's materiality threshold. When `MAD = 0`, flag only when the increase exceeds the materiality threshold and is greater than the historical maximum. An anomaly is an investigation finding, not a savings claim.

Cost-per-success deterioration is deferred unless success attribution exists. Agent-loop and batchability detectors are deferred until reliable required fields are available.

## 14. Benchmark Methodology

### 14.1 Workload-aware suites

Each suite declares one evaluation method:

- exact-match or label accuracy for classification/extraction;
- schema validity plus field-level scoring for structured generation;
- customer-supplied deterministic grader for domain tasks;
- blinded human rubric for subjective generation;
- tool/task completion criteria for agentic workloads.

An LLM judge may be added later as one evaluator, but cannot be the only undisclosed basis for a financial recommendation.

### 14.2 Fair comparison

Current and candidate configurations run against the same versioned cases, repetitions, timeout policy, and scoring method. Order is randomized when execution is automated. Warm-up calls are excluded consistently. Provider errors and timeouts count toward failure rate according to the suite definition.

V0 can ingest sanitized benchmark-result CSV/JSON produced manually or by a customer runner. The decision engine is source-agnostic and records whether execution was automated, manually entered, or demo-fixture based.

### 14.3 Captured metrics

- quality score with evaluator name/version;
- latency p50 and p95;
- failure rate;
- input, cached-input, cache-write, and output tokens when available;
- cost per request;
- cost per successful outcome when success is defined;
- estimated monthly comparable cost;
- net potential saving;
- constraint margin and pass/fail.

### 14.4 Decision

A candidate passes only when every configured constraint has sufficient measurement and:

- `quality ≥ required quality`;
- `p95 latency ≤ maximum p95 latency`, if configured;
- `failure rate ≤ maximum failure rate`, if configured;
- comparable net saving is positive.

Decision rules:

- `OPTIMIZE`: all constraints pass, net saving is positive, and confidence is at least Medium.
- `DO_NOT_CHANGE`: any measured performance constraint fails or net saving is non-positive.
- `INSUFFICIENT_EVIDENCE`: required measurements are missing, sample adequacy fails, or confidence is Low.

Boundary values pass exactly: equality with a minimum or maximum constraint is a pass.

## 15. Confidence Methodology

Confidence is calculated, stored by component, and versioned:

`Confidence = 0.30D + 0.30B + 0.20S + 0.20R`

Each component is in `[0,1]`:

- `D — DataCompleteness`: weighted valid-field count divided by total fields required by that detector/benchmark. Required fields have equal weight unless a detector version declares immutable field weights; V0 detectors use equal weights. A field that the source cannot provide scores zero when it is required.
- `B — BenchmarkStrength`: `0` without a benchmark; otherwise `0.4 × evaluatorCoverage + 0.3 × configurationParity + 0.3 × measurementCoverage`. Each subcomponent is a documented binary/ratio value, not a subjective percentage.
- `S — SampleAdequacy`: `min(1, pairedValidCases / targetCases)`. The suite sets `targetCases`; V0 defaults to 30 and never allows a target below 10.
- `R — Repeatability`: `0` with fewer than two repetitions; otherwise `0.5 × decisionAgreement + 0.5 × metricStability`. `decisionAgreement` is the fraction of repetitions agreeing on constraint pass/fail. `metricStability` is the mean across required metrics of `max(0, 1 - relativeMAD / 0.10)`, where `relativeMAD = MAD / max(|median|, ε)` and `ε = 10^-12`.

Bands:

- High: `Confidence ≥ 0.80`
- Medium: `0.60 ≤ Confidence < 0.80`
- Low: `Confidence < 0.60`

The UI displays the percentage, band, four components, and reasons. It never uses an LLM-generated confidence score.

## 16. Recommendation Ranking

Each opportunity receives:

`Priority = SavingsPotential × Confidence × EaseOfImplementation × PerformanceSafety`

All factors are in `[0,1]`:

- `SavingsPotential = min(1, positiveNetMonthlySaving / organizationMaterialityTarget)`.
- `Confidence` is defined above.
- `EaseOfImplementation`: configuration-only `1.00`; isolated code change `0.75`; coordinated multi-component change `0.50`; migration/architecture change `0.25`.
- `PerformanceSafety`: untested hypothesis `0.25`; tested candidate equals the minimum normalized constraint safety across required metrics, mapped from `0.50` at the passing boundary to `1.00` at a margin of 10% or more; a failed constraint gives `0`.

The ease category is selected explicitly by the operator and shown in evidence. Ties are resolved by higher positive monthly saving, then higher confidence, then stable finding ID. The dashboard presents one strongest action and a secondary “View all opportunities” path.

## 17. UX and User Flows

### 17.1 First-value journey

`Import → Validate → Analyze → Strongest opportunity → Benchmark evidence → Implementation guide → Mark implemented → Verify`

The onboarding goal is a meaningful, evidence-backed opportunity from a valid CSV in under five minutes for the demo fixture and under ten minutes for a conforming customer export.

### 17.2 Founder dashboard

The first screen answers:

1. Current observed spend and time window.
2. Strongest optimization opportunity.
3. Potential, tested, or verified saving with an unmistakable state label.
4. Required performance and measured candidate performance.
5. Confidence with evidence reasons.
6. The single next action.

The hero is economic, not a health score. When no defensible opportunity exists, the hero says so and explains the next evidence needed. Technical charts live below the action or in drill-down views.

### 17.3 Optimization Lab

The Lab compares Current and Candidate in one table:

- model/configuration;
- quality and threshold;
- latency p50/p95 and maximum;
- failure rate and maximum;
- cost/request and cost/success;
- comparable monthly cost;
- net saving;
- confidence;
- constraint status.

The final decision is visually dominant: `OPTIMIZE`, `DO NOT CHANGE`, or `INSUFFICIENT EVIDENCE`. Evidence rows link to cases, formulas, exclusions, and source metadata.

### 17.4 Psychological clarity

- restrained financial/engineering visual language;
- plain-language labels before technical terminology;
- green only for passed/verified outcomes, amber for potential/insufficient evidence, red for failed constraints/errors;
- state encoded by text and icon as well as color;
- no fake live activity, vanity scores, manipulative fear, or fabricated precision;
- every demo page permanently marked as synthetic;
- responsive layouts and WCAG 2.2 AA contrast/keyboard targets;
- current FinOps, observability, and model-evaluation patterns must be reviewed before final screen implementation, focusing on evidence drill-down, comparison tables, and progressive disclosure rather than copying brand styling.

## 18. Implementation Guide Behavior

An implementation guide contains:

- exact proposed configuration change;
- affected workload and environment;
- prerequisites;
- staged rollout steps;
- metrics to watch;
- stop/rollback conditions;
- rollback instructions;
- expected economics and evidence state;
- owner-entered implementation confirmation.

V0 never applies the change. Guides generated with human assistance are marked “Reviewed by operator” only after an authenticated operator confirms review.

## 19. Optimization Report Format

The report is print-optimized HTML that can be saved as PDF and contains:

1. Executive summary: observed spend, strongest action, saving state, decision.
2. Scope and data quality: sources, dates, coverage, exclusions, demo status.
3. Opportunity: measured fact, inference, hypothesis.
4. Benchmark: current versus candidate, constraints, result.
5. Economics: formulas, comparable volume, incremental costs, net saving.
6. Confidence: component scores and reasons.
7. Implementation guide and rollback.
8. Verification plan or verified result.
9. Methodology/version and limitations.

The report uses no testimonial or case-study language for synthetic data.

### 19.1 Weekly founder summary

The same evidence model produces a concise weekly view/export containing:

- spend change versus the immediately preceding comparable period;
- the strongest optimization opportunity;
- the saving amount and `OPPORTUNITY`, `TESTED`, or `VERIFIED` label;
- measured performance impact and configured requirement;
- confidence band and principal limitation;
- verified net savings already achieved;
- one recommended next action.

If periods are not comparable, the report says so and omits the percentage change. V0 supports on-demand generation; scheduled email delivery is deferred.

## 20. Error and Failure Behavior

Errors are typed and customer-visible where actionable:

- `NO_DATA`: no records exist for the scope.
- `ZERO_USAGE`: valid records show zero activity.
- `PARTIAL_DATA`: some expected records/fields/windows are unavailable.
- `VALIDATION_ERROR`: source rows violate the import contract.
- `API_ERROR`: provider responded unexpectedly or was unavailable.
- `PERMISSION_ERROR`: credential lacks the required access.
- `RATE_LIMITED`: provider asked the connector to retry later.
- `STALE_DATA`: source freshness exceeds the configured allowance.

Analysis never substitutes zero for these states. Jobs are idempotent, resumable by cursor, and preserve the last known successful import separately from the latest failed attempt. Reports state when they use older data.

## 21. Security and V0 Threat Model

### 21.1 Protected assets

- provider administrative credentials;
- customer cost and usage records;
- benchmark inputs/results;
- organization membership and report access;
- financial claim integrity and audit history.

### 21.2 Principal threats and controls

| Threat | V0 control |
|---|---|
| secret committed to Git | `.env.example`, secret scanning in CI, ignored `.env*`, documented rotation procedure |
| credential leakage in logs/errors | centralized structured logger with field allowlist and redaction tests; no request headers/bodies |
| credential sent to an LLM | provider secrets are accepted only by adapter/secret-store interfaces; prompt construction types cannot reference them |
| cross-tenant data access | mandatory organization scope in repositories/services, authorization checks, integration tests, database constraints |
| database compromise | secrets stored outside analytics tables using managed secret storage and envelope encryption; only opaque credential references in PostgreSQL |
| malicious CSV | size/row limits, streaming parse, MIME/extension checks, schema validation, spreadsheet-formula escaping |
| stored XSS in names/report fields | contextual output encoding and sanitization; no arbitrary HTML |
| SSRF/exfiltration | fixed provider hosts, no customer-provided connector base URL, egress allowlist where available |
| forged/changed evidence | immutable import checksums, formula/detector versions, append-only calculation/audit records |
| excessive sensitive content collection | raw prompts/responses off by default; prefix hashes and sanitized benchmark fixtures preferred |
| dependency compromise | lockfile, automated dependency review, minimal dependencies, CI audit gate |
| public demo confused with customer proof | immutable demo flag and visible watermark/label in every derived artifact |

Credentials never enter analytics tables, logs, reports, browser storage, product-event payloads, or LLM prompts. Production credentials are encrypted in transit and at rest, can be deleted, and are accessed only for the specific connector job.

V0 authentication uses passwordless email sign-in. Roles are `OWNER`, `OPERATOR`, and `VIEWER`; only owners can manage credential references, operators can import/benchmark/prepare guides, and viewers are read-only. Billing permissions are out of scope.

## 22. Product Observability

Record timestamped, organization-scoped product events:

- connection attempted/succeeded/failed with safe error category;
- import started/completed/failed;
- analysis completed;
- first meaningful opportunity produced;
- benchmark started/completed;
- recommendation viewed;
- implementation guide viewed;
- recommendation marked implemented;
- verification completed;
- verified saving achieved.

Derive time-to-first-insight from server events. Event properties may include IDs, counts, durations, states, and money values but never prompts, responses, credentials, uploaded rows, or unrestricted error text.

## 23. Demo Environment

Synthetic fixtures demonstrate:

- expensive model used for simple classification;
- repeated stable prompt prefix with poor cache utilization;
- excessive output tokens;
- abnormal daily cost spike;
- repeated failed attempts.

Each fixture includes source CSV, workload constraints, current/candidate benchmark results, expected findings, and expected financial calculations. Fixtures are deterministic and version-controlled. Demo totals are plausible but explicitly synthetic.

## 24. Testing Strategy

### 24.1 Unit tests

Test exact arithmetic, zero/missing denominators, currencies, duplicate fingerprints, partial records, negative/invalid cost, time-window boundaries, cached-token behavior, detector thresholds, benchmark equality boundaries, confidence components, state transitions, priority ties, and negative verified impact.

### 24.2 Integration tests

- CSV parse → normalization → finding → report.
- Benchmark import → constraint decision → recommendation.
- Implementation mark → post-data import → verification.
- Tenant authorization for every read/write repository.
- Credential redaction through connector failures.
- Provider adapters with sanitized recorded fixtures and pagination/rate-limit/error cases.

Normal tests never make paid API calls.

### 24.3 End-to-end tests

- synthetic demo reaches strongest opportunity and report;
- conforming CSV reaches first insight;
- malformed/partial CSV explains errors without false zeros;
- failed benchmark produces `DO_NOT_CHANGE`;
- weak evidence produces `INSUFFICIENT_EVIDENCE`;
- verified flow requires comparable post-change data;
- demo labels remain visible on dashboard, Lab, and report.

### 24.4 Quality gates

Every core behavior follows red-green-refactor TDD. CI requires formatting, lint, type-check, unit/integration tests, secret scan, and a production build. Critical accessibility checks run on the core screens.

## 25. Commercial Validation Criteria

Before broad provider or enterprise expansion, V0 must produce evidence from real prospects:

- at least five qualified ICP discovery/audit conversations;
- at least three prospects provide a sanitized export or complete the cost check;
- at least two receive an evidence-backed opportunity;
- at least one completes a benchmark;
- at least one pays for an audit, implementation help, or recurring monitoring, or signs a specific purchase commitment with price and start condition;
- the engagement records time to first insight, benchmark completion, recommendation acceptance, and net verified savings when implemented.

Compliments, waitlist signups, and survey intent do not pass the willingness-to-pay gate.

Product metrics are:

- time to first meaningful opportunity;
- percentage of organizations receiving an evidence-backed opportunity;
- benchmark completion rate;
- recommendation viewed and accepted rates;
- implementation rate;
- verified net savings;
- verified savings divided by service/product cost;
- audit-to-paid conversion;
- retention after the first optimization.

## 26. Delivery Sequence

1. Repository/tooling foundation and test infrastructure.
2. Canonical model, CSV importer, and deterministic demo fixtures.
3. Exact economics and savings-state ledger.
4. Eligible deterministic detectors.
5. Benchmark ingestion, constraint evaluation, and confidence.
6. Ranking, report, founder dashboard, and Optimization Lab.
7. Implementation tracking and post-change verification.
8. Security hardening and end-to-end demo.
9. Commercial audit with sanitized customer export.
10. Only after validation and security approval: OpenAI adapter, then Anthropic adapter.

This sequence intentionally moves live provider integrations later than the original phase list because official APIs require organization-level administrative access. CSV-first produces the commercial proof while the product earns the trust required for those permissions.

## 27. Acceptance Definition for Sellable V0

V0 is sellable when a founder can use synthetic demo data or a conforming sanitized CSV to:

1. see observed spend with an explicit period and data-quality state;
2. receive one defensible optimization opportunity;
3. inspect the measured fact, inference, and hypothesis separately;
4. load representative current/candidate benchmark results;
5. see constraints pass or fail and receive the correct decision;
6. obtain a professional implementation/report artifact;
7. mark the change implemented;
8. load comparable post-change data and receive either verified net impact or a precise explanation of insufficient evidence;
9. trace every financial claim to exact inputs and formula version;
10. complete the core flow without exposing a secret or confusing demo, potential, tested, and verified results.

## 28. Authoritative References

- OpenAI organization Usage and Costs API reference: <https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage>
- OpenAI Administration overview and Admin API-key boundary: <https://developers.openai.com/api/reference/administration/overview>
- Anthropic Usage & Cost Admin API: <https://platform.claude.com/docs/en/manage-claude/usage-cost-api>

Provider capabilities must be rechecked against these official sources immediately before adapter implementation. Sanitized recorded fixtures must include the documentation retrieval date and adapter schema version.


## 29. Specification Review Clarifications — 2026-09-13

This section resolves implementation ambiguities found during self-review. Where an earlier section is less specific, these rules govern. Product-owner review of the written specification remains pending.

### 29.1 Exact arithmetic and evidence

Source money is stored as signed integer units at scale 12 (negative source costs remain invalid; calculated impacts may be negative). Division can produce repeating decimals, so derived ratios are retained as exact rational numerator/denominator pairs of integers, with positive denominators. Financial comparisons and chained calculations use those pairs, never rounded decimal intermediates or JavaScript Number. Decimal output is a presentation projection using half-even rounding; evidence retains the exact fraction and formula version. Database fields must reject overflow rather than truncate. Example: baseline cost 1 divided by 3 units, multiplied by 3 post units, produces exactly 1.

Confidence percentages are deterministic evidence scores, not calibrated probabilities or statistical guarantees. Benchmark results describe the tested dataset; the report must not imply guaranteed future production quality.

### 29.2 Coverage and verification

Coverage is the union of explicitly complete source intervals within the selected scope, measured in the organization's timezone. Missing intervals are unknown, not zero-use days. Complete zero-use days count only with explicit source coverage evidence. Overlapping intervals count once. Monthly projections require at least seven complete calendar days and use only costs attributable to those complete days. Aggregate buckets crossing a selected boundary are excluded with a reason unless exact subdivision is supplied; their cost is not prorated by time.

Both verification windows require at least seven complete days, must not overlap, and must exclude a recorded rollout/stabilization interval. The operator records attribution scope, unchanged unit definitions, workload/configuration versions, and workload-mix comparability. Material changes in task mix or concurrent deployments block verification unless separately attributed comparable strata exist. Missing comparability attestations or required post-window performance evidence block VERIFIED.

Quality evidence for the post window is imported separately when usage CSV cannot supply it; an old benchmark alone does not establish post-change quality. Success definitions must match across windows; zero or unknown baseline units block verification.

### 29.3 Ingestion capabilities

The base CSV remains valid without detector-specific fields. Extend the optional contract and canonical record with:
- granularity: REQUEST or AGGREGATE_BUCKET; default AGGREGATE_BUCKET, never inferred from requests = 1;
- configuration_id and optional output_cost;
- operation_id and attempt_number (integer at least 1), or retry_count (non-negative integer);
- stable_prefix_hash, stable_prefix_tokens, and cache_eligible_input_tokens.

REQUEST records represent exactly one attempt. Explicit retry_count may support a retry finding, but retry savings require attributable retry cost evidence; multiplying total cost by a guessed retry fraction is forbidden. Repeated attempts are not deduplicated by operation_id. Cached-token quantities alone never establish cache eligibility. Prefix identifiers are customer-supplied opaque values; raw prompts remain excluded.

Token normalization records whether provider input totals include cached/cache-write tokens before deriving disjoint cost dimensions; unknown semantics block token-based cost projections. Import-provided total_cost alone is customer-reported actual cost, not independently reconciled provider-billed cost.

CSV limits are 10 MiB and 50,000 data rows per import, with UTF-8 encoding and 64 KiB maximum decoded cell length. Reject duplicate header names and unsupported columns with an actionable schema error. Tenant IDs and demo flags are assigned server-side, not trusted from uploaded rows. Request/aggregate overlap or overlapping exports that cannot be reconciled are flagged and excluded from combined financial totals until resolved.

### 29.4 Benchmark decisions and metric aggregation

A paired valid case is a distinct case ID with both current and candidate records under the same dataset/evaluator version. Repetitions do not increase the distinct-case count. Sample adequacy passes only when pairedValidCases >= targetCases; default 30, minimum allowed target 10. A high weighted confidence score cannot bypass this gate.

Decision precedence:
1. Any valid measured configured constraint failure or calculable non-positive net saving yields DO_NOT_CHANGE, even if other evidence is missing.
2. Otherwise, missing mandatory quality requirements, missing measurements, unmatched configurations/cases, inadequate samples, or Low confidence yields INSUFFICIENT_EVIDENCE.
3. Only complete passing evidence and positive comparable net saving yield OPTIMIZE.

For request-level latency samples, use nearest-rank percentiles with sorted sample rank ceil(p * n). Never average bucket p95 values to claim a combined p95; require underlying samples or a directly measured percentile for the exact evaluated scope. Benchmark records include case ID, repetition ID, configuration ID, outcome, measured cost/currency, latency, normalized quality score in [0,1], and evaluator provenance. Timeout/error treatment is fixed by the suite before results are imported; failures cannot be silently dropped from denominators. Performance thresholds use unrounded values.

### 29.5 Ranking and detector boundaries

organizationMaterialityTarget must be positive. For less than seven covered days, rank within an explicitly labeled observed-period cohort using positive observed-period net saving and a materiality target for that same period; never mix this ranking with monthly projections.

For a positive minimum-quality threshold q, normalized safety margin is (measured - q) / q. For a positive maximum threshold t, it is (t - measured) / t. A passing zero threshold receives margin 0 conservatively; a failed threshold receives safety 0. Passing safety is 0.5 + 0.5 * min(1, margin / 0.10), taking the minimum across required constraints.

Cost-anomaly history means at least 14 complete comparable days strictly before the assessed day; the assessed day is excluded from median, MAD, and historical maximum. Opportunity amounts from overlapping recommendations are never added together without a joint benchmark and attribution model.

### 29.6 Authorization and delivery gates

OWNER inherits OPERATOR capabilities; OPERATOR may mark implementation and submit verification evidence; VIEWER is read-only. Only OWNER manages membership and credential references. Every service authorizes membership from the authenticated session rather than accepting an organization ID as authority. Imported results never execute customer-supplied grader code on the server.

Implementation planning follows the delivery sequence in section 26, with separate executable milestones for the core evidence engine, authenticated workbench, and security/commercial validation. Provider adapters remain a later gated milestone. This specification does not authorize prospect outreach, paid API use, or enabling provider credentials.
