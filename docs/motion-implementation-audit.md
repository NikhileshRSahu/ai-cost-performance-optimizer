# Evalomics Cinematic Motion Pass — implementation audit

Date: 2026-09-21
Baseline: `main`

## Goal
Raise the landing-page motion craft to a premium continuous scene system without copying GattyWorks assets/layout or weakening Evalomics' answer-first product story.

## Current state

### Keep
- `MarketingHome.tsx` product narrative and evidence semantics: Observe → Detect → Test → Verify.
- `HeroEconomicsEngine.tsx` as the live product-demo foundation.
- `EvalomicsVisualSystem.tsx` WebGL canvas lifecycle patterns: DPR cap, visibility pause, low-power context, pointer input, reduced-motion support.
- Existing accessibility controls, sample-data disclosure, trust copy, and release-truth tests.
- Existing backend/dashboard/product logic. This pass is public marketing motion only.

### Modify
- Current hero shader: visually atmospheric but semantically generic. Convert it into a branded economics/request-flow field.
- Hero entrance: current elements are visually polished but mostly static after mount. Add one coordinated entrance timeline and scroll depth.
- Economics engine: current `setInterval` rotates evidence states every 2.4 s regardless of visibility and does not tell a causal analysis story. Replace with visibility-aware staged playback and explicit transition states.
- Section transitions: current landing jumps directly between conventional content sections. Add breathing-space transition scenes and scroll-linked continuity.
- Manifesto and proof sections: currently hover-card driven. Turn the middle of the page into Observe/Detect/Test/Verify scenes.
- Navigation: retain glass treatment, add restrained scroll-state compression and active-section behavior.
- Lower-page motion: keep quiet and conversion-focused.

### Remove / avoid
- Do not add motion libraries merely because they are available.
- Do not run React Three Fiber across the whole page.
- Do not use generic particles, excessive floating cards, continuous glow, scroll-jacking, or identical fade-up reveals.
- Do not animate layout properties on every frame.
- Do not copy GattyWorks composition, copy, color system, or assets.
- Do not alter product truth semantics for visual drama.

## Technical findings
- Runtime dependencies currently do not include GSAP, Lenis, Framer Motion, R3F, or ShaderGradient.
- The present WebGL field is custom WebGL and already handles low-power context, DPR <= 1.5, visibility pause, and reduced motion.
- Global CSS is large and contains multiple generations of visual-system rules. New motion styles should be isolated behind cinematic component classes instead of adding more generic selectors.
- Hero engine animation is interval-based, not scroll/visibility-aware.
- CSS animation is presently used for comparison bars and hover transitions; there is no shared motion timing/token layer.
- Current landing content is rendered client-side because `MarketingHome` is a client component.
- CSP currently permits same-origin scripts/styles and Vercel analytics; no external animation CDN is required or desired.

## Architecture decision
Start without new third-party motion dependencies. Use:
1. React state/effects for semantic UI sequences.
2. CSS transforms, opacity, masks, and custom properties for high-frequency visual movement.
3. IntersectionObserver and requestAnimationFrame for scroll/pointer orchestration.
4. Existing custom WebGL only where it materially adds depth.

Re-evaluate GSAP/Lenis only after the first two cinematic scenes are built. If native orchestration becomes brittle, introduce them deliberately with a measured bundle/performance cost.

## Motion quality gates
Each implemented scene must pass:
1. **Meaning:** motion explains a product idea.
2. **Hierarchy:** one dominant event, supporting movement remains subtle.
3. **Continuity:** entry and exit connect to adjacent scenes.
4. **Performance:** transforms/opacity preferred; WebGL paused offscreen/hidden.
5. **Accessibility:** reduced-motion mode is complete, not cosmetic.
6. **Mobile:** expensive depth effects degrade gracefully.
7. **Truth:** sample, potential, tested, and verified states remain explicit.

## Implementation sequence
1. Motion tokens + runtime observer primitives.
2. Hero entrance and semantic economics field.
3. Visibility-aware economics-engine analysis sequence.
4. Hero → waste-signal transition ribbon.
5. Observe/Detect scene.
6. Test/counterfactual scene.
7. Verify evidence scene.
8. Navigation + microinteractions.
9. Lower-page restraint pass.
10. Performance/accessibility QA and preview deployment.
