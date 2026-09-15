import { createHash } from 'node:crypto';
import type { OpenAIAdminSnapshot } from './openai-admin.js';
import type {
  NormalizedProviderEvidence,
  ProviderCostEvidence,
  ProviderUsageEvidence,
} from '../provider-evidence.js';

function fingerprint(value: Readonly<Record<string, unknown>>): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function normalizeOpenAIAdminSnapshot(
  input: Readonly<{
    organizationId: string;
    snapshot: OpenAIAdminSnapshot;
  }>,
): NormalizedProviderEvidence {
  if (input.organizationId.trim().length === 0) {
    throw new Error('ORGANIZATION_ID_REQUIRED');
  }

  const usage: ProviderUsageEvidence[] = input.snapshot.usage.map((item) => {
    const canonical = Object.freeze({
      source: 'OPENAI_ADMIN_API' as const,
      provider: 'openai' as const,
      organizationId: input.organizationId,
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      requests: item.requests,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      cachedInputTokens: item.inputCachedTokens,
      model: item.model,
      projectId: item.projectId,
      apiKeyId: item.apiKeyId,
    });

    return Object.freeze({
      ...canonical,
      fingerprint: fingerprint(canonical),
    });
  });

  const costs: ProviderCostEvidence[] = input.snapshot.costs.map((item) => {
    const canonical = Object.freeze({
      source: 'OPENAI_ADMIN_API' as const,
      provider: 'openai' as const,
      organizationId: input.organizationId,
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      amount: item.amount,
      currency: item.currency,
      projectId: item.projectId,
      description: item.lineItem,
    });

    return Object.freeze({
      ...canonical,
      fingerprint: fingerprint(canonical),
    });
  });

  return Object.freeze({
    usage: Object.freeze(usage),
    costs: Object.freeze(costs),
  });
}
