# Evalomics Full Product Design System
Date: 2026-09-19

## 1. Reference baseline

The visual baseline is the approved Vercel deployment:

- Deployment: `dpl_CE2Cdud7YXJrzMtn3CkHPZPgYDse`
- Commit: `1cc65e8f6923bbb13362b623d17b9ba9e939576b`
- Branch: `ui/launch-ui-evalomics`
- Product: Evalomics

This deployment is the source of truth for the public visual language: near-black surfaces, warm amber atmospheric glow, cyan/teal intelligence accents, restrained glass borders, large geometric typography, deep spacing, and cinematic screenshot treatment.

The redesigned product must look like the same company built every screen.

## 2. Product outcome

Evalomics should make AI cost optimization feel simple, trustworthy, and actionable.

Primary user journey:

1. Connect OpenAI / Anthropic or upload CSV.
2. Evalomics confirms data is available.
3. Analysis starts automatically.
4. User lands on one clear result.
5. User sees the strongest supported opportunity and one recommended action.
6. Optional `See details` reveals deeper evidence.
7. User can test a recommended change against the quality floor.
8. Tested changes can be implemented.
9. Production evidence is reconciled.
10. Only reconciled outcomes become `Verified`.

No default wizard should force users through Data → Safety → Test → Apply → Verify before they can understand their result.

## 3. Evidence model

The product must never collapse all savings into one number.

Use four explicit maturity states:

- Observed — facts from imported/provider usage.
- Potential — modeled or estimated opportunity.
- Tested — benchmarked result that passed the defined test conditions.
- Verified — measured production outcome after reconciliation.

Visual semantics:

- Observed: neutral/cyan.
- Potential: amber.
- Tested: cool cyan/blue.
- Verified: teal/green.

Every savings number must carry its maturity label close to the value.

## 4. Visual system

### 4.1 Color

Base:
- App background: near-black / charcoal.
- Raised surfaces: dark blue-black.
- Borders: low-opacity white/cool gray.

Accents:
- Cyan/teal: intelligence, active state, connected sources, analysis.
- Amber: opportunity, attention, modeled upside, atmospheric lighting.
- Green/teal: verified outcome and passed quality gates.
- Red only for destructive/error states.

Use amber primarily as ambient depth and opportunity emphasis, not as a generic brand color on every component.

### 4.2 Typography

Marketing:
- Very large display headlines.
- Tight tracking.
- Short line lengths.
- Strong contrast between headline and muted supporting copy.

Product:
- More compact hierarchy.
- Clear page title, metric value, label, evidence state, and next action.
- Monospace may be used selectively for source IDs, model names, costs, and technical evidence.

### 4.3 Surfaces

Use:
- low-contrast 1px borders,
- subtle inner highlight,
- soft dark shadows,
- minimal glass blur,
- rounded corners consistent across the app.

Avoid:
- excessive floating cards,
- random gradients,
- white cards,
- unrelated dashboard visual styles,
- decorative 3D inside dense operational workflows.

### 4.4 Motion

Marketing motion can be cinematic:
- sticky scroll,
- stacked screenshots,
- mild perspective,
- parallax,
- slow zoom,
- controlled glow movement.

Product motion should be functional:
- upload confirmation,
- analysis progress,
- panel reveal,
- evidence-state transition,
- benchmark running/completion,
- verified-success transition.

Respect `prefers-reduced-motion`.

## 5. Shared shell

Create one common product shell for authenticated/operational screens:

- Evalomics logo / workspace identity.
- Compact side navigation or equivalent adaptive navigation.
- Main content region.
- Consistent top-level actions.
- Shared page-header pattern.
- Shared status badges.
- Shared evidence cards.
- Shared empty/loading/error states.

The public marketing shell and app shell should share tokens and components but use different density.

## 6. Public landing page

Preserve the approved hero and overall visual language.

### Section 1 — Hero
Purpose: establish the promise.

Message direction:
- make AI economics visible,
- understand spend,
- find safe optimization opportunities,
- verify outcomes.

### Section 2 — Cinematic product story
Replace the repetitive diagnosis composition with a Launch-style three-screen stack.

Behavior:
- sticky section,
- three overlapping Evalomics screens visible,
- scroll-linked translation/scale/rotation,
- one screen exits as the fourth state enters,
- no random floating cards,
- no fake cursor autoplay.

Content progression:
1. Connect/upload.
2. Analyze usage.
3. Detect supported opportunity.
4. Verify outcome.

### Remaining landing sections
Keep capabilities, proof, trust, pricing/CTA content consistent with the same design tokens and remove redundant explanations.

## 7. Start / source selection

Goal: one decision, minimal friction.

Screen:
- headline: connect your AI usage,
- three clear source choices: OpenAI, Anthropic, CSV,
- short privacy/trust copy,
- one primary CTA per selected source.

CSV:
- drag/drop or browse,
- immediate filename and upload state,
- clear success confirmation,
- analysis starts or CTA becomes obvious.

Providers:
- clear connection state,
- no unnecessary form fields,
- explain only what permission is needed.

## 8. Analysis state

After source success:

- show that data was received,
- show what is being analyzed,
- provide believable progress,
- avoid dead/loading blank screens,
- transition automatically to result when ready.

Suggested visible stats:
- requests analyzed,
- spend observed,
- providers/models detected.

## 9. Direct result screen

This is the primary product value screen.

Default view should show only:

- Observed spend.
- Biggest supported saving opportunity.
- Tested saving, if available.
- Verified saving, if available.
- Confidence / evidence maturity.
- One recommended action.
- One primary CTA.
- `See details`.

Do not force users into a multi-tab research workflow to understand the result.

## 10. See details / evidence drawer or page

Reveal deeper material only when requested:

- evidence window,
- Work MRI,
- constraints,
- benchmark details,
- raw/source IDs,
- limitations,
- methodology,
- verification logic,
- model/prompt/context patterns,
- lineage of each claim.

This view can be denser and more technical while retaining the same visual language.

## 11. Opportunities

Each opportunity must answer:

- What is happening?
- Why does it cost money?
- How much is potentially avoidable?
- How confident are we?
- What is the recommended action?
- What evidence supports it?
- Has it been tested?

Cards should not look like generic analytics widgets.

## 12. Testing / benchmark

Purpose: prove an optimization is safe enough to consider.

Show:
- current configuration,
- proposed configuration,
- cost delta,
- quality metric / quality floor,
- latency if relevant,
- benchmark sample/evidence,
- pass/fail state,
- limitations.

Savings remain `Tested`, not `Verified`, after a successful benchmark.

## 13. Verification

This is the strongest proof screen.

Show a clear maturity chain:

Potential → Tested → Verified

Verified requires:
- production evidence,
- measured post-change outcome,
- reconciliation against baseline,
- quality floor still respected.

The UI must make it impossible to visually confuse a projection with a verified result.

## 14. Work MRI

Use the same visual language to map:
- products/workflows,
- models,
- prompts,
- context size,
- tool usage,
- repeated patterns,
- spend concentration.

This is an optional deeper diagnostic surface, not the default onboarding burden.

## 15. Calculator / supporting tools

Model calculator and other tools should use:
- same app shell,
- same inputs,
- same metric cards,
- same buttons,
- same semantic colors,
- same result-state language.

They should feel like native Evalomics tools, not separate microsites.

## 16. Auth

Where UI is controlled by Evalomics:
- use the same dark surfaces,
- concise copy,
- one primary action,
- no unnecessary white containers,
- preserve trust and security clarity.

OAuth/provider-hosted screens are not restyled beyond what the provider allows.

## 17. Empty, error, and recovery states

Every key screen needs:
- loading,
- empty,
- partial-data,
- provider-auth failure,
- malformed CSV,
- analysis failure,
- no-opportunity-found,
- benchmark failure,
- verification-insufficient-evidence states.

Each state should explain:
1. what happened,
2. what data is safe,
3. what the user can do next.

## 18. Accessibility

- Maintain readable contrast.
- Do not rely on color alone for evidence maturity.
- Keyboard-visible focus states.
- Semantic buttons/links.
- Motion reduction.
- Avoid tiny technical text in primary flows.
- Product cards must remain legible at common laptop widths.

## 19. Responsive behavior

Desktop:
- cinematic landing,
- full app shell.

Tablet:
- reduce perspective and overlap,
- keep primary metrics readable.

Mobile:
- marketing stack becomes sequential cards/screens,
- product navigation becomes compact/drawer-based,
- direct result remains a single clear vertical hierarchy,
- no tiny desktop dashboard scaled down.

## 20. Component system

Create reusable primitives instead of page-specific CSS:

- PageShell
- MarketingSection
- ProductPanel
- MetricCard
- EvidenceBadge
- EvidenceProgression
- PrimaryAction
- SecondaryAction
- SourceCard
- StatusBanner
- AnalysisProgress
- OpportunityCard
- QualityGate
- VerificationCard
- EmptyState
- ErrorState
- DetailDrawer / DetailPanel

Tokens should live centrally and be consumed by both marketing and product UI.

## 21. Implementation boundary

Preserve current backend/domain behavior unless a mismatch blocks the intended user flow.

Do not:
- rewrite ingestion logic solely for design,
- invent verified savings,
- merge Potential/Tested/Verified semantics,
- replace working provider integrations without cause,
- change production before preview verification.

Frontend and backend must agree on evidence maturity and source lineage.

## 22. Migration order

1. Shared tokens and primitives.
2. Public landing shell and section-2 stack.
3. Start/source connection.
4. Analysis state.
5. Direct result dashboard.
6. See-details evidence surface.
7. Opportunities.
8. Benchmark/testing.
9. Verification.
10. Work MRI.
11. Calculator and supporting routes.
12. Auth and legal/supporting pages.
13. Responsive and accessibility QA.
14. Full browser flow verification.
15. Preview review.
16. Production promotion only after approval.

## 23. Acceptance criteria

The redesign is complete when:

- every major route visibly belongs to the same Evalomics design system,
- connect/upload → result is the shortest default path,
- deeper evidence is optional,
- evidence maturity is explicit everywhere,
- no screen uses the old white/generic visual language,
- no primary workflow requires unnecessary manual fields,
- desktop and mobile remain usable,
- existing backend behavior still works,
- a full browser pass covers source selection, upload/connect, analysis, result, details, test, and verification,
- the user approves the preview before production promotion.
