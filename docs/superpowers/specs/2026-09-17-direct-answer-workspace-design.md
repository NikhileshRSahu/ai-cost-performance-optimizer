# Evalomics Direct-Answer Workspace Design

## Goal

Make Evalomics feel like a self-serve SaaS, not an internal analysis console. A normal customer should be able to connect a source or upload a CSV and reach a useful answer immediately. Technical evidence, methodology, thresholds, benchmark internals, and audit references remain available, but only behind explicit detail affordances.

The default mental model is:

**Connect or upload → Evalomics analyzes → one clear answer → optional details.**

The product must preserve the existing evidence discipline: Observed, Opportunity, Tested, Implemented, and Verified remain separate states, synthetic/demo evidence remains labeled, and Evalomics must never present projected or tested savings as verified production savings.

## Primary User Experience

### 1. Entry

The default first-run or no-data state offers only the actions needed to provide evidence:

- Connect provider, when a supported read-only connection exists.
- Upload CSV.
- Try demo data.

The copy should promise the outcome rather than describe the internal workflow. Example: “Give Evalomics your AI usage. We’ll analyze spend, identify the strongest safe optimization, and tell you what to do next.”

### 2. Upload / Connection Feedback

After a successful upload or connection, the user must receive an unmistakable completion state. The UI should state that the data is ready and summarize only high-value facts such as rows/requests analyzed, date window, spend, provider/model count, and detected workload count when those values are trustworthy.

Technical import details such as checksums, internal IDs, exact parser warnings, provenance references, and rejected-row diagnostics live behind **See import details**.

If the upload fails, show one actionable error and one primary recovery action. Do not expose raw parser or schema exceptions.

### 3. Direct Answer Screen

The Overview becomes the primary result surface. Its first viewport should answer five questions:

1. How much spend did Evalomics analyze?
2. What is the strongest current opportunity or tested improvement?
3. How much saving is supported by evidence?
4. How confident is Evalomics?
5. What should the user do next?

For a tested recommendation, the default result should resemble:

- **Spend analyzed:** USD 3.07
- **Best tested improvement:** save 34.8% in the benchmark window
- **Confidence:** High
- **Recommended action:** move Customer Support Reply Generation from model-a to model-b
- Primary CTA: **Prepare safe rollout**
- Secondary CTA: **See details**

Only one recommendation is shown in the main result. The same recommendation must not be repeated in Work MRI and again as a separate ranked card.

### 4. Details on Demand

A **See details** affordance reveals the deeper product intelligence without forcing it into the main journey. Details may include:

- evidence window and data-quality status
- Work MRI facts
- constraint thresholds
- benchmark economics
- paired-case counts
- evaluator/configuration identifiers
- exact arithmetic
- evidence references and provenance IDs
- methodology and formula versions
- limitations and withheld claims
- verification status and claim boundaries

Raw source IDs and internal record identifiers must never be visible by default.

## Navigation

The side navigation remains useful for power users, but it is not the primary workflow. The customer should not need to visit each section in sequence to get value.

Customer-facing labels:

- Overview
- Data
- Tests
- Savings

Advanced sections such as Safety, Telemetry, and Settings may remain available, but Safety should not be framed as a mandatory step after every upload.

The large horizontal Data → Safety → Test → Apply → Verify progress bar should be removed from the normal Overview experience or reduced to a compact status shown only in details. It currently communicates that the user must operate a five-step process, which conflicts with the direct-answer model.

## Analysis and Automation Rules

Evalomics should infer before asking.

From imported evidence it should automatically reuse or derive, when trustworthy:

- provider
- model
- currency
- workload name
- environment when available
- usage window
- spend
- latency/failure metrics
- current configuration

The default experience must not ask the customer to retype information already present in evidence.

Safety controls remain rigorous but use progressive disclosure. A standard customer sees one understandable policy such as **Preserve current quality**. Numeric p95, failure-rate, evaluator, and configuration controls live under **Advanced safety controls** unless the data or test requires explicit user input.

## Test Flow

The default test path starts from a recommendation, not an empty benchmark form.

When Evalomics has enough evidence to propose a candidate, show:

- current setup
- candidate setup
- estimated/testable economic difference
- safety rule to preserve
- primary CTA: **Test this optimization**

If additional examples are required, ask for the smallest missing artifact at that moment. Manual paired-case CSV upload remains available as an advanced/testing path but should not define the product experience.

If a test has already run, the user must be able to reopen the latest result directly. Never require re-uploading the benchmark just to revisit a result.

## Savings Semantics

The UI must use evidence-state language consistently:

- **Observed spend**: measured provider/customer evidence.
- **Potential saving**: opportunity only; not achieved.
- **Tested saving**: benchmark-supported; not production impact.
- **Verified net saving**: only comparable post-change production evidence, net of defined costs according to the verification formula.

When an opportunity becomes Tested, the potential card should not say “Not active” without explanation. Prefer language such as **Moved to tested** or remove the redundant potential card from the primary summary.

Human-readable money and percentage values are primary. Exact fractions and formula internals belong in details.

## Overview Information Hierarchy

### Above the fold

1. Result headline: “We analyzed your AI usage.”
2. Compact evidence-window/data-quality context.
3. One main result card with spend, saving state, confidence, recommendation, and next action.
4. One primary CTA.
5. One **See details** control.

### Below the fold / Details

- supporting metrics
- Work MRI facts
- evidence progression
- limitations
- exact calculations
- provenance
- audit-oriented references

“30-day projection withheld”, raw evidence IDs, and “What we refuse to guess” should not be top-level customer-facing content. These concepts remain available in details using calmer language such as **Evidence limitations**.

## Visual and Interaction Requirements

- Maintain the dark authenticated workspace surface consistently.
- No white container may appear inside the dark workbench unless intentionally designed as a light report/document surface.
- Every upload, analysis, test, and verification action gets a strong success/failure state.
- Each screen has at most one dominant primary CTA.
- Secondary actions are visually quieter.
- Technical disclosure uses `details`/accordion or dedicated detail routes.
- Avoid repeating the same fact or recommendation in multiple nearby components.
- Use plain customer language first; technical terminology may appear in details.

## Error Handling

- Map known validation errors to short actionable messages.
- Preserve technical error codes in logs, not in normal UI.
- Never redirect a common validation error into a generic recovery page when the form can explain the problem inline.
- Failed analysis must not create or upgrade evidence states.
- Missing data remains missing; it is never converted to zero.

## Data and Decision Flow

1. User connects or uploads evidence.
2. Import layer validates and persists accepted evidence with provenance.
3. Dashboard analysis derives trustworthy metrics and strongest supported action.
4. Overview renders one direct result from that view model.
5. User can open details for underlying MRI/evidence/methodology.
6. If a test is needed, Evalomics prepopulates all fields it already knows and asks only for missing evidence.
7. Tested results remain Tested until implementation and comparable post-change evidence satisfy verification rules.
8. Savings page shows the current claim state and verified ledger when available.

No change in this redesign is allowed to weaken the existing evidence-state or verification rules.

## Initial Implementation Scope

This pass focuses on making the existing product feel direct without building new provider connectors yet.

In scope:

- simplify Overview into a direct-answer result
- remove duplicate recommendation presentation
- move Work MRI and limitations behind details
- remove/hide raw evidence IDs from default UI
- reduce prominence of the five-step workflow progress on Overview
- make Tested state language clear
- keep one dominant next action
- ensure Data upload returns a clear result and direct path back to Overview
- keep advanced benchmark/safety controls collapsed
- preserve reopening of latest test result
- fix any remaining dark/light contrast leaks encountered in these surfaces

Out of scope for this pass:

- new OpenAI/Anthropic OAuth/API connections
- automatic execution of provider-side model changes
- new benchmark generation infrastructure
- billing/subscriptions
- organization/team redesign

## Acceptance Criteria

A first-time customer using CSV should be able to:

1. Sign in and upload a compatible CSV.
2. Immediately understand whether the upload succeeded.
3. Reach an Overview that gives the strongest supported answer without requiring them to visit Safety or Tests first when enough evidence already exists.
4. Understand the spend, saving state, confidence, recommendation, and next action within the first viewport.
5. Open **See details** to inspect evidence, methodology, limitations, and exact calculations.
6. Never see raw internal evidence IDs unless they deliberately open audit-level details.
7. Reopen an existing test result without rerunning it.
8. See Tested results clearly distinguished from Verified production savings.
9. Complete the flow without encountering white-on-white or dark-on-dark unreadable surfaces.

The redesign is successful when a normal user can treat Evalomics as “give it data, get a trustworthy answer,” while an expert can still inspect every underlying evidence boundary when needed.
