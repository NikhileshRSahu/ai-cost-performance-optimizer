import { z } from 'zod';

export type ProductEventName =
  | 'IMPORT_STARTED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'ANALYSIS_COMPLETED'
  | 'FIRST_MEANINGFUL_OPPORTUNITY'
  | 'BENCHMARK_STARTED'
  | 'BENCHMARK_COMPLETED'
  | 'RECOMMENDATION_VIEWED'
  | 'IMPLEMENTATION_GUIDE_VIEWED'
  | 'RECOMMENDATION_MARKED_IMPLEMENTED'
  | 'VERIFICATION_COMPLETED'
  | 'VERIFIED_SAVING_ACHIEVED';

export type ProductEventScalar = string | number | boolean | null;

export type ProductEvent = Readonly<{
  name: ProductEventName;
  organizationId: string;
  occurredAt: string;
  properties: Readonly<Record<string, ProductEventScalar>>;
}>;

const eventNameSchema = z.enum([
  'IMPORT_STARTED',
  'IMPORT_COMPLETED',
  'IMPORT_FAILED',
  'ANALYSIS_COMPLETED',
  'FIRST_MEANINGFUL_OPPORTUNITY',
  'BENCHMARK_STARTED',
  'BENCHMARK_COMPLETED',
  'RECOMMENDATION_VIEWED',
  'IMPLEMENTATION_GUIDE_VIEWED',
  'RECOMMENDATION_MARKED_IMPLEMENTED',
  'VERIFICATION_COMPLETED',
  'VERIFIED_SAVING_ACHIEVED',
]);

const baseSchema = z
  .object({
    name: eventNameSchema,
    organizationId: z.string().trim().min(1),
    occurredAt: z.iso.datetime({ offset: true }),
    properties: z.record(z.string(), z.unknown()),
  })
  .strict();

const unsafeKey =
  /(prompt|response|credential|secret|token|header|body|row|errorMessage)/i;

const exactSafeKeys = new Set([
  'state',
  'count',
  'durationMs',
  'money',
  'safeErrorCategory',
]);

function safeKey(key: string): boolean {
  if (unsafeKey.test(key)) return false;
  return (
    exactSafeKeys.has(key) ||
    /(?:Id|Count|Ms|State|Amount|Money|Category)$/.test(key)
  );
}

function validateScalar(value: unknown): ProductEventScalar {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new Error('UNSAFE_PRODUCT_EVENT_PROPERTY');
    return value;
  }
  if (typeof value === 'string') {
    if (value.length > 200) throw new Error('UNSAFE_PRODUCT_EVENT_PROPERTY');
    return value;
  }
  throw new Error('UNSAFE_PRODUCT_EVENT_PROPERTY');
}

export function createProductEvent(input: unknown): ProductEvent {
  const data = baseSchema.parse(input);
  const properties: Record<string, ProductEventScalar> = {};

  for (const [key, value] of Object.entries(data.properties)) {
    if (!safeKey(key)) throw new Error('UNSAFE_PRODUCT_EVENT_PROPERTY');
    properties[key] = validateScalar(value);
  }

  return Object.freeze({
    name: data.name,
    organizationId: data.organizationId,
    occurredAt: data.occurredAt,
    properties: Object.freeze(properties),
  });
}
