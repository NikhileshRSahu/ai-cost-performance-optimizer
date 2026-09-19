import { z } from 'zod';

const unsignedDecimal = /^(?:0|[1-9]\d{0,25})(?:\.\d{1,12})?$/;
const signedDecimal = /^-?(?:0|[1-9]\d{0,25})(?:\.\d{1,12})?$/;
const countPattern = /^(?:0|[1-9]\d{0,25})$/;
const supportedCurrencies = new Set(Intl.supportedValuesOf('currency'));
const sourceMoney = z.string().regex(unsignedDecimal);
const signedMoney = z
  .string()
  .regex(signedDecimal)
  .refine((v) => !/^-0(?:\.0+)?$/.test(v));
const count = z.string().regex(countPattern);
const currency = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .refine((v) => supportedCurrencies.has(v));
const horizon = z.string().trim().min(1).max(200);

export const costPerUnitInputSchema = z
  .object({ totalCost: sourceMoney, units: count.nullable(), currency })
  .strict();
export type CostPerUnitInput = z.infer<typeof costPerUnitInputSchema>;
export const projectThirtyDaysInputSchema = z
  .object({ observedCost: sourceMoney, coveredDays: count, currency })
  .strict();
export type ProjectThirtyDaysInput = z.infer<
  typeof projectThirtyDaysInputSchema
>;
export const netSavingsInputSchema = z
  .object({
    baselineCost: sourceMoney,
    candidateCost: sourceMoney,
    implementationCost: sourceMoney,
    operatingCost: sourceMoney,
    currency,
    horizon,
  })
  .strict();
export type NetSavingsInput = z.infer<typeof netSavingsInputSchema>;
export const savingsPercentageInputSchema = z
  .object({ netSaving: signedMoney, baselineCost: sourceMoney, currency })
  .strict();
export type SavingsPercentageInput = z.infer<
  typeof savingsPercentageInputSchema
>;
export const paybackMonthsInputSchema = z
  .object({
    implementationCost: sourceMoney,
    recurringMonthlyNetSaving: signedMoney,
    currency,
  })
  .strict();
export type PaybackMonthsInput = z.infer<typeof paybackMonthsInputSchema>;
export const counterfactualImpactInputSchema = z
  .object({
    baselineCost: sourceMoney,
    baselineUnits: count.nullable(),
    actualPostCost: sourceMoney,
    postUnits: count.nullable(),
    implementationCost: sourceMoney,
    operatingCost: sourceMoney,
    currency,
    horizon,
  })
  .strict();
export type CounterfactualImpactInput = z.infer<
  typeof counterfactualImpactInputSchema
>;
