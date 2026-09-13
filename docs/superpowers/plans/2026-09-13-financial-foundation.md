# Financial Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tested TypeScript economics library that preserves exact financial evidence and rejects misleading savings calculations.

**Architecture:** A pure rational arithmetic module feeds a Zod-validated economics boundary. Calculations produce immutable, JSON-safe formula records; they do not assign recommendation or verification states. This is the first independently testable milestone of the approved modular monolith.

**Tech Stack:** Node 24, TypeScript with strict checking, Zod, Vitest, ESLint, Prettier, npm lockfile, GitHub Actions.

**Spec:** `docs/superpowers/specs/-ai-optimizer-v0-design.md`, approved including Section 29 on 2026-09-13.

## Global Constraints

- All calculations operate on exact decimals. Rounding occurs only for display.
- Source money is stored as signed integer units at scale 12 (negative source costs remain invalid; calculated impacts may be negative).
- Division can produce repeating decimals, so derived ratios are retained as exact rational numerator/denominator pairs of integers, with positive denominators.
- Financial comparisons and chained calculations use those pairs, never rounded decimal intermediates or JavaScript Number.
- Missing fields remain `null` with a capability reason. They are never converted silently to zero.
- When the baseline is zero, savings percentage is unavailable. Every net-savings value names its time horizon.
- Normal tests never make paid API calls.
- Negative verified impact is displayed as a verified cost increase, never hidden or clamped to zero.

## Milestone Boundaries and Coverage

This plan implements spec sections 6 (TypeScript/testing foundation), 11 (math), 24.1 (financial tests), 24.4 (applicable CI gates), and 29.1 (exact fractions). Task 2 implements arithmetic inputs for 11.3, not the comparability or VERIFIED-state gate. It must explicitly label results as calculations, never proof of verified savings.

The next separate plan covers canonical usage, CSV ingestion, lineage, coverage, deterministic detectors, and benchmarks (sections 8, 10, 13–16, 20, 23, 29.2–29.5). A following workbench plan covers PostgreSQL/Drizzle, tenant authorization, passwordless authentication, state ledger, implementation tracking, UI, print reports, post-change verification, and end-to-end/security gates (sections 7, 12, 17–22, 24, 27, 29.6). Provider adapters and customer commercial validation retain the later gates in sections 9, 25, and 26. Neither this library build nor a synthetic arithmetic demo is a sellable V0.

## Workspace and Publication

The isolated directory is `/workspace/scratch/3e4d15147ac5/ai-cost-performance-optimizer` on `codex/financial-foundation`. Direct Git transport timed out; the baseline is a byte-verified materialization of GitHub commit `62730acb82156f5c915d7118cfedd7fcfc77fa91`. Local commits support review. Publish matching file trees through GitHub's Git Data API on the feature branch, parented to the actual remote commit; do not substitute local snapshot history for remote history. Verify remote content hashes and open a PR against main. No merge or deployment is part of this milestone.

## Task 1: Exact Rational Arithmetic and Test Infrastructure

**Files:**
- Create `package.json`, `package-lock.json`, `.gitignore`, `.prettierignore`, `.prettierrc.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`.
- Create `src/economics/exact.ts` and `tests/economics/exact.test.ts`.

**Interfaces:**
- Consumes only bigint/string inputs; no runtime dependencies.
- Produces the following exports. Rational values are normalized, frozen, and have a positive denominator. The constructor is the only supported creation boundary; public operations validate malformed denominator inputs defensively.

```ts
export type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;
export function rational(numerator: bigint, denominator?: bigint): Rational;
export function parseDecimal(value: string): Rational;
export function add(a: Rational, b: Rational): Rational;
export function subtract(a: Rational, b: Rational): Rational;
export function multiply(a: Rational, b: Rational): Rational;
export function divide(a: Rational, b: Rational): Rational;
export function compare(a: Rational, b: Rational): -1 | 0 | 1;
export function formatDecimal(value: Rational, places?: number): string;
export function serialize(value: Rational): Readonly<{ numerator: string; denominator: string }>;
```

`parseDecimal` accepts signed canonical decimal strings with 1–26 integer digits and up to 12 fractional digits (storage target NUMERIC(38,12)); rejects exponent notation, whitespace, plus signs, leading zeros except zero, negative zero, empty fractions, numbers, and overflow. Source-cost non-negativity is enforced in Task 2. Derived fractions are not constrained to source scale/size. `formatDecimal` uses half-even rounding, defaults to 2 places, allows integer places 0 through 12, pads zeros, and never emits negative zero. Converting a bounded presentation-place count to bigint is permitted; financial values never go through Number.

- [ ] **Step 1: Establish the reproducible test toolchain.** Resolve stable package versions from the registry once and pin the installed versions exactly. Set private true, type module, engines.node >=24, and the scripts below; commit the generated lockfile. Use strict ES2022/NodeNext TypeScript with declaration output in dist. Build excludes tests; typecheck includes tests. Exclude build/dependency/scratch output from formatting and linting.

```json
{
  "test": "vitest run",
  "typecheck": "tsc --noEmit",
  "build": "tsc -p tsconfig.build.json",
  "lint": "eslint src tests",
  "format:check": "prettier --check .",
  "format": "prettier --write .",
  "check": "npm run format:check && npm run lint && npm run typecheck && npm test && npm run build"
}
```

Install Zod as the sole runtime dependency. Dev dependencies: TypeScript, Vitest, ESLint, @eslint/js, typescript-eslint, Prettier, @types/node. Ignore node_modules, dist, coverage, .superpowers, .env files (allow .env.example), and local logs. Do not reformat the approved specification as a tooling side effect; ignore it for Prettier.

- [ ] **Step 2: Write the failing behavior tests.** Create a minimal throwing export surface if necessary so failures describe unimplemented behavior rather than resolution errors. The tests below are required; expand table-driven rejection and rounding cases to cover the interface rules.

```ts
import { describe, expect, it } from 'vitest';
import { add, parseDecimal, rational, divide, multiply, formatDecimal, serialize } from '../../src/economics/exact.js';
describe('exact financial evidence', () => {
  it('does not introduce binary floating point error', () => {
    expect(serialize(add(parseDecimal('0.1'), parseDecimal('0.2'))))
      .toEqual({ numerator: '3', denominator: '10' });
  });
  it('does not round a unit rate before multiplying back', () => {
    expect(serialize(multiply(divide(parseDecimal('1'), rational(3n)), rational(3n))))
      .toEqual({ numerator: '1', denominator: '1' });
  });
  it('rounds ties to even on either side of zero', () => {
    expect(formatDecimal(parseDecimal('1.005'))).toBe('1.00');
    expect(formatDecimal(parseDecimal('1.015'))).toBe('1.02');
    expect(formatDecimal(parseDecimal('-1.005'))).toBe('-1.00');
    expect(formatDecimal(parseDecimal('-0.005'))).toBe('0.00');
  });
});
```

Also test scale-12 input, values above Number.MAX_SAFE_INTEGER, source overflow, signed denominator normalization, zero denominator/divisor rejection, signed comparison, immutable output, zero serialization, 0/12 places, and invalid decimal/places inputs.

- [ ] **Step 3: Verify RED.** Run `npm test -- tests/economics/exact.test.ts`; record the expected assertion failures in the task report.

- [ ] **Step 4: Implement and refactor the exact module.** Use Euclidean gcd and bigint cross-products. The load-bearing algorithms are:

```ts
function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
// rational: reject denominator zero, normalize its sign, reduce by gcd,
// canonicalize zero to 0/1, and Object.freeze the returned record.
// add: (a.numerator*b.denominator + b.numerator*a.denominator) /
//      (a.denominator*b.denominator), reduced through rational.
// subtract, multiply, divide: the corresponding exact cross-products.
// compare: compare a.numerator*b.denominator with b.numerator*a.denominator.
// display, after normalizing and taking absolute numerator:
const scaled = magnitude * 10n ** BigInt(places);
let rounded = scaled / denominator;
const remainder = scaled % denominator;
if (2n * remainder > denominator ||
    (2n * remainder === denominator && rounded % 2n !== 0n)) rounded += 1n;
// Pad/split rounded.toString() at places; prefix '-' only if rounded > 0.
```

Do not use parseFloat, Number, Math rounding, or a decimal library with finite-precision intermediate division. Decimal parsing removes the decimal separator and uses a power-of-ten denominator. Return only canonical values.

- [ ] **Step 5: Verify GREEN and commit.** Run focused tests, then `npm run check`. Commit as `feat: add exact rational financial arithmetic` and report commands plus test counts.

## Task 2: Validated Economics, Formula Evidence, Demo, and CI

**Files:**
- Create `src/economics/contracts.ts`, `src/economics/calculations.ts`, `src/economics/index.ts`.
- Create `tests/economics/calculations.test.ts`, `examples/economics-demo.ts`, `README.md`, `.github/workflows/ci.yml`.
- Modify `package.json` for exports/demo and `package-lock.json` only if required by scripts.

**Interfaces:**
- Consumes all exact exports from Task 1.
- Produces Zod-validated public functions accepting unknown at the external boundary. Export inferred input types for callers. Values in requests are decimal strings/count strings; JSON numbers are rejected for money and count values.

```ts
export type Calculation = Readonly<{
  formulaVersion: 'economics-v1';
  formula: string;
  inputs: Readonly<Record<string, string | null>>;
  value: Readonly<{ numerator: string; denominator: string }> | null;
  unavailableReason: 'ZERO_DENOMINATOR' | 'MISSING_DENOMINATOR' | 'INSUFFICIENT_COVERAGE' | 'NON_POSITIVE_RECURRING_SAVING' | null;
}>;
export function costPerUnit(input: unknown): Calculation;
export function projectThirtyDays(input: unknown): Calculation;
export function netSavings(input: unknown): Calculation;
export function savingsPercentage(input: unknown): Calculation;
export function paybackMonths(input: unknown): Calculation;
export function counterfactualImpact(input: unknown): Calculation;
```

Input contracts (strict objects, reject unknown properties):

| Function | Required properties | Calculation |
|---|---|---|
| costPerUnit | totalCost, units (string or null), currency | totalCost / units; zero/null returns unavailable |
| projectThirtyDays | observedCost, coveredDays, currency | observedCost / coveredDays * 30; fewer than 7 returns INSUFFICIENT_COVERAGE |
| netSavings | baselineCost, candidateCost, implementationCost, operatingCost, currency, horizon | baselineCost - candidateCost - implementationCost - operatingCost |
| savingsPercentage | netSaving (signed), baselineCost, currency | netSaving / baselineCost * 100; zero baseline returns unavailable |
| paybackMonths | implementationCost, recurringMonthlyNetSaving (signed), currency | implementationCost / recurringMonthlyNetSaving; nonpositive recurring saving returns unavailable |
| counterfactualImpact | baselineCost, baselineUnits (string or null), actualPostCost, postUnits (string or null), implementationCost, operatingCost, currency, horizon | baselineCost / baselineUnits * postUnits - actualPostCost - implementationCost - operatingCost |

All money uses the source decimal format from Task 1; signed values allowed only where specified. Counts are canonical non-negative integers of at most 26 digits. Currency uses three uppercase ASCII letters checked against Intl.supportedValuesOf('currency'); mixed-currency aggregation/FX is deliberately absent because each operation accepts exactly one validated currency. horizon is 1–200 non-whitespace characters after trimming, required on net-impact calculations and preserved in evidence. No summing cross-currency records exists in this milestone. Zero post units is allowed but missing post units is unavailable. Zero baseline units takes precedence over missing post units; otherwise missing denominators return MISSING_DENOMINATOR.

Evidence records are deeply frozen at their three record levels (Calculation, inputs, fraction). Preserve the original validated decimal strings, currency, and horizon in inputs. A Calculation deliberately has no savings-state property: callers cannot treat arithmetic as proof of verified savings. formula is a stable descriptive expression naming its exact inputs; formulaVersion is versioned. The demo must explicitly say 'Synthetic demo data — not a customer result' and 'Arithmetic only — verification gates are not implemented'.

- [ ] **Step 1: Write failing behavior tests against a throwing public export surface.** Include these independent golden calculations and all contract rejection cases:

```ts
import { expect, it } from 'vitest';
import { netSavings, counterfactualImpact, projectThirtyDays } from '../../src/economics/calculations.js';
it('subtracts both costs without hiding a loss', () => {
  const result = netSavings({ baselineCost: '100', candidateCost: '120', implementationCost: '10', operatingCost: '5', currency: 'USD', horizon: 'first month' });
  expect(result.value).toEqual({ numerator: '-35', denominator: '1' });
  expect(result.inputs.horizon).toBe('first month');
});
it('scales baseline volume before subtracting actual incurred costs', () => {
  const result = counterfactualImpact({ baselineCost: '1', baselineUnits: '3', postUnits: '3', actualPostCost: '0.5', implementationCost: '0.1', operatingCost: '0.05', currency: 'USD', horizon: '2026-09-01/2026-09-08' });
  expect(result.value).toEqual({ numerator: '7', denominator: '20' });
});
it('does not invent a monthly projection from six days', () => {
  expect(projectThirtyDays({ observedCost: '60', coveredDays: '6', currency: 'USD' }).unavailableReason).toBe('INSUFFICIENT_COVERAGE');
});
```

Add: costPerUnit 1/3 exact, zero/null denominators, huge counts, projection 70/7*30 = 300, zero baseline percentage, -35/100*100 = -35%, payback 100/25 = 4 and nonpositive recurring returns unavailable, null post units, zero post units yielding negative incurred cost, rejected negative source costs/precision overflow/NaN/numeric money/malformed currency/extra fields/empty horizon, stable formula version, JSON-safe evidence and immutability. No mocks.

- [ ] **Step 2: Verify RED.** `npm test -- tests/economics/calculations.test.ts`; capture expected unimplemented-function failures before implementation.

- [ ] **Step 3: Implement contracts and formulas.** Zod parse occurs before every formula. Use schema composition and private helpers for denominator-unavailable records and fraction serialization without duplicating formula bodies. Example algorithm:

```ts
const counterfactual = multiply(
  divide(parseDecimal(data.baselineCost), rational(BigInt(data.baselineUnits))),
  rational(BigInt(data.postUnits)),
);
const net = subtract(subtract(subtract(counterfactual,
  parseDecimal(data.actualPostCost)), parseDecimal(data.implementationCost)),
  parseDecimal(data.operatingCost));
```

Every unavailable branch returns value null and a precise reason. All other branches return unavailableReason null and serialize the exact result. Keep calculations pure: no database, credentials, provider calls, or VERIFIED assignment. Document coverage inputs as supplied by a future coverage service; this function does not certify days as complete.

- [ ] **Step 4: Add the runnable demo and honest README.** `npm run demo` uses Node 24 TypeScript stripping (`node --experimental-strip-types examples/economics-demo.ts`) or compiled JS with an explicit script; use a compatible import path and typecheck it. Show the example counterfactual calculation and its exact 7/20 result, readable 0.35 USD, formula/inputs, and both mandatory labels. Document `npm ci`, `npm run check`, `npm run demo`, input limits, exact rounding policy, source-vs-derived precision, and remaining V0 milestones. Include authoritative tool references https://vitest.dev/guide/ and https://zod.dev/api and resolved tool versions in the lockfile; never claim broader product delivery.

- [ ] **Step 5: Wire CI.** On push/pull_request run checkout, setup-node 24 with npm cache, npm ci, npm run check, npm audit --audit-level=high, and a secret scan. Prefer the standalone gitleaks CLI (pinned release with checksum verification) or the maintained gitleaks action pinned by commit; use public-repo-compatible execution with read-only contents permissions. Do not publish the package. The production build for this milestone is the TypeScript library build, not a Next.js deployment.

- [ ] **Step 6: Verify GREEN and commit.** Run focused tests, then `npm run check`, `npm run demo`, and `npm audit --audit-level=high`. Capture any remote-only gate explicitly. Commit as `feat: add validated cost and savings calculations`.

## Final Review and Publication

- [ ] Run one whole-branch review after the task reviews; resolve material findings with focused regression tests.
- [ ] Publish the exact tracked file tree to codex/financial-foundation through the connected GitHub API, preserving remote ancestry.
- [ ] Verify the remote tree's blob hashes against the local tracked files and fetch the resulting commit.
- [ ] Open a PR with the scope, verification evidence, and remaining V0 work. Check GitHub Actions results; do not call a queued or blocked workflow passing.
