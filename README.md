# AI Cost Performance Optimizer — financial foundation

This milestone is an exact TypeScript arithmetic library for cost calculations. It validates JSON-shaped inputs, retains rational results as integer numerator/denominator pairs, and records formula evidence. A calculation is arithmetic evidence only; it does not assign a recommendation or VERIFIED savings state.

## Run locally

Node.js 24 or newer is required.

```sh
npm ci
npm run check
npm run demo
```

The demo uses synthetic inputs and shows the exact counterfactual result `7/20` plus its rounded display value, `0.35 USD`.

## Input and precision rules

- Money and counts arrive as strings. JSON numbers are rejected.
- Source money is canonical, non-negative decimal text with at most 26 integer digits and 12 fractional digits. Only `netSaving` and `recurringMonthlyNetSaving` accept signed source values.
- Counts are canonical non-negative integer strings with at most 26 digits. Missing supported counts remain `null`; they are not treated as zero.
- Currency is one uppercase three-letter code supported by the Node.js `Intl` currency list. Each calculation accepts one currency; aggregation and foreign exchange are outside this milestone.
- Net-impact horizons contain 1–200 characters after trimming and are preserved in evidence.
- Derived values remain reduced exact fractions. Rounding occurs only when a caller explicitly formats a value for display, using round-half-to-even with up to 12 places.
- Thirty-day projection accepts coverage days supplied by a future coverage service and requires at least seven. It does not certify that those days are complete.

Public schemas and inferred TypeScript input types are exported with the calculations from the package root. The locked tools include Zod 4.6.4 and Vitest 5.0.0; see the authoritative [Zod API](https://zod.dev/api) and [Vitest guide](https://vitest.dev/guide/).

## Remaining V0 work

This library is not a sellable V0. Later milestones add canonical usage ingestion and lineage, coverage verification, deterministic detectors and benchmarks, persistence and tenant authorization, authentication, state and implementation tracking, the workbench UI and reports, post-change verification, provider adapters, and commercial validation.
