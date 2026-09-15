import { describe, expect, it } from 'vitest';
import {
  productionTelemetryEventSchema,
  productionTelemetryBatchSchema,
} from '../../src/efficiency/telemetry-contracts.js';
import { telemetryEventToUsageRecord } from '../../src/efficiency/telemetry-normalizer.js';

const event = {
  schemaVersion: 'production-telemetry-v1',
  eventId: 'evt-1',
  occurredAt: '2026-09-14T05:00:00Z',
  provider: 'openai',
  model: 'model-a',
  workload: 'classification',
  configurationId: 'cfg-1',
  operationId: 'op-1',
  attemptNumber: '1',
  retryCount: '0',
  outcome: 'SUCCESS',
  totalCost: '0.12',
  currency: 'USD',
  latencyMs: '420',
  inputTokens: '1200',
  cachedInputTokens: '200',
  cacheWriteTokens: '0',
  outputTokens: '80',
  outputCost: '0.02',
  toolCalls: '0',
  toolCost: '0',
  stablePrefixHash: null,
  stablePrefixTokens: null,
  cacheEligibleInputTokens: '500',
  outcomeValue: '1',
  outcomeUnit: 'resolved',
  tags: { surface: 'support' },
} as const;

describe('production telemetry contract', () => {
  it('accepts a bounded request-level event', () => {
    expect(productionTelemetryEventSchema.parse(event).eventId).toBe('evt-1');
  });

  it('rejects raw prompt or response fields instead of silently storing them', () => {
    expect(() =>
      productionTelemetryEventSchema.parse({
        ...event,
        prompt: 'customer secret prompt',
      }),
    ).toThrow();

    expect(() =>
      productionTelemetryEventSchema.parse({
        ...event,
        response: 'customer secret response',
      }),
    ).toThrow();
  });

  it('bounds batch size', () => {
    expect(
      productionTelemetryBatchSchema.parse({
        schemaVersion: 'production-telemetry-batch-v1',
        events: [event],
      }).events,
    ).toHaveLength(1);
  });

  it('normalizes successful events into request-granularity usage evidence', () => {
    const parsed = productionTelemetryEventSchema.parse(event);
    const usage = telemetryEventToUsageRecord({
      organizationId: 'org-1',
      event: parsed,
      sourceLine: 1,
      isDemo: false,
    });

    expect(usage.source).toBe('PRODUCTION_TELEMETRY');
    expect(usage.granularity).toBe('REQUEST');
    expect(usage.requests).toBe('1');
    expect(usage.successes).toBe('1');
    expect(usage.failures).toBe('0');
    expect(usage.totalCost).toBe('0.12');
    expect(usage.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
});
