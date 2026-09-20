# Evalomics Motion Language v1

## Principle
Motion is evidence choreography, not decoration.

The page should feel like one continuous analysis:
**usage enters → waste becomes visible → a safer alternative is tested → proof strengthens → verified impact remains.**

## Intensity scale
- Level 0: static conversion/trust content.
- Level 1: microinteraction (buttons, nav, small status changes).
- Level 2: section reveal / depth.
- Level 3: scroll-linked product explanation.
- Level 4: hero and counterfactual replay only.

No two adjacent scenes should both stay at Level 4.

## Timing
- micro: 160–240 ms
- component: 320–520 ms
- scene reveal: 650–950 ms
- analysis beat: 700–1200 ms
- ambient drift: 8–18 s

Primary easing: cubic-bezier(.22,.76,.24,1)
Settle easing: cubic-bezier(.16,1,.3,1)

## Spatial system
Three planes maximum on ordinary sections:
1. ambient field
2. content
3. interactive/proof object

Hero may use four planes.

Pointer parallax maximum:
- foreground: 3 px
- object: 4 px
- background: 7 px in opposite direction

## Color meaning
- neutral/ink: observed reality
- orange: waste, inefficiency, risk, unverified opportunity
- blue: tested/controlled alternative
- blue + proof treatment: verified evidence

Color transitions must follow evidence state, not random decoration.

## Typography
Large claims reveal with clipped vertical masks and staggered lines.
Body copy does not animate word-by-word.
The gradient word “disappears.” gets one authored reveal only; no looping shimmer.

## Scroll behavior
Native scrolling remains authoritative.
Scroll position may scrub transforms/opacity, but must never trap the user.
Pinned scenes are allowed only if they explain Test/Verify and remain short.
Reduced-motion mode removes all scrubbed/parallax behavior.

## Hero sequence
1. Kicker resolves.
2. Headline line masks reveal.
3. “disappears.” color field resolves.
4. Engine enters from shallow Z-depth.
5. Usage loaded.
6. Observed spend resolves.
7. Waste signal activates.
8. Counterfactual lane opens.
9. Cost/latency/quality bars resolve.
10. Evidence tier advances.

## Navigation
Floating glass nav remains calm.
After initial scroll it compresses slightly; no dramatic morph.
Active section indicator may slide.
CTA receives only subtle pointer attraction on fine-pointer devices.

## Footer
Motion decays toward zero near final conversion content.
