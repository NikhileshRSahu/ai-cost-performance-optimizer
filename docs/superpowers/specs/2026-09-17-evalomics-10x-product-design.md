# Evalomics 10x Product Design

Date: 2026-09-17
Status: Approved design draft
Target customer: Small AI startups using OpenAI and Anthropic APIs

## 1. Product Positioning

Evalomics becomes an AI Efficiency Operator, not another observability dashboard.

Core promise:

> Connect your AI usage, find the highest-value inefficiencies, model the impact, generate the fix, and prove what improved.

Primary customer loop:

**Connect -> Diagnose -> AI Efficiency MRI -> Fix -> Measure -> Monitor**

The product must deliver useful value before asking the customer to configure benchmarks, evaluators, or validation workflows.

## 2. Product Principles

1. Value first, proof second.
2. Modeled is never presented as tested or verified.
3. Customers should see the best next action, not raw telemetry.
4. Default UX should be simple; technical depth remains available behind details.
5. Evalomics may prepare changes but must not silently deploy, merge, or modify production.
6. Recommendations must be commercially meaningful, not merely technically true.
7. Financial estimates must be reproducible and based on explicit assumptions.
8. Overlapping savings opportunities must not be double counted.
9. Continuous monitoring must create recurring value after the first optimization.

## 3. Customer and Onboarding

Initial customer profile:

- small AI startups
- primarily OpenAI and Anthropic API users
- founders/CTOs/engineering leads with meaningful but not enterprise-scale AI spend
- teams that want direct savings and actionable fixes without adopting a complex FinOps stack

Initial onboarding sequence:

1. Sign in.
2. Connect OpenAI or Anthropic using the least-privileged supported method.
3. Allow CSV upload as a fallback and trial path.
4. Analyze automatically.
5. Show the AI Efficiency MRI immediately.

No mandatory setup wizard for quality floors, evaluator IDs, workload naming, or benchmark definitions before the initial result.

Future ingestion path:

- provider connectors first
- optional Evalomics SDK/proxy later for request-level telemetry, quality signals, routing, retries, latency, and deeper optimization

## 4. AI Efficiency MRI

The first useful screen presents the top three opportunities.

Example structure:

- spend analyzed
- non-overlapping modeled opportunity range
- verified savings state
- top three ranked findings
- one finding marked **Best first move**
- primary CTA based on the finding type
- secondary access to calculation and technical evidence

Each finding must answer:

1. What did Evalomics find?
2. Why does it matter?
3. What is the modeled financial impact?
4. How confident is the detection?
5. What exactly should the customer do next?

Default CTAs should be action-oriented, for example:

- Generate fix
- Test candidate
- Investigate change
- Preview patch

Validation must not be the admission price to receiving a useful result.

## 5. Evidence States and Confidence

Evalomics uses four evidence states:

### Observed
Measured directly from customer usage or connected telemetry.

### Modeled
A scenario estimate derived from observed usage plus explicit assumptions.

### Tested
A controlled benchmark or comparison produced evidence for the expected effect.

### Verified
Comparable post-change production evidence confirms realized impact.

The product must never collapse these states into one generic confidence label.

Each recommendation should track at least two separate confidence concepts:

- **Detection confidence**: certainty that the inefficiency/opportunity exists.
- **Savings confidence**: certainty around the financial effect of the proposed fix.

A high-confidence inefficiency can still have unmeasured savings.

## 6. Efficiency Engine

The Efficiency Engine analyzes normalized usage across five dimensions.

### 6.1 Cost waste

- expensive-model overuse
- avoidable token volume
- excessive output generation
- repeated retries or duplicate calls
- poor caching utilization
- unnecessary tool-call loops

### 6.2 Model-routing opportunities

- structurally simple traffic on expensive models
- extraction/classification/summarization suitable for lower-cost candidates
- traffic appropriate for fallback or tiered routing

### 6.3 Prompt and workflow inefficiency

- oversized system prompts
- repeated static context
- redundant instructions
- repeated retrieval/context injection
- excessive agent steps
- high output expansion

### 6.4 Reliability and performance waste

- retry spikes
- rate-limit churn
- failure-cost concentration
- expensive latency outliers
- downstream tool patterns that multiply calls

### 6.5 Change and regression detection

- sudden spend jumps
- cache reuse drops
- prompt-size growth
- cost-dominant model changes
- quality/cost regressions after deployment
- previously fixed waste returning

## 7. V1 Detector Set

Launch V1 with seven strong detectors rather than many weak ones:

1. cache reuse opportunity
2. premium-model overuse
3. output-token inflation
4. prompt/context duplication
5. retry/failure waste
6. workload cost concentration
7. spend/regression anomaly

Later extensions may include:

- tool-loop inefficiency
- RAG duplication
- routing instability
- batch opportunity
- context-window over-allocation
- agent-step waste
- fallback optimization

## 8. Recommendation Ranking

Internal ranking should prioritize business usefulness rather than anomaly novelty.

Conceptually:

**Expected economic value x evidence strength x actionability x recurrence x implementation-risk adjustment**

Ranking should use conservative modeled impact rather than the high case.

A recommendation should not surface unless it passes minimum gates:

- sufficient data volume
- sufficient recurrence
- meaningful economic impact
- no strong contradictory evidence
- an actionable next step exists
- minimum confidence threshold is met

The user should not see an arbitrary composite score such as 87/100.

## 9. Scenario Engine

The Scenario Engine produces immediate financial usefulness while preserving evidence integrity.

For every recommendation it should distinguish:

### 9.1 Observed economics

Directly measured data such as:

- spend
- token volume
- model mix
- cache usage
- retries
- request counts
- workload share

### 9.2 Modeled scenarios

Low/base/high scenarios derived from explicit assumptions.

Examples:

**Caching**

`eligible repeated tokens x expected additional cache reuse x cached-token price delta`

**Model routing**

`eligible request volume x (current unit cost - candidate unit cost)`

**Retry waste**

`avoidable retry volume x average retry cost`

**Output inflation**

`avoidable output tokens x output-token price`

Scenario ranges must come from assumption bands, not arbitrary percentage padding.

Every scenario must store:

- source evidence window
- pricing/version source
- assumptions
- formula version
- low/base/high outputs
- limitations

### 9.3 Tested and verified economics

After benchmark or production evidence, the product may show:

- tested saving
- verified net saving
- implementation cost
- payback period
- confidence/uncertainty

## 10. Overlap and Double-Counting Control

Evalomics must detect when findings share the same economic basis.

For example, prompt reduction and caching can affect overlapping token spend.

The system may show both opportunity ranges individually but should calculate a separate **non-overlapping modeled total** for account-level summaries.

Never sum overlapping high-level savings as if they were additive.

## 11. Fix Engine

The Fix Engine turns a recommendation into an implementation package.

Each package should contain:

1. exact target workload/model/provider
2. explanation of the problem
3. modeled impact
4. implementation risk
5. exact recommended change
6. code/config/environment changes when applicable
7. expected effect
8. test strategy
9. rollback strategy
10. post-change measurement plan

The engine chooses an action type rather than always writing code:

- Explain
- Test
- Generate Patch
- Create PR
- Monitor

Examples:

- caching -> code/config change
- model routing -> benchmark first, then routing change
- output inflation -> prompt/config change plus test
- retry waste -> retry/backoff/idempotency change
- prompt duplication -> refactor proposal
- spend anomaly -> diagnosis first, no automatic patch

## 12. GitHub Integration

For repositories that customers explicitly connect, Evalomics may:

- inspect relevant repository content
- identify likely affected code/config
- create a branch
- generate a patch
- create a pull request
- explain every changed file

The generated PR should summarize:

- why the PR exists
- evidence supporting the change
- modeled impact
- expected quality/performance risk
- rollback path
- verification plan

Trust boundary:

- no automatic merge
- no production deployment permission in V1
- no secret access beyond what is explicitly required for a supported connector
- no silent infrastructure modification

Use the smallest permissions practical for every integration.

## 13. Quality Safety Model

Quality should not require a complicated manual setup before the first result.

Hybrid approach:

1. Evalomics proposes an initial quality/performance baseline from historical behavior and available signals.
2. The customer may review or override the baseline.
3. Risky changes such as model substitution require benchmark evidence before being treated as production-grade recommendations.
4. Low-risk changes can still be presented as actionable opportunities while remaining modeled rather than tested.

Evalomics must never silently define the customer's business quality threshold as authoritative.

## 14. Continuous Monitoring

After connection, Evalomics continuously looks for:

- new waste
- regressions
- cost drift
- post-change impact

High-value alerts only:

- sudden spend spike
- quality regression
- implemented fix stopped working
- large high-confidence opportunity appeared
- material provider/model price change

Avoid noisy anomaly spam.

## 15. Weekly AI Efficiency Brief

The weekly brief should remain compact and actionable.

It contains three sections:

1. **New opportunities**
2. **Changes since last week**
3. **Best action this week**

Example summary:

- new modeled opportunity detected
- caching regression detected
- implemented optimizations remain healthy
- no quality regression detected
- one prioritized action with modeled impact

The product should not require daily dashboard usage to provide value.

## 16. Optimization Ledger

Every organization gets a persistent ledger containing:

- opportunities found
- recommendations generated
- tests run
- fixes implemented
- verified savings
- regressions detected
- cumulative verified net savings

This becomes the retention and trust surface for the account.

The primary long-term value metric is **Verified Net Savings**.

## 17. Navigation and Information Architecture

Default navigation should prioritize customer outcomes:

- Overview
- Findings
- Changes
- Savings

Advanced/settings area:

- Connections
- Benchmarks
- Telemetry
- Security
- Settings

Technical mechanisms such as Counterfactual Replay, evidence IDs, raw benchmark details, and methodology should live behind **See details** or dedicated advanced screens rather than on the main customer path.

## 18. Trust UX

Every money number should display or inherit one of the evidence states:

- Observed
- Modeled
- Tested
- Verified

Security and integration pages should make clear:

- what Evalomics reads
- what it stores
- requested provider permissions
- requested GitHub permissions
- data retention policy
- how to disconnect
- which actions always require explicit approval

The product should never use trust language as decorative marketing; each claim must map to actual system behavior.

## 19. Commercial Surface

Initial pricing should remain simple.

### Free

- one provider or CSV
- limited analysis
- top opportunities
- modeled scenarios

### Pro

- continuous monitoring
- full findings
- weekly brief
- benchmarking
- GitHub fix generation

### Business (later)

- multiple projects
- team controls
- policy controls
- audit/history
- advanced verification

Do not launch performance-linked or savings-percentage pricing until there is sufficient real customer evidence and robust attribution.

## 20. Success Criteria

The product should eventually satisfy these experience criteria:

### First-session value

A founder can move from connection to a useful prioritized recommendation in minutes without manually configuring a benchmark system.

### Actionability

The best finding includes a clear next action and, when appropriate, an implementation-ready fix.

### Trust

No modeled value is presented as achieved, tested, or verified.

### Economic usefulness

The user receives reproducible scenario math and non-overlapping account totals.

### Retention

The product continues to detect new waste and regressions after the initial audit.

### Proof

Post-change production evidence can upgrade modeled opportunities into tested and then verified results.

## 21. Architectural Boundaries

Primary systems:

1. **Provider Connectors** — ingest provider usage and billing metadata.
2. **Normalization Layer** — map provider-specific data into a common evidence model.
3. **Efficiency Engine** — detect and rank optimization opportunities.
4. **Scenario Engine** — model financial impact reproducibly.
5. **Fix Engine** — produce implementation guidance, patches, and optional PRs.
6. **Verification and Monitor Engine** — benchmark, measure post-change results, detect regressions, and produce recurring briefs.

Each subsystem should expose stable interfaces so provider-specific logic does not leak into recommendation, scenario, or verification logic.

## 22. Delivery Strategy

Do not attempt the entire design in one release.

Recommended implementation sequence:

### Stage 0 — finish current value-before-validation work

Complete and verify the existing UX change so initial analysis is useful without mandatory validation.

### Stage 1 — MRI foundation

- top-three ranked findings
- detection vs savings confidence
- modeled scenario ranges
- non-overlapping total
- revised overview/findings information architecture

### Stage 2 — provider-native onboarding

- OpenAI connector
- Anthropic connector
- normalized usage ingestion
- connection status and secure disconnect UX

### Stage 3 — initial detector suite

Implement and validate the seven V1 detectors with deterministic fixtures and reproducible ranking.

### Stage 4 — Fix Engine

- recommendation action typing
- implementation package
- patch generation
- GitHub PR generation with explicit approval

### Stage 5 — benchmarking and verification

- automatic baseline suggestion
- customer override
- candidate benchmark workflow
- tested result state
- post-change measurement
- verified result state

### Stage 6 — continuous monitoring

- regression detection
- high-value alerts
- weekly efficiency brief
- optimization ledger

### Stage 7 — optional SDK/proxy

Add request-level telemetry only after provider-native onboarding and the core optimization loop prove valuable.

## 23. Non-Goals for the First 10x Release

The first major release should not try to become:

- a generic APM platform
- a full prompt management suite
- an enterprise procurement platform
- a replacement for Langfuse/Portkey-style developer observability
- an autonomous production deployment agent
- a broad cloud FinOps product

Focus remains AI cost/performance optimization with actionable fixes and measurable outcomes.

## 24. Required Proof Before Claiming Commercial Readiness

Engineering completion is not sufficient.

Before describing Evalomics as commercially proven, obtain at least one genuine customer or design-partner case showing:

- observed starting spend/workload
- detected opportunity
- recommendation or fix
- quality/performance test where applicable
- implementation
- comparable post-change evidence
- realized and attributable outcome

Synthetic demos may demonstrate workflow but must never be presented as customer proof.
