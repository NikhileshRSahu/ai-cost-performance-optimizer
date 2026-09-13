import { counterfactualImpact, formatDecimal } from '../src/economics/index.js';

console.log('Synthetic demo data — not a customer result');
console.log('Arithmetic only — verification gates are not implemented');

const result = counterfactualImpact({
  baselineCost: '1',
  baselineUnits: '3',
  postUnits: '3',
  actualPostCost: '0.5',
  implementationCost: '0.1',
  operatingCost: '0.05',
  currency: 'USD',
  horizon: '2026-09-01/2026-09-08',
});

if (result.value !== null) {
  console.log(
    `Exact result: ${result.value.numerator}/${result.value.denominator}`,
  );
  console.log(
    `Readable result: ${formatDecimal({ numerator: BigInt(result.value.numerator), denominator: BigInt(result.value.denominator) })} USD`,
  );
}
console.log(`Formula: ${result.formula}`);
console.log('Inputs:', result.inputs);
