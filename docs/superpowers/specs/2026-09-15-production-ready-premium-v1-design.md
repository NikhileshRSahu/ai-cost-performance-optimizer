# Evalomics Production-Ready Premium V1 Design

**Date:** 2026-09-15

## Goal

Ship Evalomics as a trustworthy, sellable public V1: Google sign-in provisions a private workspace reliably; a customer can complete the full evidence loop from import to verified savings; and the public + authenticated interfaces feel like one premium AI-efficiency instrument rather than a collection of pages.

## Product promise

**Find AI waste. Test safer fixes. Prove what actually improved.**

The UI must never collapse Potential, Tested, and Verified into one number. Research evidence, demo evidence, and customer evidence remain visibly distinct.

## Reference principles

We use current product-design principles from Linear, Vercel, and Ramp as references, not templates to copy:

- Linear: calmer hierarchy, predictable controls, reduced visual noise, consistent navigation.
- Vercel: workflow-first navigation, strong information architecture, developer-grade density.
- Ramp: spend intelligence as a working operational surface, not a decorative dashboard.

Evalomics differentiates through proof states, quality floors, decision sequencing, and explicit evidence boundaries.

## Production architecture

### Authentication

Keep Neon Auth as the identity provider. The public app owns the browser callback surface at `/api/auth/*` and proxies to Neon Auth. Cookies returned by Neon are rewritten so they are valid for the Evalomics origin. The runtime session resolver reads the Neon Auth session server-side and provisions the application identity transactionally on first authenticated request.

Required invariant:

`Google OAuth -> Evalomics callback -> Neon Auth session -> resolveRuntimeSession -> user -> organization -> OWNER membership -> /o/:organizationId`

No customer should land on a signed-in state without an application workspace.

### Product workflow

The production workflow remains:

`OBSERVE -> DETECT -> HYPOTHESIZE -> BENCHMARK -> RECOMMEND -> IMPLEMENT -> MEASURE -> VERIFY`

Customer-facing navigation simplifies this to:

`Evidence -> Work MRI -> Benchmark -> Implement -> Verify`

The existing import, workload, benchmark, implementation, verification, proof-pack, telemetry, and billing services remain the source of truth.

### Design system

The authenticated product and public site share the same design tokens and shell.

Visual direction: **Instrument / Intelligence with restrained cinematic depth**.

- Base: graphite / near-black product surfaces with neutral light explanation surfaces.
- Accent: emerald for verified/healthy states; blue for observed evidence; amber for potential opportunities.
- Typography: Geist Sans for interface and editorial copy; Geist Mono for metrics, IDs, and evidence.
- Radius: restrained 10–14px product surfaces; larger radii reserved for hero moments.
- Motion: tied to product meaning. No decorative motion that obscures evidence.
- Accessibility: full keyboard use, visible focus, WCAG AA color contrast, and reduced-motion fallbacks.

## Public experience

### Hero

The hero must show the product immediately, not only a slogan.

Left:
- "Find AI waste. Prove the fix."
- concise explanation
- primary CTA: Run the free Work MRI
- secondary CTA: See how proof works

Right:
- live-looking Work MRI instrument
- observed spend
- detected opportunities
- one selected optimization
- benchmark quality floor
- proof-state transition
- verified amount appears only in the Verified state

The animated background is subtle. It cannot reduce CTA contrast or readability.

### Scroll story

A sticky product walkthrough shows:

1. Evidence enters.
2. Waste signals are detected.
3. An optimization hypothesis is selected.
4. Baseline vs candidate benchmark runs.
5. Quality floor stays fixed.
6. Recommendation becomes Tested.
7. Implementation is recorded.
8. Post-change evidence upgrades the state to Verified.

The page uses compact explanatory copy around the product surface rather than long generic card grids.

## Authenticated application shell

Desktop:
- persistent 240px left navigation
- workspace identity at top
- primary workflow sections first
- secondary/admin sections grouped lower
- one clear current-state indicator
- command/search affordance reserved for future use

Mobile:
- compact top bar
- navigation in a sheet
- tables collapse into cards or horizontal scroll only when necessary

Primary nav:
- Overview
- Evidence
- Workloads
- Benchmark
- Verification
- Proof

Secondary nav:
- Guided demo
- AI history
- Telemetry
- Data & privacy
- Pilot & billing

## Overview / Work MRI

The overview becomes the operational home.

Top strip:
- Observed spend
- Potential opportunity
- Tested saving
- Verified net saving

Main area:
- Work MRI signal table
- strongest evidence-backed action
- evidence confidence
- limitation / refusal-to-guess
- next action

Proof timeline:
`Observed -> Opportunity -> Tested -> Implemented -> Verified`

Every metric is labeled by state and evidence source.

## Empty, loading, error, and demo states

Every production screen must have a designed state:

- empty: explain what evidence unlocks the screen
- loading: skeletons, no layout jumps
- error: recovery action with safe error copy
- demo: permanent visible demo badge and disclaimer
- insufficient evidence: explicit withheld claim and next evidence action

## Performance

- Heavy animated/background components load only where needed.
- WebGL falls back to a static gradient if unavailable.
- respect `prefers-reduced-motion`
- avoid client-side animation for static product data
- maintain server-rendered product workflow
- no unnecessary hydration of dashboard data

## Quality gates

Before merge:

1. `npm run check`
2. `npm run web:build`
3. `npm run test:db`
4. DB backup/restore drill
5. Playwright E2E
6. accessibility checks
7. npm audit high+
8. Docker build
9. gitleaks
10. production Vercel deployment READY
11. Neon application-user/workspace rows verified after real Google sign-in
12. full customer evidence loop verified against production or a production-equivalent preview

## Definition of done

Evalomics is ready to sell when:

- Google sign-in reliably creates or resolves the user's workspace.
- No cross-tenant data exposure is possible.
- The customer can import evidence, receive an evidence-backed diagnosis, benchmark a candidate, record implementation, and verify or block the result.
- A failed quality floor never becomes Verified.
- Public and authenticated UI are coherent, responsive, accessible, and premium.
- Production deployment is healthy and the complete workflow is proven with fresh evidence.
