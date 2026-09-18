# Evalomics Wow Experience Redesign

Date: 2026-09-18  
Status: Design ready for implementation review  
Base commit: `a6c16632f073ae7b016a5de23142bfe2988b0bd2`  
Scope: public landing, sign-in, first-value onboarding, analysis result, workbench shell, semantic motion

## 1. Goal

Turn Evalomics from a credible technical SaaS into a product that feels immediately intelligent.

The desired first-session impression is:

> I connected my usage and this product immediately understood where I am wasting money.

The redesign must preserve the existing evidence contract and backend behavior. It must not invent savings, collapse evidence states, or add friction before initial value.

## 2. Product Experience Principle

Evalomics should stop asking the user to understand its internal system.

The customer should experience only:

1. Give Evalomics usage evidence.
2. Evalomics analyzes it automatically.
3. Evalomics returns the strongest supported answer.
4. The customer can inspect why.
5. The customer can test the recommended change.
6. The customer can verify whether it worked.

Internal lifecycle concepts remain implementation architecture, not default customer navigation.

## 3. Design Direction

Use an **Evidence Engine** visual language.

The product should feel like an analysis instrument, not a marketing-template site.

Characteristics:

- dark analytical product surfaces
- precise typography and numerics
- quiet borders and depth
- one dominant conclusion per viewport
- motion that represents analysis or evidence progression
- explicit evidence-state colors
- progressive disclosure
- no glassmorphism overload
- no random gradient cards
- no decorative 3D motion unrelated to product meaning

### Evidence-state visual system

- Observed: cool neutral / evidence blue
- Potential / Opportunity: amber
- Tested: stronger blue
- Verified: green
- Limitations / risk: restrained warning tone
- Unavailable / insufficient evidence: muted neutral

The state system must remain consistent across marketing demo, result screen, details, benchmark, and savings surfaces.

## 4. External Design Research Applied

The implementation may use interaction concepts from open-source UI systems, but should not become a collage of third-party components.

### Magic UI lesson

Use one primary motion anchor plus one supporting effect in a viewport. Avoid stacking many high-motion effects.

Applied to Evalomics:
- one Evidence Engine demo on the homepage
- subtle supporting reveal/counter motion only
- no particle field + marquee + glow + scramble + parallax combination

### Motion Primitives lesson

Prefer small, composable motion primitives and explicitly handle reduced motion.

Applied to Evalomics:
- staggered reveal
- numeric transition
- in-view reveal
- status transition
- evidence-state morph
- no second motion runtime because the repo already uses Framer Motion 13

### React Bits lesson

Micro-interactions can make interfaces memorable, but effects should be lightweight and customizable.

Applied to Evalomics:
- hover and selection feedback
- analysis progress transitions
- subtle result emphasis
- no copied React Bits source in this release

### shadcn lesson

Keep product primitives accessible and predictable. The visual system may be custom, but interaction behavior should remain conventional.

Applied to Evalomics:
- keyboard-safe controls
- semantic disclosure
- clear focus states
- proper loading / empty / error states
- restrained component nesting

## 5. Public Homepage

### 5.1 Hero

Replace the current marketing framing with immediate product action.

Primary headline remains concise:

**Find AI waste. Prove the fix.**

Supporting copy becomes outcome-first:

> Connect OpenAI or Anthropic, or upload a usage CSV. Evalomics analyzes the evidence and gives you the strongest cost-saving action it can support.

Primary CTA:

**Analyze my AI usage**

Secondary CTA:

**Try the live demo**

Trust row:

- Free during beta
- No credit card
- No prompt content required for supported aggregate-data paths
- No invented savings

Remove `CSV-first` from public messaging.

### 5.2 Evidence Engine Demo

Replace the existing 60–80rem 3D container-scroll sequence.

The new demonstration is a compact product-like interactive sequence with four meaningful states:

#### State A — Evidence enters

Show OpenAI, Anthropic, and CSV source chips feeding an analysis surface.

Message:

**Reading usage evidence**

#### State B — Analysis

Show candidate patterns appearing while weaker unsupported candidates fade.

Message:

**Ranking supported opportunities**

#### State C — Answer

Everything quiets except one recommendation.

Example:

**#1 Reduce oversized outputs**

Evidence state: Opportunity  
Spend analyzed: synthetic amount  
Savings: Not measured yet  
Confidence: Medium

#### State D — Proof progression

Show Opportunity -> Tested -> Verified as distinct states.

Never imply synthetic values are customer results.

The motion should visually explain how Evalomics thinks rather than simply rotating a mock dashboard.

### 5.3 Page length

The marketing page should be materially shorter.

Preferred sequence:

1. Hero
2. Evidence Engine
3. Short trust/product contract
4. CTA/footer

Methodology, Research, and deep proof explanations remain linked, not fully re-explained on the home page.

## 6. Sign-In Experience

Current sign-in is credible but too CSV-oriented.

Change copy to:

> Sign in, choose OpenAI, Anthropic, CSV, or the demo, and Evalomics will analyze the evidence automatically.

Right panel becomes a compact “What happens next” preview:

1. Connect or upload
2. Analyze automatically
3. Get one clear result

Do not present Test and Verify as mandatory onboarding steps before the user has received value.

Keep:

- Google sign-in
- free beta
- no credit card
- no invented savings
- no prompt-content claim only where technically correct

## 7. First-Value Source Selection

The first authenticated no-data state should feel like a product launchpad, not a settings form.

Present four clear choices:

- OpenAI
- Anthropic
- Upload CSV
- Try demo

Each card answers:

- what data it uses
- what credential/file is required
- whether prompt text is read
- expected analysis window where known

Primary design goal: user should understand the choice without documentation.

Advanced configuration remains collapsed.

## 8. Analysis Transition

After connect/upload/demo, replace generic waiting with semantic progress.

Stages:

1. Reading usage
2. Normalizing evidence
3. Finding waste
4. Ranking supported opportunities

These are UI progress labels, not fabricated backend percentages.

Do not fake exact completion percentages unless backend progress actually exists.

The transition should last only as long as the real request takes. If the server returns immediately, move directly to the result.

Respect `prefers-reduced-motion`.

## 9. Direct Result Screen

The result screen remains the center of the product.

Default visible hierarchy:

### Header

**We analyzed your AI usage**

Evidence window and source become secondary metadata.

### Result card

Display only:

- spend analyzed
- strongest supported finding
- evidence state
- savings state/value
- confidence where supported
- one recommended next action

Primary CTA should be action-specific:

- Test this optimization
- Generate implementation guidance
- Add more evidence

Secondary action:

**See why**

### Details

The existing deep material remains under progressive disclosure:

- proof timeline
- Work MRI
- evidence lineage
- limitations
- raw IDs / technical details where useful

The user should never need to understand Work MRI terminology to get first value.

## 10. Workbench Navigation

Keep the current shell architecture but simplify visible customer language.

Primary:

- Overview
- Data
- Savings

Advanced remains collapsed:

- Safety
- Tests
- Continuous telemetry
- Settings

Do not expand the navigation with internal lifecycle terminology.

The active state should feel stronger through contrast and a subtle indicator rather than a large decorative effect.

## 11. Motion System

Motion must communicate one of four things:

1. hierarchy
2. state change
3. causality
4. progress

If animation does none of these, remove it.

### Allowed patterns

- one-shot reveal
- staggered source ingestion
- number transition
- confidence/evidence-state transition
- hover elevation of interactive cards
- border/progress sweep during real processing
- disclosure open/close
- small navigation state transition

### Disallowed patterns

- endless floating cards
- gratuitous parallax
- random particles
- motion on every heading
- simultaneous scramble + shimmer + scale + glow
- looping animation near dense numerical results
- fake progress

### Accessibility

All motion must have a reduced-motion path.

No meaningful information may exist only in animation.

## 12. Frontend Architecture

Do not add a second animation dependency.

Continue using:
- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Framer Motion 13
- Lucide
- existing `cn` helper

Potential new focused components:

- `apps/web/components/marketing/evidence-engine-demo.tsx`
- `apps/web/components/marketing/evidence-source-flow.tsx`
- `apps/web/components/marketing/evidence-state-pill.tsx`
- `apps/web/components/workbench/analysis-progress.tsx`
- `apps/web/components/workbench/source-choice-card.tsx`
- `apps/web/components/workbench/direct-result-card.tsx`

Do not move backend logic into client components.

Server-rendered pages continue owning data retrieval and evidence truth. Client islands only own interaction and motion.

## 13. Current Component Changes

### Remove or retire

`apps/web/components/ui/container-scroll-animation.tsx`

Reason: its long 3D scroll transform is visually dramatic but does not communicate analytical causality and creates excessive page length.

Remove only after confirming no other route imports it.

### Update

- `apps/web/app/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/o/[organizationId]/page.tsx`
- `apps/web/components/workbench/workbench-shell.tsx`
- `apps/web/app/globals.css`

### Preserve backend behavior

No changes are required to:
- provider credential handling
- provider evidence normalization
- CSV analysis
- demo analysis pipeline
- evidence ranking semantics
- Potential/Tested/Verified integrity
- verified net savings calculations

## 14. Performance Budget

The wow effect must not come from expensive rendering.

Requirements:

- no WebGL for this release
- no video hero background
- no large canvas animation
- no animation framework in addition to Framer Motion
- hero text must render server-side and remain visible without JS
- animation client island should be isolated below/alongside hero content
- avoid layout shift
- avoid persistent high-frequency animation after the demo settles

## 15. Responsive Behavior

Mobile is not a compressed desktop experience.

On small screens:

- source flow stacks vertically
- evidence demo becomes sequential rather than spatially complex
- result card remains one-column
- CTA buttons become full-width where appropriate
- navigation uses existing mobile drawer
- no horizontal overflow
- no tiny multi-column metrics

## 16. Trust Requirements

Synthetic demo content must always be marked synthetic.

Provider connectors must continue to distinguish API-platform usage from consumer ChatGPT/Claude subscription usage.

Never claim:
- savings are achieved when modeled
- a connection has prompt-level visibility when it does not
- a benchmark has run when it has not
- a provider source contains latency/retry/quality data when it does not

## 17. Testing

### Component / unit

- evidence-state ordering stays correct
- direct result state renders Opportunity/Tested/Verified correctly
- source selection copy matches supported sources
- reduced-motion paths do not hide content

### E2E / browser

Desktop and mobile:

- homepage renders without overflow
- hero CTA works
- demo explanation is visibly synthetic
- sign-in copy no longer says CSV-first
- no-data workspace clearly exposes provider, CSV, and demo routes
- direct result remains the first result after analysis
- See details remains secondary
- keyboard focus is visible
- no console errors on core public routes

### Build

- TypeScript passes
- Next.js production build passes

## 18. Definition of Done

The redesign is complete when a skeptical startup founder can understand the product in one screen, see the product thinking in the next section, connect or upload data with minimal interpretation, and receive one clear result without learning Evalomics' internal methodology.

Target qualitative result:

- less explanation
- more product proof
- shorter homepage
- stronger source onboarding
- stronger direct answer
- semantic motion
- consistent evidence-state design
- no backend regression
- no trust regression

The final experience should feel like an expert analytical instrument, not an animated template.
